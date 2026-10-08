import { updateBusinessInputSchema } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import * as businessService from '../services/business.service';
import { sendData } from '../utils/response';

export const updateBusinessSchemas = { body: updateBusinessInputSchema } satisfies RequestSchemas;

export async function getBusiness(req: Request, res: Response): Promise<void> {
  sendData(res, await businessService.getBusiness(authOf(req)));
}

export async function updateBusiness(
  req: ValidatedRequest<typeof updateBusinessSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await businessService.updateBusiness(authOf(req), req.body));
}
