import { type RequestHandler, Router } from 'express';
import {
  createQuote,
  createQuoteSchemas,
  deleteQuote,
  duplicateQuote,
  getQuote,
  listQuotes,
  listQuotesSchemas,
  quoteIdSchemas,
  sendQuote,
  updateQuote,
  updateQuoteSchemas,
} from '../controllers/quote.controller';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';

/**
 * Business-side quote routes, for owners and staff. Other routers are mounted
 * at /quotes too (conversion, PDFs); the guard below also runs for their
 * requests, which is harmless because they require the same authentication.
 */
export function createQuoteRouter({ requireAuth }: { requireAuth: RequestHandler }): Router {
  const router = Router();
  router.use(noStore, requireAuth);

  router.get('/', validate(listQuotesSchemas), listQuotes);
  router.post('/', validate(createQuoteSchemas), createQuote);
  router.get('/:id', validate(quoteIdSchemas), getQuote);
  router.put('/:id', validate(updateQuoteSchemas), updateQuote);
  router.delete('/:id', validate(quoteIdSchemas), deleteQuote);
  router.post('/:id/send', validate(quoteIdSchemas), sendQuote);
  router.post('/:id/duplicate', validate(quoteIdSchemas), duplicateQuote);
  return router;
}
