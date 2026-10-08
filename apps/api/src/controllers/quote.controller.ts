import { objectIdSchema, quoteInputSchema, quoteListQuerySchema } from '@quoteflow/shared';
import type { Response } from 'express';
import { z } from 'zod';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import * as quoteService from '../services/quote.service';
import { sendData, sendPaginated } from '../utils/response';

const idParams = z.object({ id: objectIdSchema });

export const listQuotesSchemas = { query: quoteListQuerySchema } satisfies RequestSchemas;
export const createQuoteSchemas = { body: quoteInputSchema } satisfies RequestSchemas;
export const quoteIdSchemas = { params: idParams } satisfies RequestSchemas;
export const updateQuoteSchemas = {
  params: idParams,
  body: quoteInputSchema,
} satisfies RequestSchemas;

type QuoteIdRequest = ValidatedRequest<typeof quoteIdSchemas>;

export async function listQuotes(
  req: ValidatedRequest<typeof listQuotesSchemas>,
  res: Response,
): Promise<void> {
  const { data, meta } = await quoteService.listQuotes(authOf(req), req.query);
  sendPaginated(res, data, meta);
}

export async function createQuote(
  req: ValidatedRequest<typeof createQuoteSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await quoteService.createQuote(authOf(req), req.body), 201);
}

export async function getQuote(req: QuoteIdRequest, res: Response): Promise<void> {
  sendData(res, await quoteService.getQuote(authOf(req), req.params.id));
}

export async function updateQuote(
  req: ValidatedRequest<typeof updateQuoteSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await quoteService.updateQuote(authOf(req), req.params.id, req.body));
}

export async function deleteQuote(req: QuoteIdRequest, res: Response): Promise<void> {
  await quoteService.deleteQuote(authOf(req), req.params.id);
  res.status(204).end();
}

export async function sendQuote(req: QuoteIdRequest, res: Response): Promise<void> {
  sendData(res, await quoteService.sendQuote(authOf(req), req.params.id));
}

export async function duplicateQuote(req: QuoteIdRequest, res: Response): Promise<void> {
  sendData(res, await quoteService.duplicateQuote(authOf(req), req.params.id), 201);
}
