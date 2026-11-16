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
  constructor(private repository: Repository) {}
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
    this.listeners.clear();
  }
  async refresh() {
    if (this.disposed || this.pending) return;
    const ticket = ++this.ticket;
    this.patch({ refreshing: true, error: '' });
    try {
      const data = await this.repository.load();
      if (ticket === this.ticket) this.patch({ data, syncedAt: Date.now() });
    } catch (error) {
      if (ticket === this.ticket)
        this.patch({
          error: error instanceof Error ? error.message : 'Couldn’t refresh your records.',
        });
    } finally {
      if (ticket === this.ticket) this.patch({ loading: false, refreshing: false });
    }
  }
  private async write(operation: () => Promise<void>) {
    this.pending++;
    this.ticket++; // Invalidate any read that began before this write.
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
