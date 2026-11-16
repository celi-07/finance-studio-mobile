/** A rejected operation must never poison subsequent queued operations. */
export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.tail.then(operation);
    this.tail = next.catch(() => undefined);
    return next;
  }
}

export class ConflictError extends Error {
  constructor() {
    super(
      'This record changed on another device. Your draft is still here. Close and reopen it to review the latest version before saving.',
    );
    this.name = 'ConflictError';
  }
}

export function samePayload(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): boolean {
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object')
      return (
        '{' +
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
          .join(',') +
        '}'
      );
    return JSON.stringify(value);
  };
  return Object.entries(expected).every(
    ([key, value]) => value === undefined || canonical(actual[key]) === canonical(value),
  );
}

/** All predicates form ONE SQL UPDATE/DELETE, never a read-then-write check. */
export function matchSnapshot<T>(builder: T, original: Record<string, unknown>): T {
  let query = builder as {
    eq: (key: string, value: unknown) => any;
    is: (key: string, value: null) => any;
  };
  for (const [key, value] of Object.entries(original)) {
    if (key === 'id' || key === 'user_id' || key === 'created_at' || value === undefined) continue;
    query =
      value === null
        ? query.is(key, null)
        : query.eq(key, typeof value === 'object' ? JSON.stringify(value) : value);
  }
  return query as T;
}
