import { emailSchema } from '@quoteflow/shared';
import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import type { Logger } from '../utils/logger';
import { authOf } from './auth';
import { type RateLimitSettings, createRateLimiter } from './rate-limit';

const MINUTE_MS = 60_000;

export interface AuthRateLimits {
  /** Failed sign-ins per IP address. */
  login: RateLimitSettings;
  /** Failed sign-ins per IP address and email, so one account cannot be guessed at full speed. */
  loginAccount: RateLimitSettings;
  /** Sign-ups per IP address. */
  register: RateLimitSettings;
  /** Session refreshes per IP address. */
  refresh: RateLimitSettings;
  /** Password changes per user (each one checks the current password). */
  changePassword: RateLimitSettings;
  /** Demo sign-ins per IP address. */
  demo: RateLimitSettings;
}

export const AUTH_RATE_LIMITS: AuthRateLimits = {
  login: { windowMs: 15 * MINUTE_MS, limit: 30 },
  loginAccount: { windowMs: 15 * MINUTE_MS, limit: 10 },
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

/**
 * Limiters for the authentication endpoints, on top of the global per-IP
 * limit. `limits` overrides individual defaults; `false` disables them all (tests).
 */
export function createAuthRateLimiters(
  limits: Partial<AuthRateLimits> | false,
  logger: Logger,
): AuthRateLimiters {
  if (limits === false) {
    return {
      login: allowAll,
      loginAccount: allowAll,
      register: allowAll,
      refresh: allowAll,
      changePassword: allowAll,
      demo: allowAll,
    };
  }

  const settings = { ...AUTH_RATE_LIMITS, ...limits };
  return {
    login: createRateLimiter({
      ...settings.login,
      logger,
      message: SIGN_IN_LIMITED,
      skipSuccessfulRequests: true,
    }),
    loginAccount: createRateLimiter({
      ...settings.loginAccount,
      logger,
      message: SIGN_IN_LIMITED,
      skipSuccessfulRequests: true,
      // Without a valid email the request fails validation and only counts per IP.
      skip: (req) => signInEmailOf(req) === undefined,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? '')}|${signInEmailOf(req) ?? ''}`,
    }),
    register: createRateLimiter({
      ...settings.register,
      logger,
      message: 'Too many sign-ups from this network. Please try again later.',
    }),
    refresh: createRateLimiter({ ...settings.refresh, logger }),
    changePassword: createRateLimiter({
      ...settings.changePassword,
      logger,
      message: 'Too many password change attempts. Please wait a few minutes and try again.',
      keyGenerator: (req) => authOf(req).userId,
    }),
    demo: createRateLimiter({
      ...settings.demo,
      logger,
      message: 'Too many demo sign-ins from this network. Please try again later.',
    }),
  };
}
