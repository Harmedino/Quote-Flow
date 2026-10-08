import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Env } from './config/env';
import { API_PREFIX, isHealthCheckUrl } from './config/paths';
import { createCorsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import {
  GLOBAL_RATE_LIMIT,
  type RateLimitSettings,
  createRateLimiter,
} from './middleware/rate-limit';
import { createRequestLogger } from './middleware/request-logger';
import { createApiRouter } from './routes';
import type { Logger } from './utils/logger';

/** Fits the largest quote the shared rules accept (about 0.7 MB in 3-byte UTF-8) with headroom. */
export const JSON_BODY_LIMIT = '1mb';

export interface CreateAppOptions {
  env: Env;
  logger: Logger;
  /** Global per-IP limit for API requests; `false` disables it (e.g. in tests). */
  rateLimit?: RateLimitSettings | false;
}

export function createApp({
  env,
  logger,
  rateLimit = GLOBAL_RATE_LIMIT,
}: CreateAppOptions): Express {
  const app = express();
  app.set('env', env.NODE_ENV);
  // `false` rather than 0 hops (same meaning to Express) lets express-rate-limit warn when
  // X-Forwarded-For arrives although no proxy is trusted, i.e. TRUST_PROXY is misconfigured.
  app.set('trust proxy', env.TRUST_PROXY === 0 ? false : env.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(createRequestLogger(logger));
  app.use(
    helmet({
      // The API only serves JSON, so nothing may be loaded or framed from its responses.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
      xFrameOptions: { action: 'deny' },
    }),
  );
  app.use(createCorsMiddleware(env.CORS_ORIGIN));

  // Rate limiting runs before body parsing so rejected requests cost as little as possible.
  if (rateLimit) {
    app.use(
      API_PREFIX,
      createRateLimiter({
        ...rateLimit,
        logger,
        skip: (req) => isHealthCheckUrl(req.originalUrl),
      }),
    );
  }
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use(API_PREFIX, createApiRouter());
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
