import { acceptQuoteInputSchema, rejectQuoteInputSchema } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import type { RequestSchemas, ValidatedBody } from '../middleware/validate';
import type { PublicDocumentService } from '../services/public-document.service';
import { sendData } from '../utils/response';

export const acceptQuoteSchemas = { body: acceptQuoteInputSchema } satisfies RequestSchemas;
export const rejectQuoteSchemas = { body: rejectQuoteInputSchema } satisfies RequestSchemas;

type TokenParams = { token: string };
type AcceptRequest = Request<TokenParams, unknown, ValidatedBody<typeof acceptQuoteSchemas>>;
type RejectRequest = Request<TokenParams, unknown, ValidatedBody<typeof rejectQuoteSchemas>>;

export function createPublicController(documents: PublicDocumentService) {
  return {
    /** `?preview=1` marks the business's own preview, which is not a customer view. */
    viewQuote: async (req: Request<TokenParams>, res: Response): Promise<void> => {
      const preview = req.query.preview === '1';
      sendData(res, await documents.viewQuote(req.params.token, { preview }));
    },

    acceptQuote: async (req: AcceptRequest, res: Response): Promise<void> => {
      const { revision } = req.body;
      sendData(
        res,
        await documents.respondToQuote(req.params.token, { action: 'accept', revision }),
      );
    },

    rejectQuote: async (req: RejectRequest, res: Response): Promise<void> => {
      const { revision } = req.body;
      const reason = req.body.reason || undefined;
      sendData(
        res,
        await documents.respondToQuote(req.params.token, { action: 'reject', revision, reason }),
      );
    },

    viewInvoice: async (req: Request<TokenParams>, res: Response): Promise<void> => {
      sendData(res, await documents.viewInvoice(req.params.token));
    },
  };
}
