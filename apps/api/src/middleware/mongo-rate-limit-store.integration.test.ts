import type { Options } from 'express-rate-limit';
import { describe, expect, it } from 'vitest';
import { RateLimitCounterModel } from '../models';
import { createTestClock } from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { createMongoRateLimitStore } from './mongo-rate-limit-store';

const WINDOW_MS = 60_000;

function setup(name = 'test.limiter') {
  const clock = createTestClock(new Date('2026-10-09T10:00:00.000Z'));
  const store = createMongoRateLimitStore(name, clock.now);
  void store.init?.({ windowMs: WINDOW_MS } as Options);
  return { clock, store };
}

describe.skipIf(!TEST_DATABASE_URI)('MongoDB rate-limit store (database)', () => {
  useTestDatabase();

  it('counts hits in fixed windows and starts afresh once a window ends', async () => {
    const { clock, store } = setup();
    const resetTime = new Date(clock.now().getTime() + WINDOW_MS);

    expect(await store.increment('203.0.113.1')).toEqual({ totalHits: 1, resetTime });
    clock.advance(WINDOW_MS - 1);
    expect(await store.increment('203.0.113.1')).toEqual({ totalHits: 2, resetTime });
    expect(await store.get?.('203.0.113.1')).toEqual({ totalHits: 2, resetTime });

    clock.advance(1);
    expect(await store.get?.('203.0.113.1')).toBeUndefined();
    expect(await store.increment('203.0.113.1')).toEqual({
      totalHits: 1,
      resetTime: new Date(clock.now().getTime() + WINDOW_MS),
    });
  });

  it('keeps clients and limiters apart, and supports decrement and reset', async () => {
    const { store } = setup('first.limiter');
    const { store: other } = setup('second.limiter');

    await store.increment('amina@example.com');
    await store.increment('amina@example.com');
    await other.increment('amina@example.com');
    await store.increment('luis@example.com');

    await store.decrement('amina@example.com');
    expect((await store.get?.('amina@example.com'))?.totalHits).toBe(1);
    expect((await other.get?.('amina@example.com'))?.totalHits).toBe(1);

    await store.resetKey('luis@example.com');
    expect(await store.get?.('luis@example.com')).toBeUndefined();
  });

  it('stores keys only as hashes', async () => {
    const { store } = setup('hashed.limiter');
    await store.increment('198.51.100.7|olivia@example.com');

    const stored = JSON.stringify(await RateLimitCounterModel.find().lean());
    expect(stored).not.toContain('olivia@example.com');
    expect(stored).not.toContain('198.51.100.7');
  });
});
