import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemo } from '../domain/demo';
import { emptyWorkspace, type Workspace } from '../domain/ledger';
import { ConflictError, samePayload } from './concurrency';
import type { Repository } from './repository';
const key = 'finance-studio.mobile.demo.v1';

export function demoRepository(): Repository {
  let current: Workspace | undefined;
  async function load() {
    if (current) return current;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Object.keys(emptyWorkspace).every((collection) => Array.isArray(parsed[collection])))
        throw Error('Demo storage could not be read. Clear the app’s demo storage to reset it.');
      current = parsed;
    } else current = createDemo();
    return current!;
  }
  async function commit(next: Workspace) {
    await AsyncStorage.setItem(key, JSON.stringify(next));
    current = next;
  }
  return {
    load,
    async save(collection, row, original) {
      const data = await load();
      const existing = data[collection].find((item) => item.id === row.id);
      if (original && (!existing || !samePayload(existing, original))) throw new ConflictError();
      if (!original && existing && !samePayload(existing, row)) throw new ConflictError();
      await commit({
        ...data,
        [collection]: [...data[collection].filter((item) => item.id !== row.id), row],
      });
      return row;
    },
    async remove(collection, original) {
      const data = await load();
      const existing = data[collection].find((item) => item.id === original.id);
      if (!existing || !samePayload(existing, original)) throw new ConflictError();
      await commit({
        ...data,
        [collection]: data[collection].filter((item) => item.id !== original.id),
      });
    },
  };
}
