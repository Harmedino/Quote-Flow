import type { RequestHandler } from 'express';
import { forbidden } from '../utils/app-error';

/**
 * CSRF defence for endpoints that act on the refresh cookie, on top of its
 * SameSite=Strict attribute: browsers send Origin on every POST, so a request
 * from another site is rejected before anything happens. Requests from the
 * API's own origin are always allowed (the web app and API share one origin
 * on Vercel, including preview URLs); a browser on another site cannot forge
 * Origin or Host. Non-browser clients, which send neither Origin nor
 * Sec-Fetch-Site, are let through.
 */
export function createTrustedOriginCheck(allowedOrigins: readonly string[]): RequestHandler {
  const allowed: ReadonlySet<string> = new Set(allowedOrigins);

  return (req, _res, next) => {
    const origin = req.get('origin');
    const ownOrigin = `${req.protocol}://${req.get('host') ?? ''}`;
    const fromUntrustedSite =
      origin === undefined
        ? req.get('sec-fetch-site') === 'cross-site'
        : origin !== ownOrigin && !allowed.has(origin);
    if (fromUntrustedSite) throw forbidden('This request is not allowed from this website.');
    next();
  };
}
