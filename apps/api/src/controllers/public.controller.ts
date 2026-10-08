import { rejectQuoteInputSchema } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import type { RequestSchemas, ValidatedBody } from '../middleware/validate';
import type { PublicDocumentService } from '../services/public-document.service';
import { sendData } from '../utils/response';

/** A missing body counts as no reason, so a bare POST also declines. */
export const rejectQuoteSchemas = {
  body: rejectQuoteInputSchema.default({}),
} satisfies RequestSchemas;

type TokenParams = { token: string };
type RejectRequest = Request<TokenParams, unknown, ValidatedBody<typeof rejectQuoteSchemas>>;

export function createPublicController(documents: PublicDocumentService) {
  return {
    viewQuote: async (req: Request<TokenParams>, res: Response): Promise<void> => {
      sendData(res, await documents.viewQuote(req.params.token));
    },

    acceptQuote: async (req: Request<TokenParams>, res: Response): Promise<void> => {
      sendData(res, await documents.respondToQuote(req.params.token, { action: 'accept' }));
    },

    rejectQuote: async (req: RejectRequest, res: Response): Promise<void> => {
      const reason = req.body.reason || undefined;
      sendData(res, await documents.respondToQuote(req.params.token, { action: 'reject', reason }));
    },

    viewInvoice: async (req: Request<TokenParams>, res: Response): Promise<void> => {
      sendData(res, await documents.viewInvoice(req.params.token));
    },
  };
}
