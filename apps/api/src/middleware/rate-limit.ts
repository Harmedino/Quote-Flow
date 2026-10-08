import { type Options, type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/app-error';
import type { Logger } from '../utils/logger';

export interface RateLimitSettings {
  windowMs: number;
  /** Maximum requests per client (by IP unless `keyGenerator` says otherwise) per window. */
  limit: number;
}

export interface RateLimiterOptions extends RateLimitSettings {
  logger: Logger;
  message?: string;
  skip?: Options['skip'];
  keyGenerator?: Options['keyGenerator'];
}

export const GLOBAL_RATE_LIMIT: RateLimitSettings = { windowMs: 15 * 60 * 1000, limit: 300 };

/**
 * Builds a rate limiter that reports violations through the central error
 * handler, so clients always receive the standard RATE_LIMITED envelope.
 * Counters live in process memory, i.e. they are per API instance.
 */
export function createRateLimiter({
  windowMs,
  limit,
  logger,
  message = 'Too many requests. Please try again later.',
  skip,
  keyGenerator,
}: RateLimiterOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skip,
    keyGenerator,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError('RATE_LIMITED', message));
    },
    logger: {
      error: (error, details) => logger.error({ err: error }, details ?? 'Rate limiter error'),
      warn: (error, details) => logger.warn({ err: error }, details ?? 'Rate limiter warning'),
    },
  });
}
