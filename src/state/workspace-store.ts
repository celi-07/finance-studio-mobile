import { emptyWorkspace, type Collection } from '../domain/ledger';
import { SerialQueue } from '../data/concurrency';
import type { Repository, Row } from '../data/repository';

export class WorkspaceStore {
  private queue = new SerialQueue();
  private listeners = new Set<() => void>();
  private ticket = 0;
  private disposed = false;
  private pending = 0;
  private state = {
    data: emptyWorkspace,
    loading: true,
    refreshing: false,
    saving: false,
    error: '',
    syncedAt: 0,
  };
  private refreshTask?: { controller: AbortController; promise: Promise<void> };
  constructor(
    private repository: Repository,
    private options: { refreshTimeoutMs?: number } = {},
  ) {}
  private cancelRefresh() {
    this.refreshTask?.controller.abort();
    this.refreshTask = undefined;
  }
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private patch(change: Partial<typeof this.state>) {
    if (this.disposed) return;
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  dispose() {
    this.disposed = true;
    this.ticket++;
    this.cancelRefresh();
    this.listeners.clear();
  }
  refresh({ background = false } = {}): Promise<void> {
    if (this.disposed || this.pending) return Promise.resolve();
    if (background && this.refreshTask) return this.refreshTask.promise;
    const ticket = ++this.ticket;
    this.cancelRefresh();
    const controller = new AbortController();
    const aborted = new Promise<never>((_, reject) => {
      controller.signal.addEventListener(
        'abort',
        () =>
          reject(
            new Error(
              'Refreshing took too long. Check your connection and try again. Your displayed records are unchanged.',
            ),
          ),
        { once: true },
      );
    });
    const timer = setTimeout(() => controller.abort(), this.options.refreshTimeoutMs ?? 15_000);
    this.patch({ refreshing: true, error: '' });
    const promise = (async () => {
      try {
        const data = await Promise.race([
          Promise.resolve().then(() => this.repository.load(controller.signal)),
          aborted,
        ]);
        if (ticket === this.ticket) this.patch({ data, syncedAt: Date.now() });
      } catch (error) {
        if (ticket === this.ticket)
          this.patch({
            error: error instanceof Error ? error.message : 'Couldn’t refresh your records.',
          });
      } finally {
        clearTimeout(timer);
        controller.abort();
        if (this.refreshTask?.controller === controller) this.refreshTask = undefined;
        if (ticket === this.ticket) this.patch({ loading: false, refreshing: false });
      }
    })();
    this.refreshTask = { controller, promise };
    return promise;
  }
  private async write(operation: () => Promise<void>) {
    this.pending++;
    this.ticket++; // Invalidate any read that began before this write.
    this.cancelRefresh();
    this.patch({ saving: true, refreshing: false });
    try {
      await this.queue.run(async () => {
        if (this.disposed) throw Error('Your session changed. Sign in again before saving.');
        await operation();
      });
    } finally {
      this.pending--;
      this.ticket++;
      this.patch({ saving: this.pending > 0 });
      if (!this.pending && !this.disposed) void this.refresh();
    }
  }
  save = async <K extends Collection>(collection: K, row: Row<K>, original?: Row<K>) =>
    this.write(async () => {
      const saved = await this.repository.save(collection, row, original);
      const rows = this.state.data[collection] as Row<K>[];
      this.patch({
        data: {
          ...this.state.data,
          [collection]: [...rows.filter((item) => item.id !== row.id), saved],
        },
      });
    });
  remove = async <K extends Collection>(collection: K, original: Row<K>) =>
    this.write(async () => {
      await this.repository.remove(collection, original);
      this.patch({
        data: {
          ...this.state.data,
          [collection]: this.state.data[collection].filter((item) => item.id !== original.id),
        },
      });
    });
}
