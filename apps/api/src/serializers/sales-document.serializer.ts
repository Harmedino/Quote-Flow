import {
  type CustomerSnapshotDto,
  type DiscountDto,
  type LineItemDto,
  type PublicBusinessDto,
  utcDateToIsoDate,
} from '@quoteflow/shared';
import type { Business, CustomerSnapshot, Discount, LineItem } from '../models';
import { toAddressDto } from './address.serializer';

/** Building blocks for quote and invoice responses (business-side, public and PDF). */

/** Calendar dates are stored as UTC midnight and returned as 'YYYY-MM-DD'. */
export function toIsoDate(date: Date): string {
  return utcDateToIsoDate(date);
}

export function toTimestamp(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

export function toLineItemDto(item: LineItem): LineItemDto {
  return {
    serviceId: item.serviceId ? item.serviceId.toString() : null,
    name: item.name,
    description: item.description ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    unitPrice: item.unitPrice,
    amount: item.amount,
  };
}

export function toCustomerSnapshotDto(customer: CustomerSnapshot): CustomerSnapshotDto {
  return {
    name: customer.name,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    company: customer.company ?? null,
    address: toAddressDto(customer.address),
  };
}

export function toDiscountDto(discount: Discount | null | undefined): DiscountDto {
  return discount ? { type: discount.type, value: discount.value } : null;
}

/** Only what a customer without an account may see about the business. */
export function toPublicBusinessDto(business: Business): PublicBusinessDto {
  return {
    name: business.name,
    logoUrl: business.logoUrl ?? null,
    email: business.email ?? null,
    phone: business.phone ?? null,
    website: business.website ?? null,
    address: toAddressDto(business.address),
    brandColor: business.brandColor,
  };
}
