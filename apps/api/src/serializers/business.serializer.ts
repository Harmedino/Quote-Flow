import type { BusinessDto } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { Business } from '../models';
import { toAddressDto } from './address.serializer';

export type BusinessRecord = Business & { _id: Types.ObjectId };

export function toBusinessDto(business: BusinessRecord): BusinessDto {
  return {
    id: business._id.toString(),
    name: business.name,
    email: business.email ?? null,
    phone: business.phone ?? null,
    website: business.website ?? null,
    logoUrl: business.logoUrl ?? null,
    address: toAddressDto(business.address),
    currency: business.currency,
    timezone: business.timezone,
    brandColor: business.brandColor,
    quotePrefix: business.quotePrefix,
    invoicePrefix: business.invoicePrefix,
    quoteValidityDays: business.quoteValidityDays,
    invoiceDueDays: business.invoiceDueDays,
    defaultTaxRate: business.defaultTaxRate,
    defaultQuoteNotes: business.defaultQuoteNotes ?? null,
    defaultQuoteTerms: business.defaultQuoteTerms ?? null,
    defaultInvoiceNotes: business.defaultInvoiceNotes ?? null,
    defaultInvoiceTerms: business.defaultInvoiceTerms ?? null,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}
