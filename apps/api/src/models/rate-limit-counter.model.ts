import { Schema, model } from 'mongoose';
import { serialization } from './plugins/serialization';

/**
 * One client's request count in the current window of one rate limiter,
 * shared by every API instance. Not tenant data: it belongs to no business.
 */
export interface RateLimitCounter {
  /** A hash of the limiter's name and the client's key (which may hold an IP or an email). */
  _id: string;
  hits: number;
  /** When the window ends. The TTL index deletes the counter afterwards. */
  resetAt: Date;
}

const rateLimitCounterSchema = new Schema<RateLimitCounter>(
  {
    _id: { type: String, required: true },
    hits: { type: Number, required: true },
    resetAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitCounterSchema.plugin(serialization);

rateLimitCounterSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitCounterModel = model<RateLimitCounter>(
  'RateLimitCounter',
  rateLimitCounterSchema,
);
