import {
  objectIdSchema,
  serviceInputSchema,
  serviceListQuerySchema,
  updateServiceInputSchema,
} from '@quoteflow/shared';
import type { Response } from 'express';
import { z } from 'zod';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import * as serviceCatalog from '../services/service-catalog.service';
import { sendData, sendPaginated } from '../utils/response';

const idParams = z.object({ id: objectIdSchema });

export const listServicesSchemas = { query: serviceListQuerySchema } satisfies RequestSchemas;
export const createServiceSchemas = { body: serviceInputSchema } satisfies RequestSchemas;
export const serviceIdSchemas = { params: idParams } satisfies RequestSchemas;
export const updateServiceSchemas = {
  params: idParams,
  body: updateServiceInputSchema,
} satisfies RequestSchemas;

export async function listServices(
  req: ValidatedRequest<typeof listServicesSchemas>,
  res: Response,
): Promise<void> {
  const { data, meta } = await serviceCatalog.listServices(authOf(req), req.query);
  sendPaginated(res, data, meta);
}

export async function createService(
  req: ValidatedRequest<typeof createServiceSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await serviceCatalog.createService(authOf(req), req.body), 201);
}

export async function getService(
  req: ValidatedRequest<typeof serviceIdSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await serviceCatalog.getService(authOf(req), req.params.id));
}

export async function updateService(
  req: ValidatedRequest<typeof updateServiceSchemas>,
  res: Response,
): Promise<void> {
  sendData(res, await serviceCatalog.updateService(authOf(req), req.params.id, req.body));
}

export async function deleteService(
  req: ValidatedRequest<typeof serviceIdSchemas>,
  res: Response,
): Promise<void> {
  await serviceCatalog.deleteService(authOf(req), req.params.id);
  res.status(204).end();
}
