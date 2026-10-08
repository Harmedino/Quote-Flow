import type { RequestHandler } from 'express';

/** Prevents browsers and intermediaries from caching the response. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
