import { type RequestHandler, Router } from 'express';
import { createPdfController } from '../controllers/pdf.controller';
import { authOf } from '../middleware/auth';
import { noStore } from '../middleware/no-store';
import { type RateLimitSettings, createRateLimiter } from '../middleware/rate-limit';
import { createDocumentPdfService } from '../services/pdf/pdf.service';
import type { Clock } from '../utils/clock';
import type { Logger } from '../utils/logger';

/** Rendering is CPU-bound, so anonymous downloads get a tighter per-IP budget than page views. */
export const PUBLIC_PDF_RATE_LIMIT: RateLimitSettings = { windowMs: 15 * 60 * 1000, limit: 30 };
/** Per signed-in user, whatever addresses the requests come from. */
export const USER_PDF_RATE_LIMIT: RateLimitSettings = { windowMs: 15 * 60 * 1000, limit: 60 };

export interface PdfRouterOptions {
  requireAuth: RequestHandler;
  logger: Logger;
  clock: Clock;
}

/**
 * PDF downloads for quotes and invoices, business-side and public. Mounted at
 * the API root because its paths sit beside the quote, invoice and public routers.
 */
export function createPdfRouter({ requireAuth, logger, clock }: PdfRouterOptions): Router {
  const controller = createPdfController(createDocumentPdfService({ clock }));
  const publicLimit = createRateLimiter({
    ...PUBLIC_PDF_RATE_LIMIT,
    logger,
    message: 'Too many downloads. Please wait a few minutes and try again.',
  });

  const userLimit = createRateLimiter({
    ...USER_PDF_RATE_LIMIT,
    logger,
    message: 'Too many downloads. Please wait a few minutes and try again.',
    keyGenerator: (req) => authOf(req).userId,
  });

  const router = Router();
  router.get('/quotes/:id/pdf', noStore, requireAuth, userLimit, controller.quotePdf);
  router.get('/invoices/:id/pdf', noStore, requireAuth, userLimit, controller.invoicePdf);
  router.get('/public/quotes/:token/pdf', noStore, publicLimit, controller.publicQuotePdf);
  router.get('/public/invoices/:token/pdf', noStore, publicLimit, controller.publicInvoicePdf);
  return router;
}
