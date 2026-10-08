import type {
  PaginationMeta,
  ServiceDto,
  serviceInputSchema,
  serviceListQuerySchema,
  updateServiceInputSchema,
} from '@quoteflow/shared';
import type { QueryFilter } from 'mongoose';
import type { z } from 'zod';
import { type Service, type ServiceDocument, ServiceModel } from '../models';
import { toServiceDto } from '../serializers/service.serializer';
import { notFound } from '../utils/app-error';
import { skipFor, toPaginationMeta } from '../utils/pagination';
import { containsPattern } from '../utils/search-pattern';
import type { AuthContext } from './access-token.service';
import { toFieldChanges, withoutBlankFields } from './field-changes';

export type CreateServiceData = z.output<typeof serviceInputSchema>;
export type UpdateServiceData = z.output<typeof updateServiceInputSchema>;
export type ServiceListData = z.output<typeof serviceListQuerySchema>;

const SERVICE_NOT_FOUND = 'Service not found.';

/** A service of the caller's business; anything else (including another tenant's) is a 404. */
export async function findOwnService(auth: AuthContext, id: string): Promise<ServiceDocument> {
  const service = await ServiceModel.findOne({ _id: id, businessId: auth.businessId });
  if (!service) throw notFound(SERVICE_NOT_FOUND);
  return service;
}

/** Sorted by name. `active` limits the list to active or inactive services. */
export async function listServices(
  auth: AuthContext,
  query: ServiceListData,
): Promise<{ data: ServiceDto[]; meta: PaginationMeta }> {
  const filter: QueryFilter<Service> = { businessId: auth.businessId };
  if (query.active !== undefined) filter.active = query.active;
  if (query.search) {
    const pattern = containsPattern(query.search);
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  const [services, total] = await Promise.all([
    ServiceModel.find(filter).sort({ name: 1, _id: 1 }).skip(skipFor(query)).limit(query.pageSize),
    ServiceModel.countDocuments(filter),
  ]);
  return { data: services.map(toServiceDto), meta: toPaginationMeta(query, total) };
}

export async function getService(auth: AuthContext, id: string): Promise<ServiceDto> {
  return toServiceDto(await findOwnService(auth, id));
}

export async function createService(
  auth: AuthContext,
  input: CreateServiceData,
): Promise<ServiceDto> {
  const service = await ServiceModel.create({
    ...withoutBlankFields(input),
    businessId: auth.businessId,
  });
  return toServiceDto(service);
}

/** PATCH semantics: omitted fields are left alone and '' clears description or unit. */
export async function updateService(
  auth: AuthContext,
  id: string,
  input: UpdateServiceData,
): Promise<ServiceDto> {
  const service = await findOwnService(auth, id);
  for (const [path, value] of toFieldChanges(input)) service.set(path, value);
  await service.save();
  return toServiceDto(service);
}

/** Quotes and invoices keep their own copy of each line item, so they are unaffected. */
export async function deleteService(auth: AuthContext, id: string): Promise<void> {
  const { deletedCount } = await ServiceModel.deleteOne({ _id: id, businessId: auth.businessId });
  if (deletedCount === 0) throw notFound(SERVICE_NOT_FOUND);
}
