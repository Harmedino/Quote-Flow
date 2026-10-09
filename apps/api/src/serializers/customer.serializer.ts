import type { CustomerDto } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { Customer } from '../models';
import { toAddressDto } from './address.serializer';

export type CustomerRecord = Customer & { _id: Types.ObjectId };

export function toCustomerDto(customer: CustomerRecord): CustomerDto {
  return {
    id: customer._id.toString(),
    name: customer.name,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    company: customer.company ?? null,
    address: toAddressDto(customer.address),
    notes: customer.notes ?? null,
    archivedAt: customer.archivedAt ? customer.archivedAt.toISOString() : null,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
