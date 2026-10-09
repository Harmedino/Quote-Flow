import type { ServiceDto } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { Service } from '../models';

export type ServiceRecord = Service & { _id: Types.ObjectId };

export function toServiceDto(service: ServiceRecord): ServiceDto {
  return {
    id: service._id.toString(),
    name: service.name,
    description: service.description ?? null,
    price: service.price,
    unit: service.unit ?? null,
    active: service.active,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}
