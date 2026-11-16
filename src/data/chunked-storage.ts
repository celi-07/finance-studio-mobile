import { SerialQueue } from './concurrency';
type Backend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};
/** Serialized, generation-based storage: readers see either the old session or the whole new one. */
export function createChunkedStorage(backend: Backend, generationId: () => string) {
  const queue = new SerialQueue();
  async function clear(key: string, manifest: string | null) {
    if (!manifest) return;
    const { generation, count } = JSON.parse(manifest);
    for (let i = 0; i < count; i++) await backend.removeItem(`${key}.${generation}.${i}`);
  }
  return {
    getItem: (key: string) =>
      queue.run(async () => {
        const manifest = await backend.getItem(key);
        if (!manifest) return null;
        const { generation, count } = JSON.parse(manifest);
        if (
          typeof generation !== 'string' ||
          !Number.isInteger(count) ||
          count < 0 ||
          count > 10_000
        )
          throw Error('Your stored session is invalid. Sign in again.');
        const chunks = await Promise.all(
          Array.from({ length: count }, (_, i) => backend.getItem(`${key}.${generation}.${i}`)),
        );
        if (chunks.some((value) => value === null))
          throw Error('Your stored session is incomplete. Sign in again.');
        return chunks.join('');
      }),
    setItem: (key: string, value: string) =>
      queue.run(async () => {
        const previous = await backend.getItem(key);
        const generation = generationId();
        // Split on code points so Unicode surrogate pairs survive across chunks.
        const chars = Array.from(value);
        const count = Math.ceil(chars.length / 400);
        const manifest = JSON.stringify({ generation, count });
        try {
          for (let i = 0; i < count; i++)
            await backend.setItem(
              `${key}.${generation}.${i}`,
              chars.slice(i * 400, (i + 1) * 400).join(''),
            );
          await backend.setItem(key, manifest);
        } catch (error) {
          await clear(key, manifest).catch(() => {});
          throw error;
        }
        await clear(key, previous).catch(() => {});
      }),
    removeItem: (key: string) =>
      queue.run(async () => {
        const previous = await backend.getItem(key);
        await backend.removeItem(key);
        await clear(key, previous).catch(() => {});
      }),
  };
}
