import {
  invoiceInputSchema,
  invoiceListQuerySchema,
  objectIdSchema,
  recordPaymentInputSchema,
} from '@quoteflow/shared';
import type { Response } from 'express';
import { z } from 'zod';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import * as invoiceService from '../services/invoice.service';
import { sendData, sendPaginated } from '../utils/response';

const idParams = z.object({ id: objectIdSchema });

export const listInvoicesSchemas = { query: invoiceListQuerySchema } satisfies RequestSchemas;
export const createInvoiceSchemas = { body: invoiceInputSchema } satisfies RequestSchemas;
export const invoiceIdSchemas = { params: idParams } satisfies RequestSchemas;
export const updateInvoiceSchemas = {
  params: idParams,
  body: invoiceInputSchema,
} satisfies RequestSchemas;
export const recordPaymentSchemas = {
  params: idParams,
  body: recordPaymentInputSchema,
} satisfies RequestSchemas;
export const paymentIdSchemas = {
  params: z.object({ id: objectIdSchema, paymentId: objectIdSchema }),
} satisfies RequestSchemas;

export async function listInvoices(
  req: ValidatedRequest<typeof listInvoicesSchemas>,
  res: Response,
): Promise<void> {
  const auth = authOf(req);
  const { data, meta } = await invoiceService.listInvoices(auth, req.query);
  sendPaginated(res, data, meta);
}

export async function createInvoice(
  req: ValidatedRequest<typeof createInvoiceSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.createInvoice(authOf(req), req.body), 201);
}

export async function getInvoice(
  req: ValidatedRequest<typeof invoiceIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.getInvoice(authOf(req), req.params.id));
}

export async function updateInvoice(
  req: ValidatedRequest<typeof updateInvoiceSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.updateInvoice(authOf(req), req.params.id, req.body));
}

export async function deleteInvoice(
  req: ValidatedRequest<typeof invoiceIdSchemas>,
  res: Response,
): Promise<void> {
  await invoiceService.deleteInvoice(authOf(req), req.params.id);
  res.status(204).end();
}

export async function sendInvoice(
  req: ValidatedRequest<typeof invoiceIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.sendInvoice(authOf(req), req.params.id));
}

export async function recordPayment(
  req: ValidatedRequest<typeof recordPaymentSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.recordPayment(authOf(req), req.params.id, req.body), 201);
}

export async function deletePayment(
  req: ValidatedRequest<typeof paymentIdSchemas>,
  res: Response,
): Promise<void> {
  const { id, paymentId } = req.params;
  sendData(res, await invoiceService.deletePayment(authOf(req), id, paymentId));
}

export async function cancelInvoice(
  req: ValidatedRequest<typeof invoiceIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await invoiceService.cancelInvoice(authOf(req), req.params.id));
}
