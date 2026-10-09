import { objectIdSchema } from '@quoteflow/shared';
import { type RequestHandler, type Response, Router } from 'express';
import { z } from 'zod';
import { authOf } from '../middleware/auth';
import { noStore } from '../middleware/no-store';
import { type RequestSchemas, type ValidatedRequest, validate } from '../middleware/validate';
import { convertQuote } from '../services/quote-conversion.service';
import { sendData } from '../utils/response';

const convertSchemas = { params: z.object({ id: objectIdSchema }) } satisfies RequestSchemas;

async function convert(req: ValidatedRequest<typeof convertSchemas>, res: Response): Promise<void> {
  sendData(res, await convertQuote(authOf(req), req.params.id), 201);
}

/**
 * POST /quotes/:id/convert. Mounted at '/quotes' next to the quote router;
 * auth runs per route so this router never intercepts other quote requests.
 */
export function createQuoteConversionRouter({
  requireAuth,
}: {
  requireAuth: RequestHandler;
}): Router {
  const router = Router();
  router.post('/:id/convert', noStore, requireAuth, validate(convertSchemas), convert);
  return router;
}
