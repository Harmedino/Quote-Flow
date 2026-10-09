import {
  customerInputSchema,
  customerListQuerySchema,
  objectIdSchema,
  updateCustomerInputSchema,
} from '@quoteflow/shared';
import type { Response } from 'express';
import { z } from 'zod';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import * as customerService from '../services/customer.service';
import { sendData, sendPaginated } from '../utils/response';

const idParams = z.object({ id: objectIdSchema });

export const listCustomersSchemas = { query: customerListQuerySchema } satisfies RequestSchemas;
export const createCustomerSchemas = { body: customerInputSchema } satisfies RequestSchemas;
export const customerIdSchemas = { params: idParams } satisfies RequestSchemas;
export const updateCustomerSchemas = {
  params: idParams,
  body: updateCustomerInputSchema,
} satisfies RequestSchemas;

export async function listCustomers(
  req: ValidatedRequest<typeof listCustomersSchemas>,
  res: Response,
): Promise<void> {
  const { data, meta } = await customerService.listCustomers(authOf(req), req.query);
  sendPaginated(res, data, meta);
}

export async function createCustomer(
  req: ValidatedRequest<typeof createCustomerSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await customerService.createCustomer(authOf(req), req.body), 201);
}

export async function getCustomer(
  req: ValidatedRequest<typeof customerIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await customerService.getCustomer(authOf(req), req.params.id));
}

export async function updateCustomer(
  req: ValidatedRequest<typeof updateCustomerSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await customerService.updateCustomer(authOf(req), req.params.id, req.body));
}

export async function archiveCustomer(
  req: ValidatedRequest<typeof customerIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await customerService.archiveCustomer(authOf(req), req.params.id));
}

export async function restoreCustomer(
  req: ValidatedRequest<typeof customerIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await customerService.restoreCustomer(authOf(req), req.params.id));
}
