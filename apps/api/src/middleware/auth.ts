import type { UserRole } from '@quoteflow/shared';
import type { Request, RequestHandler } from 'express';
import type { AccessTokenService, AuthContext } from '../services/access-token.service';
import { forbidden, sessionExpired, unauthorized } from '../utils/app-error';

const BEARER_PATTERN = /^Bearer +([A-Za-z0-9._~+/-]+=*) *$/i;

function bearerTokenOf(req: Request): string | undefined {
  return BEARER_PATTERN.exec(req.get('authorization') ?? '')?.[1];
}

/**
 * Authenticates a request by its `Authorization: Bearer` access token (never
 * a cookie, so these routes need no CSRF protection) and sets `req.auth`.
 * Tokens are not checked against the session store: a revoked session keeps
 * working until its access token expires (at most ACCESS_TOKEN_TTL).
 */
export function createRequireAuth(tokens: Pick<AccessTokenService, 'verify'>): RequestHandler {
  return async (req, res, next) => {
    const token = bearerTokenOf(req);
    if (!token) {
      res.set('WWW-Authenticate', 'Bearer');
      throw unauthorized();
    }
    const auth = await tokens.verify(token);
    if (!auth) {
      res.set('WWW-Authenticate', 'Bearer error="invalid_token"');
      throw sessionExpired();
    }
    req.auth = auth;
    next();
  };
}

/** The authenticated identity. Only for handlers behind `requireAuth`. */
export function authOf(req: Pick<Request, 'auth'>): AuthContext {
  if (!req.auth) throw new Error('requireAuth must run before this handler');
  return req.auth;
}

/** Allows the request only for the given roles. Must run after `requireAuth`. */
export function requireRole(...roles: readonly UserRole[]): RequestHandler {
  const allowed: ReadonlySet<UserRole> = new Set(roles);
  return (req, _res, next) => {
    if (!allowed.has(authOf(req).role)) throw forbidden();
    next();
  };
}
