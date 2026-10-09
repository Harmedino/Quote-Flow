import type { AddressInput } from '@quoteflow/shared';
import type { Address } from '../models';

const ADDRESS_FIELDS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const;

/** Always an object; only the parts that are set are included. */
export function toAddressDto(address: Address | null | undefined): AddressInput {
  const dto: AddressInput = {};
  for (const field of ADDRESS_FIELDS) {
    const value = address?.[field];
    if (value) dto[field] = value;
  }
  return dto;
}
