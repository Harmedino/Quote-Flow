import type { RequestHandler } from 'express';
import cors from 'cors';
import { REQUEST_ID_HEADER } from './request-logger';

/**
 * CORS restricted to the configured origins. A disallowed origin simply gets
 * no CORS headers (the browser then blocks the response) rather than an error.
 */
export function createCorsMiddleware(allowedOrigins: readonly string[]): RequestHandler {
  const allowed = new Set(allowedOrigins);
  const handleCors = cors({
    origin: (origin, callback) => callback(null, origin !== undefined && allowed.has(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
    exposedHeaders: [REQUEST_ID_HEADER],
    maxAge: 600,
  });

  return (req, res, next) => {
    // Responses differ by Origin even when it is rejected, so shared caches must key on it.
    res.vary('Origin');
    handleCors(req, res, next);
  };
}
