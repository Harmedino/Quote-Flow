import { createHash } from 'node:crypto';
import type { Store } from 'express-rate-limit';
import { isDuplicateKeyError } from '../db/errors';
import { RateLimitCounterModel } from '../models';
import { type Clock, systemClock } from '../utils/clock';

const START_WINDOW_ATTEMPTS = 3;

/**
 * Rate-limit counters in MongoDB, so a limit holds across every API instance
 * (serverless functions included) instead of per process. Fixed windows.
 * Keys are stored hashed: they hold IP addresses and emails. `name` keeps
 * each limiter's counters apart.
 */
export function createMongoRateLimitStore(name: string, clock: Clock = systemClock): Store {
  const prefix = `${name}:`;
  let windowMs = 60_000;
  const idOf = (key: string) =>
    createHash('sha256')
      .update(prefix + key)
      .digest('base64url');

  return {
    localKeys: false,
    prefix,

    init(options) {
      windowMs = options.windowMs;
    },

    async get(key) {
      const counter = await RateLimitCounterModel.findOne({
        _id: idOf(key),
        resetAt: { $gt: clock() },
      }).lean();
      return counter ? { totalHits: counter.hits, resetTime: counter.resetAt } : undefined;
    },

    async increment(key) {
      const _id = idOf(key);
      for (let attempt = 0; attempt < START_WINDOW_ATTEMPTS; attempt += 1) {
        const now = clock();
        const counted = await RateLimitCounterModel.findOneAndUpdate(
          { _id, resetAt: { $gt: now } },
          { $inc: { hits: 1 } },
          { returnDocument: 'after' },
        ).lean();
        if (counted) return { totalHits: counted.hits, resetTime: counted.resetAt };

        const resetAt = new Date(now.getTime() + windowMs);
        try {
          // Starts a window. If another request just started one, the upsert collides: count again.
          await RateLimitCounterModel.updateOne(
            { _id, resetAt: { $lte: now } },
            { $set: { hits: 1, resetAt } },
            { upsert: true },
          );
          return { totalHits: 1, resetTime: resetAt };
        } catch (error) {
          if (!isDuplicateKeyError(error)) throw error;
        }
      }
      throw new Error('Could not count a rate-limited request');
    },

    async decrement(key) {
      await RateLimitCounterModel.updateOne(
        { _id: idOf(key), resetAt: { $gt: clock() }, hits: { $gt: 0 } },
        { $inc: { hits: -1 } },
      );
    },

    async resetKey(key) {
      await RateLimitCounterModel.deleteOne({ _id: idOf(key) });
    },
  };
}
