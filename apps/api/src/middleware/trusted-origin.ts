import type { RequestHandler } from 'express';
import { forbidden } from '../utils/app-error';

/**
 * CSRF defence for endpoints that act on the refresh cookie, on top of its
 * SameSite=Strict attribute: browsers send Origin on every POST, so a request
 * from another site is rejected before anything happens. Non-browser clients,
 * which send neither Origin nor Sec-Fetch-Site, are let through.
 */
export function createTrustedOriginCheck(allowedOrigins: readonly string[]): RequestHandler {
  const allowed: ReadonlySet<string> = new Set(allowedOrigins);

  return (req, _res, next) => {
    const origin = req.get('origin');
    const fromUntrustedSite =
      origin === undefined ? req.get('sec-fetch-site') === 'cross-site' : !allowed.has(origin);
    if (fromUntrustedSite) throw forbidden('This request is not allowed from this website.');
    next();
  };
}
