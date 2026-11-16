import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createChunkedStorage } from '../src/data/chunked-storage.ts';

function setup(fail = () => false) {
  const data = new Map();
  let id = 0;
  const backend = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      if (fail(key)) throw Error('storage failed');
      data.set(key, value);
    },
    removeItem: async (key) => {
      data.delete(key);
    },
  };
  return { data, storage: createChunkedStorage(backend, () => String(++id)) };
}
test('large Unicode sessions round-trip in chunks within SecureStore size limits', async () => {
  const { data, storage } = setup();
  const value = 'x'.repeat(399) + '💰'.repeat(2500) + 'finance';
  await storage.setItem('session', value);
  assert.equal(await storage.getItem('session'), value);
  for (const [key, chunk] of data)
    if (key !== 'session') assert.ok(Buffer.byteLength(chunk, 'utf8') <= 1600);
});
test('a partial write preserves the previous session and removes unpublished chunks', async () => {
  let failing = false;
  const { data, storage } = setup((key) => failing && key === 'session.2.1');
  await storage.setItem('session', 'original');
  failing = true;
  await assert.rejects(storage.setItem('session', 'new'.repeat(500)), /storage failed/);
  assert.equal(await storage.getItem('session'), 'original');
  assert.ok([...data.keys()].every((key) => !key.startsWith('session.2.')));
});
test('overlapping session updates and sign-out finish in order without resurrecting a token', async () => {
  const { data, storage } = setup();
  await Promise.all([
    storage.setItem('session', 'first'.repeat(600)),
    storage.setItem('session', 'second'.repeat(600)),
    storage.removeItem('session'),
  ]);
  assert.equal(await storage.getItem('session'), null);
  assert.equal(data.size, 0);
});
test('missing chunks fail closed instead of returning a partial session', async () => {
  const { data, storage } = setup();
  await storage.setItem('session', 'session'.repeat(400));
  data.delete('session.1.1');
  await assert.rejects(storage.getItem('session'), /incomplete/);
});
