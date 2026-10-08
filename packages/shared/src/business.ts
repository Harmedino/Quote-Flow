import { z } from 'zod';
import type { CurrencyCode } from './constants/currencies';
import { INVOICE_DUE_DAYS_RANGE, QUOTE_VALIDITY_DAYS_RANGE, TEXT_LIMITS } from './constants/limits';
import {
  type AddressInput,
  addressSchema,
  businessNameSchema,
  currencyCodeSchema,
  documentPrefixSchema,
  emailSchema,
  hexColorSchema,
  percentageSchema,
  phoneSchema,
  timeZoneSchema,
  websiteSchema,
} from './validation';

/**
 *   GET   /api/business   (bearer)               → 200 BusinessDto
 *   PATCH /api/business   UpdateBusinessInput    → 200 BusinessDto (owners only)
 *
 * PATCH semantics: omitted fields are unchanged; an empty string clears an
 * optional text field. Currency changes only affect documents created afterwards,
 * because every quote and invoice stores its own currency.
 */

/** An optional text field: '' clears it. */
const clearable = <T extends z.ZodType<string, string>>(schema: T) =>
  z.union([z.literal(''), schema]).optional();

const longText = (max: number) =>
  z.string().trim().max(max, `Must be at most ${max} characters`).optional();

const wholeDays = ({ min, max }: { min: number; max: number }) =>
  z
    .number()
    .int('Enter a whole number of days')
    .min(min, `Must be at least ${min} days`)
    .max(max, `Must be at most ${max} days`);

export const updateBusinessInputSchema = z.object({
  name: businessNameSchema.optional(),
  email: clearable(emailSchema),
  phone: clearable(phoneSchema),
  website: z.union([z.literal(''), websiteSchema]).optional(),
  address: addressSchema.optional(),
  currency: currencyCodeSchema.optional(),
  timezone: timeZoneSchema.optional(),
  brandColor: hexColorSchema.optional(),
  quotePrefix: documentPrefixSchema.optional(),
  invoicePrefix: documentPrefixSchema.optional(),
  quoteValidityDays: wholeDays(QUOTE_VALIDITY_DAYS_RANGE).optional(),
  invoiceDueDays: wholeDays(INVOICE_DUE_DAYS_RANGE).optional(),
  defaultTaxRate: percentageSchema.optional(),
  defaultQuoteNotes: longText(TEXT_LIMITS.notes),
  defaultQuoteTerms: longText(TEXT_LIMITS.terms),
  defaultInvoiceNotes: longText(TEXT_LIMITS.notes),
  defaultInvoiceTerms: longText(TEXT_LIMITS.terms),
});

export type UpdateBusinessInput = z.input<typeof updateBusinessInputSchema>;

export interface BusinessDto {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  address: AddressInput;
  currency: CurrencyCode;
  timezone: string;
  brandColor: string;
  quotePrefix: string;
  invoicePrefix: string;
  quoteValidityDays: number;
  invoiceDueDays: number;
  defaultTaxRate: number;
  defaultQuoteNotes: string | null;
  defaultQuoteTerms: string | null;
  defaultInvoiceNotes: string | null;
  defaultInvoiceTerms: string | null;
  createdAt: string;
  updatedAt: string;
}
