import {
  CURRENCY_CODES,
  type CurrencyCode,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CURRENCY,
  DEFAULT_INVOICE_DUE_DAYS,
  DEFAULT_INVOICE_PREFIX,
  DEFAULT_QUOTE_PREFIX,
  DEFAULT_QUOTE_VALIDITY_DAYS,
  DEFAULT_TIMEZONE,
  documentPrefixSchema,
  emailSchema,
  hexColorSchema,
  percentageSchema,
  phoneSchema,
  timeZoneSchema,
} from '@quoteflow/shared';
import { type HydratedDocument, Schema, model } from 'mongoose';
import { INVOICE_DUE_DAYS_RANGE, QUOTE_VALIDITY_DAYS_RANGE, TEXT_LIMITS } from './limits';
import { serialization } from './plugins/serialization';
import { type Address, addressSubschema } from './schemas/address';
import type { Timestamps } from './types';
import { httpUrl, validateWith, wholeNumber } from './validators';

/**
 * The tenant. Every other business-owned document references it through
 * `businessId`. Its settings drive fast quote creation and document appearance.
 */
export interface Business extends Timestamps {
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
  currency: CurrencyCode;
  timezone: string;
  brandColor: string;
  quotePrefix: string;
  invoicePrefix: string;
  quoteValidityDays: number;
  invoiceDueDays: number;
  /** Percentage applied to new documents, e.g. 7.5. */
  defaultTaxRate: number;
  defaultQuoteNotes?: string;
  defaultQuoteTerms?: string;
  defaultInvoiceNotes?: string;
  defaultInvoiceTerms?: string;
}

export type BusinessDocument = HydratedDocument<Business>;

const longText = (maxlength: number) => ({ type: String, trim: true, maxlength });

const businessSchema = new Schema<Business>(
  {
    name: { type: String, required: true, trim: true, maxlength: TEXT_LIMITS.businessName },
    logoUrl: { type: String, trim: true, maxlength: TEXT_LIMITS.url, validate: httpUrl },
    email: { type: String, trim: true, lowercase: true, validate: validateWith(emailSchema) },
    phone: { type: String, trim: true, validate: validateWith(phoneSchema) },
    website: { type: String, trim: true, maxlength: TEXT_LIMITS.url, validate: httpUrl },
    address: { type: addressSubschema },
    currency: { type: String, enum: CURRENCY_CODES, required: true, default: DEFAULT_CURRENCY },
    timezone: {
      type: String,
      required: true,
      trim: true,
      default: DEFAULT_TIMEZONE,
      validate: validateWith(timeZoneSchema),
    },
    brandColor: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      default: DEFAULT_BRAND_COLOR,
      validate: validateWith(hexColorSchema),
    },
    quotePrefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: DEFAULT_QUOTE_PREFIX,
      validate: validateWith(documentPrefixSchema),
    },
    invoicePrefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: DEFAULT_INVOICE_PREFIX,
      validate: validateWith(documentPrefixSchema),
    },
    quoteValidityDays: {
      type: Number,
      required: true,
      default: DEFAULT_QUOTE_VALIDITY_DAYS,
      ...QUOTE_VALIDITY_DAYS_RANGE,
      validate: wholeNumber,
    },
    invoiceDueDays: {
      type: Number,
      required: true,
      default: DEFAULT_INVOICE_DUE_DAYS,
      ...INVOICE_DUE_DAYS_RANGE,
      validate: wholeNumber,
    },
    defaultTaxRate: {
      type: Number,
      required: true,
      default: 0,
      validate: validateWith(percentageSchema),
    },
    defaultQuoteNotes: longText(TEXT_LIMITS.notes),
    defaultQuoteTerms: longText(TEXT_LIMITS.terms),
    defaultInvoiceNotes: longText(TEXT_LIMITS.notes),
    defaultInvoiceTerms: longText(TEXT_LIMITS.terms),
  },
  { timestamps: true },
);

businessSchema.plugin(serialization);

export const BusinessModel = model<Business>('Business', businessSchema);
