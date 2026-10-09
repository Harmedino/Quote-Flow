import {
  type Options,
  type RateLimitRequestHandler,
  type Store,
  rateLimit,
} from 'express-rate-limit';
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
  /** Count only requests that fail (status 400 or above), e.g. failed sign-in attempts. */
  skipSuccessfulRequests?: boolean;
  /** Count only requests that succeed (status below 400). */
  skipFailedRequests?: boolean;
  /** Where counters live; process memory (i.e. per API instance) by default. */
  store?: Store;
}

export const GLOBAL_RATE_LIMIT: RateLimitSettings = { windowMs: 15 * 60 * 1000, limit: 300 };

/**
 * Builds a rate limiter that reports violations through the central error
 * handler, so clients always receive the standard RATE_LIMITED envelope.
 */
export function createRateLimiter({
  windowMs,
  limit,
  logger,
  message = 'Too many requests. Please try again later.',
  skip,
  keyGenerator,
  skipSuccessfulRequests = false,
  skipFailedRequests = false,
  store,
}: RateLimiterOptions): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    skip,
    keyGenerator,
    skipSuccessfulRequests,
    skipFailedRequests,
    ...(store && { store }),
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
