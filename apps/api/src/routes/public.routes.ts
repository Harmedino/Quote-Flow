import { type RequestHandler, Router } from 'express';
import { createPublicController, rejectQuoteSchemas } from '../controllers/public.controller';
import { noStore } from '../middleware/no-store';
import { type RateLimitSettings, createRateLimiter } from '../middleware/rate-limit';
import { validate } from '../middleware/validate';
import { createPublicDocumentService } from '../services/public-document.service';
import type { Clock } from '../utils/clock';
import type { Logger } from '../utils/logger';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/** Per-IP limits on the customer-facing endpoints, on top of the global API limit. */
export const PUBLIC_RATE_LIMITS = {
  view: { windowMs: FIFTEEN_MINUTES_MS, limit: 120 },
  respond: { windowMs: FIFTEEN_MINUTES_MS, limit: 20 },
} as const satisfies Record<string, RateLimitSettings>;

export interface PublicRouterOptions {
  logger: Logger;
  clock: Clock;
}

/**
 * Customer-facing quote and invoice links (no account; the token is the
 * capability). Nothing here may be cached: responses carry personal data and
 * answers must always reach the server. The PDF routes live in their own router.
 */
export function createPublicRouter({ logger, clock }: PublicRouterOptions): Router {
  const controller = createPublicController(createPublicDocumentService({ clock }));
  const viewLimit = createRateLimiter({ ...PUBLIC_RATE_LIMITS.view, logger });
  const respondLimit = createRateLimiter({
    ...PUBLIC_RATE_LIMITS.respond,
    logger,
    message: 'Too many attempts. Please wait a few minutes and try again.',
  });
  const view: RequestHandler[] = [noStore, viewLimit];
  const respond: RequestHandler[] = [noStore, respondLimit];

  const router = Router();
  router.get('/quotes/:token', ...view, controller.viewQuote);
  router.post('/quotes/:token/accept', ...respond, controller.acceptQuote);
  router.post(
    '/quotes/:token/reject',
    ...respond,
    validate(rejectQuoteSchemas),
    controller.rejectQuote,
  );
  router.get('/invoices/:token', ...view, controller.viewInvoice);
  return router;
}
