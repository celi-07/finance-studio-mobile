import type { SupabaseClient } from '@supabase/supabase-js';
import { emptyWorkspace, type Collection, type Workspace } from '../domain/ledger';
import { ConflictError, matchSnapshot, samePayload } from './concurrency';

export type Row<K extends Collection = Collection> = Workspace[K][number];
export interface Repository {
  load(): Promise<Workspace>;
  save<K extends Collection>(collection: K, row: Row<K>, original?: Row<K>): Promise<Row<K>>;
  remove<K extends Collection>(collection: K, original: Row<K>): Promise<void>;
}
function issue(error: { code?: string; message: string }): Error {
  if (error.code === 'P0001') return Error(error.message);
  if (error.code === '23505')
    return Error('A record with these details already exists. Refresh to review it.');
  if (error.code === '23503')
    return Error('This record is linked to other records. Refresh and review those first.');
  if (error.code === '42501') return Error('Verify your email to access these records.');
  return Error(
    'Couldn’t reach Finance Studio. Check your connection and retry. Your draft is still here.',
  );
}
export function cloudRepository(client: SupabaseClient, userId: string): Repository {
  return {
    async load() {
      const collections = Object.keys(emptyWorkspace) as Collection[];
      const pairs = await Promise.all(
        collections.map(async (collection) => {
          const rows: unknown[] = [];
          // Keyset pagination avoids skipped/duplicated rows when another device inserts.
          let after: string | undefined;
          for (;;) {
            let query = client
              .from(collection)
              .select('*')
              .eq('user_id', userId)
              .order('id')
              .limit(500);
            if (after) query = query.gt('id', after);
            const { data, error } = await query;
            if (error) throw issue(error);
            rows.push(...data);
            if (data.length < 500) break;
            after = data.at(-1)!.id;
          }
          return [collection, rows];
        }),
      );
      return Object.fromEntries(pairs) as Workspace;
    },
    async save(collection, row, original) {
      const {
        user_id: _owner,
        created_at: _created,
        updated_at: _updated,
        ...fields
      } = row as unknown as Record<string, unknown>;
      const payload = { ...fields, user_id: userId };
      if (original) {
        const query = matchSnapshot(
          client.from(collection).update(payload).eq('user_id', userId).eq('id', row.id),
          original as unknown as Record<string, unknown>,
        );
        const { data, error } = await query.select('*').maybeSingle();
        if (error) throw issue(error);
        if (!data) throw new ConflictError();
        return data as typeof row;
      }
      // Stable IDs belong to the draft. Retrying an uncertain insert cannot duplicate money.
      const { data, error } = await client.from(collection).insert(payload).select('*').single();
      if (!error) return data as typeof row;
      if (error.code === '23505') {
        const existing = await client
          .from(collection)
          .select('*')
          .eq('user_id', userId)
          .eq('id', row.id)
          .maybeSingle();
        if (!existing.error && existing.data && samePayload(existing.data, payload))
          return existing.data as typeof row;
      }
      throw issue(error);
    },
    async remove(collection, original) {
      const query = matchSnapshot(
        client.from(collection).delete().eq('user_id', userId).eq('id', original.id),
        original as unknown as Record<string, unknown>,
      );
      const { data, error } = await query.select('id');
      if (error) throw issue(error);
      if (!data?.length) throw new ConflictError();
    },
  };
}
