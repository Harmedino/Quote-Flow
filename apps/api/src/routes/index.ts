import { Router } from 'express';
import { type Env, durationInSeconds } from '../config/env';
import { createRequireAuth } from '../middleware/auth';
import { type AuthRateLimits, createAuthRateLimiters } from '../middleware/auth-rate-limits';
import { createTrustedOriginCheck } from '../middleware/trusted-origin';
import { createAccessTokenService } from '../services/access-token.service';
import { createAccountService } from '../services/account.service';
import { createAuthService } from '../services/auth.service';
import { createSessionService } from '../services/session.service';
import type { Clock } from '../utils/clock';
import type { Logger } from '../utils/logger';
import { createRefreshCookie } from '../utils/refresh-cookie';
import { createAccountRouter } from './account.routes';
import { createAuthRouter } from './auth.routes';
import { createBusinessRouter } from './business.routes';
import { createDashboardRouter } from './dashboard.routes';
import { createCustomersRouter } from './customers.routes';
import { createServicesRouter } from './services.routes';
import { createHealthRouter } from './health.routes';
import { createPdfRouter } from './pdf.routes';
import { createInvoiceRouter } from './invoice.routes';
import { createPublicRouter } from './public.routes';
import { createQuoteConversionRouter } from './quote-conversion.routes';
import { createQuoteRouter } from './quote.routes';

export interface ApiRouterOptions {
  env: Env;
  logger: Logger;
  clock: Clock;
  authRateLimits: Partial<AuthRateLimits> | false;
}

/** All API routes, mounted under API_PREFIX by the app. */
export function createApiRouter({ env, logger, clock, authRateLimits }: ApiRouterOptions): Router {
  const tokens = createAccessTokenService({
    secret: env.JWT_SECRET,
    ttlSeconds: durationInSeconds(env.ACCESS_TOKEN_TTL),
    clock,
  });
  const sessions = createSessionService({ refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS, clock });
  const requireAuth = createRequireAuth(tokens);
  const limiters = createAuthRateLimiters(authRateLimits, logger);

  const router = Router();
  router.use('/health', createHealthRouter());
  router.use(
    '/auth',
    createAuthRouter({
      auth: createAuthService({ tokens, sessions, clock }),
      refreshCookie: createRefreshCookie(env),
      requireAuth,
      trustedOrigin: createTrustedOriginCheck(env.CORS_ORIGIN),
      limiters,
    }),
  );
  router.use(
    '/account',
    createAccountRouter({ accounts: createAccountService({ sessions }), requireAuth, limiters }),
  );
  router.use('/business', createBusinessRouter({ requireAuth }));
  router.use(createPdfRouter({ requireAuth, logger, clock }));
  router.use('/dashboard', createDashboardRouter({ requireAuth, clock }));
  router.use('/quotes', createQuoteRouter({ requireAuth }));
  router.use('/customers', createCustomersRouter({ requireAuth }));
  router.use('/services', createServicesRouter({ requireAuth }));
  router.use('/invoices', createInvoiceRouter({ requireAuth }));
  router.use('/public', createPublicRouter({ logger, clock }));
  router.use('/quotes', createQuoteConversionRouter({ requireAuth }));
  return router;
}
