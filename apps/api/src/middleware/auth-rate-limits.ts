import { emailSchema } from '@quoteflow/shared';
import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, type Store } from 'express-rate-limit';
import type { Logger } from '../utils/logger';
import { authOf } from './auth';
import { type RateLimitSettings, createRateLimiter } from './rate-limit';

const MINUTE_MS = 60_000;

export interface AuthRateLimits {
  /** Failed sign-ins per IP address. */
  login: RateLimitSettings;
  /** Failed sign-ins per IP address and email, so one account cannot be guessed at full speed. */
  loginAccount: RateLimitSettings;
  /**
   * Failed sign-ins per email from any address, so guessing spread over many
   * IPs is bounded too. The price: failures from elsewhere can lock an account
   * out of signing in until the window ends.
   */
  loginEmail: RateLimitSettings;
  /** Sign-ups per IP address. */
  register: RateLimitSettings;
  /** Session refreshes per IP address. */
  refresh: RateLimitSettings;
  /** Password changes per user (each one checks the current password). */
  changePassword: RateLimitSettings;
  /** Demo sign-ins and demo quote links per IP address. */
  demo: RateLimitSettings;
}

export const AUTH_RATE_LIMITS: AuthRateLimits = {
  login: { windowMs: 15 * MINUTE_MS, limit: 30 },
  loginAccount: { windowMs: 15 * MINUTE_MS, limit: 10 },
  loginEmail: { windowMs: 60 * MINUTE_MS, limit: 50 },
  register: { windowMs: 60 * MINUTE_MS, limit: 10 },
  refresh: { windowMs: 15 * MINUTE_MS, limit: 120 },
  changePassword: { windowMs: 15 * MINUTE_MS, limit: 10 },
  demo: { windowMs: 15 * MINUTE_MS, limit: 20 },
};

export type AuthRateLimiters = Record<keyof AuthRateLimits, RequestHandler>;

const SIGN_IN_LIMITED = 'Too many sign-in attempts. Please wait a few minutes and try again.';

const allowAll: RequestHandler = (_req, _res, next) => {
  next();
};

/** The email a sign-in is for, normalised the way validation will normalise it. */
function signInEmailOf(req: Request): string | undefined {
  const body: unknown = req.body;
  if (typeof body !== 'object' || body === null || !('email' in body)) return undefined;
  const parsed = emailSchema.safeParse(body.email);
  return parsed.success ? parsed.data : undefined;
}

/** Creates the counter store for one named limiter. */
export type RateLimitStoreFactory = (name: keyof AuthRateLimits) => Store;

/**
 * Limiters for the authentication endpoints, on top of the global per-IP
 * limit. `limits` overrides individual defaults; `false` disables them all (tests).
 * `createStore` shares the counters between API instances; without it they
 * live in this process's memory.
 */
export function createAuthRateLimiters(
  limits: Partial<AuthRateLimits> | false,
  logger: Logger,
  createStore?: RateLimitStoreFactory,
): AuthRateLimiters {
  if (limits === false) {
    return {
      login: allowAll,
      loginAccount: allowAll,
      loginEmail: allowAll,
      register: allowAll,
      refresh: allowAll,
      changePassword: allowAll,
      demo: allowAll,
    };
  }

  const settings = { ...AUTH_RATE_LIMITS, ...limits };
  const base = (name: keyof AuthRateLimits) => ({
    ...settings[name],
    logger,
    ...(createStore && { store: createStore(name) }),
  });
  // Without a valid email the request fails validation and only counts per IP.
  const skipWithoutEmail = (req: Request) => signInEmailOf(req) === undefined;
  return {
    login: createRateLimiter({
      ...base('login'),
      message: SIGN_IN_LIMITED,
      skipSuccessfulRequests: true,
    }),
    loginAccount: createRateLimiter({
      ...base('loginAccount'),
      message: SIGN_IN_LIMITED,
      skipSuccessfulRequests: true,
      skip: skipWithoutEmail,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${signInEmailOf(req) ?? ''}`,
    }),
    loginEmail: createRateLimiter({
      ...base('loginEmail'),
      message: SIGN_IN_LIMITED,
      skipSuccessfulRequests: true,
      skip: skipWithoutEmail,
      keyGenerator: (req) => signInEmailOf(req) ?? '',
    }),
    register: createRateLimiter({
      ...base('register'),
      message: 'Too many sign-ups from this network. Please try again later.',
    }),
    refresh: createRateLimiter(base('refresh')),
    changePassword: createRateLimiter({
      ...base('changePassword'),
      message: 'Too many password change attempts. Please wait a few minutes and try again.',
      keyGenerator: (req) => authOf(req).userId,
    }),
    demo: createRateLimiter({
      ...base('demo'),
      message: 'Too many demo requests from this network. Please try again later.',
    }),
  };
}
