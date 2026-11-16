import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { SerialQueue, ConflictError, matchSnapshot, samePayload } from '../src/data/concurrency.ts';
import { cloudRepository } from '../src/data/repository.ts';
import { WorkspaceStore } from '../src/state/workspace-store.ts';
import { emptyWorkspace } from '../src/domain/ledger.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));
const workspace = (name) => ({ ...emptyWorkspace, finance_books: [{ id: 'book', name }] });
function repository(overrides = {}) {
  return {
    load: async () => emptyWorkspace,
    save: async (_collection, row) => row,
    remove: async () => {},
    ...overrides,
  };
}

test('writes serialize; failure of one write does not block later work', async () => {
  const queue = new SerialQueue();
  const first = deferred();
  const events = [];
  const a = queue.run(async () => {
    events.push('a-start');
    await first.promise;
    events.push('a-end');
    throw Error('rejected');
  });
  const rejected = assert.rejects(a, /rejected/);
  const b = queue.run(async () => {
    events.push('b');
    return 2;
  });
  await tick();
  assert.deepEqual(events, ['a-start']);
  first.resolve();
  await rejected;
  assert.equal(await b, 2);
  assert.deepEqual(events, ['a-start', 'a-end', 'b']);
});

test('a slow older refresh never replaces a newer refresh', async () => {
  const a = deferred(),
    b = deferred();
  let calls = 0;
  const store = new WorkspaceStore(
    repository({ load: () => (++calls === 1 ? a.promise : b.promise) }),
  );
  const oldRead = store.refresh(),
    newRead = store.refresh();
  b.resolve(workspace('new'));
  await newRead;
  a.resolve(workspace('old'));
  await oldRead;
  assert.equal(store.snapshot().data.finance_books[0].name, 'new');
  assert.equal(store.snapshot().loading, false);
});

test('an in-flight read cannot undo a committed mutation', async () => {
  const stale = deferred(),
    fresh = deferred();
  let reads = 0;
  const store = new WorkspaceStore(
    repository({ load: () => (++reads === 1 ? stale.promise : fresh.promise) }),
  );
  const loading = store.refresh();
  await store.save('finance_books', { id: 'book', name: 'saved' });
  stale.resolve(workspace('stale'));
  await loading;
  assert.equal(store.snapshot().data.finance_books[0].name, 'saved');
  fresh.resolve(workspace('server'));
  await tick();
  assert.equal(store.snapshot().data.finance_books[0].name, 'server');
});

test('queued writes merge their results and expose saving until the last write settles', async () => {
  const a = deferred(),
    b = deferred(),
    refresh = deferred();
  const started = [];
  const store = new WorkspaceStore(
    repository({
      load: () => refresh.promise,
      save: async (_collection, row) => {
        started.push(row.id);
        await (row.id === 'a' ? a.promise : b.promise);
        return row;
      },
    }),
  );
  const one = store.save('finance_books', { id: 'a', name: 'A' });
  const two = store.save('finance_books', { id: 'b', name: 'B' });
  await tick();
  assert.deepEqual(started, ['a']);
  a.resolve();
  await one;
  assert.equal(store.snapshot().saving, true);
  b.resolve();
  await two;
  assert.deepEqual(
    store.snapshot().data.finance_books.map((row) => row.name),
    ['A', 'B'],
  );
  assert.equal(store.snapshot().saving, false);
  refresh.resolve(emptyWorkspace);
});

test('session disposal discards in-flight results and stops queued writes', async () => {
  const pending = deferred();
  let writes = 0,
    emissions = 0;
  const store = new WorkspaceStore(
    repository({
      load: () => pending.promise,
      save: async (_c, r) => {
        writes++;
        return r;
      },
    }),
  );
  store.subscribe(() => emissions++);
  const read = store.refresh();
  store.dispose();
  const before = emissions;
  pending.resolve(workspace('previous account'));
  await read;
  await assert.rejects(store.save('finance_books', { id: 'x', name: 'X' }), /session changed/);
  assert.equal(writes, 0);
  assert.equal(emissions, before);
  assert.deepEqual(store.snapshot().data, emptyWorkspace);
});

test('failed deletion preserves local records', async () => {
  const store = new WorkspaceStore(
    repository({
      load: async () => workspace('original'),
      remove: async () => {
        throw new ConflictError();
      },
    }),
  );
  await store.refresh();
  await assert.rejects(store.remove('finance_books', { id: 'book', name: 'stale' }), ConflictError);
  assert.equal(store.snapshot().data.finance_books[0].name, 'original');
});

test('snapshot predicates include JSON, nulls and exact version in the same request', () => {
  const filters = [];
  const query = {
    eq: (key, value) => {
      filters.push(['eq', key, value]);
      return query;
    },
    is: (key, value) => {
      filters.push(['is', key, value]);
      return query;
    },
  };
  matchSnapshot(query, {
    id: 'x',
    user_id: 'owner',
    notes: 'a, b "c"',
    category_id: null,
    custom_values: { reference: 'x' },
    updated_at: '2026-11-16T01:00:00.123456Z',
  });
  assert.deepEqual(filters, [
    ['eq', 'notes', 'a, b "c"'],
    ['is', 'category_id', null],
    ['eq', 'custom_values', '{"reference":"x"}'],
    ['eq', 'updated_at', '2026-11-16T01:00:00.123456Z'],
  ]);
});

function api(handler) {
  const requests = [];
  const client = createClient('https://example.supabase.co', 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const request = {
          url: new URL(String(input)),
          method: init.method,
          body: init.body ? JSON.parse(init.body) : undefined,
          headers: new Headers(init.headers),
        };
        requests.push(request);
        const { status = 200, data } = handler(request);
        return new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  });
  return { repo: cloudRepository(client, 'owner'), requests };
}

test('a stale mobile update becomes a conflict instead of overwriting the website record', async () => {
  const { repo, requests } = api(() => ({ data: [] }));
  await assert.rejects(
    repo.save('finance_books', { id: 'book', name: 'mobile' }, { id: 'book', name: 'old' }),
    ConflictError,
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, 'PATCH');
  assert.equal(requests[0].url.searchParams.get('name'), 'eq.old');
  assert.equal(requests[0].url.searchParams.get('user_id'), 'eq.owner');
});

test('conditional deletes require the original snapshot and owner', async () => {
  const { repo, requests } = api(() => ({ data: [] }));
  await assert.rejects(
    repo.remove('savings_goals', { id: 'goal', reserved_minor: 1000, ledger_id: null }),
    ConflictError,
  );
  assert.equal(requests[0].method, 'DELETE');
  assert.equal(requests[0].url.searchParams.get('reserved_minor'), 'eq.1000');
  assert.equal(requests[0].url.searchParams.get('ledger_id'), 'is.null');
  assert.equal(requests[0].url.searchParams.get('user_id'), 'eq.owner');
});

test('retrying an acknowledged or uncertain insert with its stable ID is idempotent', async () => {
  const row = { id: 'book', name: 'Travel' };
  const { repo, requests } = api((request) =>
    request.method === 'POST'
      ? { status: 409, data: { code: '23505', message: 'duplicate' } }
      : { data: { ...row, user_id: 'owner' } },
  );
  assert.deepEqual(await repo.save('finance_books', row), { ...row, user_id: 'owner' });
  assert.equal(requests.length, 2);
  assert.equal(requests[0].body.id, 'book');
  assert.equal(requests[1].url.searchParams.get('id'), 'eq.book');
});

test('an ID collision with a different payload is never treated as a successful retry', async () => {
  const { repo } = api((request) =>
    request.method === 'POST'
      ? { status: 409, data: { code: '23505', message: 'duplicate' } }
      : { data: { id: 'book', name: 'other', user_id: 'owner' } },
  );
  await assert.rejects(
    repo.save('finance_books', { id: 'book', name: 'desired' }),
    /already exists/,
  );
});

test('keyset pagination scopes every page to the owner and reads beyond 500 rows', async () => {
  const { repo, requests } = api((request) => {
    if (!request.url.pathname.endsWith('/transactions')) return { data: [] };
    return {
      data: request.url.searchParams.has('id')
        ? [{ id: 'last' }]
        : Array.from({ length: 500 }, (_, i) => ({ id: String(i).padStart(5, '0') })),
    };
  });
  const result = await repo.load();
  assert.equal(result.transactions.length, 501);
  const pages = requests.filter((r) => r.url.pathname.endsWith('/transactions'));
  assert.equal(pages[1].url.searchParams.get('id'), 'gt.00499');
  assert.ok(requests.every((r) => r.url.searchParams.get('user_id') === 'eq.owner'));
});

test('payload comparison handles key ordering in JSON while preserving array order', () => {
  assert.equal(samePayload({ values: { b: 2, a: 1 } }, { values: { a: 1, b: 2 } }), true);
  assert.equal(samePayload({ values: [2, 1] }, { values: [1, 2] }), false);
});
