import {
  type BusinessDto,
  documentPrefixSchema,
  formatDocumentNumber,
  hexColorSchema,
  type UpdateBusinessInput,
  updateBusinessInputSchema,
} from '@quoteflow/shared';
import { type FieldErrors, type FormValidation, validateForm } from '@/lib/forms';

const ADDRESS_KEYS = ['line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const;
type AddressKey = (typeof ADDRESS_KEYS)[number];

const TEXT_FIELDS = [
  'name',
  'email',
  'phone',
  'website',
  'currency',
  'timezone',
  'brandColor',
  'quotePrefix',
  'invoicePrefix',
  'defaultQuoteNotes',
  'defaultQuoteTerms',
  'defaultInvoiceNotes',
  'defaultInvoiceTerms',
] as const satisfies readonly (keyof UpdateBusinessInput)[];

const NUMBER_FIELDS = [
  'quoteValidityDays',
  'invoiceDueDays',
  'defaultTaxRate',
] as const satisfies readonly (keyof UpdateBusinessInput)[];

type TextField = (typeof TEXT_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];

/**
 * Business settings as edited in the form: every value is the input's string.
 * Keys are the API's field paths, so server field errors map straight onto inputs.
 */
export type BusinessFormValues = Record<TextField | NumberField | `address.${AddressKey}`, string>;

export function toBusinessFormValues(business: BusinessDto): BusinessFormValues {
  return {
    name: business.name,
    email: business.email ?? '',
    phone: business.phone ?? '',
    website: business.website ?? '',
    'address.line1': business.address.line1 ?? '',
    'address.line2': business.address.line2 ?? '',
    'address.city': business.address.city ?? '',
    'address.state': business.address.state ?? '',
    'address.postalCode': business.address.postalCode ?? '',
    'address.country': business.address.country ?? '',
    currency: business.currency,
    timezone: business.timezone,
    brandColor: business.brandColor,
    quotePrefix: business.quotePrefix,
    invoicePrefix: business.invoicePrefix,
    quoteValidityDays: String(business.quoteValidityDays),
    invoiceDueDays: String(business.invoiceDueDays),
    defaultTaxRate: String(business.defaultTaxRate),
    defaultQuoteNotes: business.defaultQuoteNotes ?? '',
    defaultQuoteTerms: business.defaultQuoteTerms ?? '',
    defaultInvoiceNotes: business.defaultInvoiceNotes ?? '',
    defaultInvoiceTerms: business.defaultInvoiceTerms ?? '',
  };
}

export function changedBusinessFields(
  values: BusinessFormValues,
  saved: BusinessFormValues,
): (keyof BusinessFormValues)[] {
  return (Object.keys(values) as (keyof BusinessFormValues)[]).filter(
    (key) => values[key] !== saved[key],
  );
}

const BLANK_NUMBER_MESSAGES: Record<NumberField, string> = {
  quoteValidityDays: 'Enter a number of days',
  invoiceDueDays: 'Enter a number of days (0 means due on receipt)',
  defaultTaxRate: 'Enter a tax rate (0 if you don’t charge tax)',
};

/** Parses a numeric input; the shared schema then checks ranges and decimals. */
function parseNumber(field: NumberField, value: string): number | { error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { error: BLANK_NUMBER_MESSAGES[field] };
  }
  const number = Number(trimmed);
  if (!Number.isFinite(number)) {
    return { error: field === 'defaultTaxRate' ? 'Enter a number such as 7.5' : 'Enter a number' };
  }
  return number;
}

/**
 * Builds the PATCH body from the fields that differ from the saved settings
 * and validates it with the shared schema. Optional text fields are sent as ''
 * to clear them; the address is sent whole when any part of it changed.
 */
export function buildBusinessUpdate(
  values: BusinessFormValues,
  saved: BusinessFormValues,
): FormValidation<UpdateBusinessInput> {
  const changed = new Set(changedBusinessFields(values, saved));
  const input: Record<string, unknown> = {};
  const numberErrors: Record<string, string> = {};

  for (const field of TEXT_FIELDS) {
    if (changed.has(field)) {
      input[field] = values[field];
    }
  }
  for (const field of NUMBER_FIELDS) {
    if (changed.has(field)) {
      const parsed = parseNumber(field, values[field]);
      if (typeof parsed === 'number') {
        input[field] = parsed;
      } else {
        numberErrors[field] = parsed.error;
      }
    }
  }
  if (ADDRESS_KEYS.some((key) => changed.has(`address.${key}`))) {
    input.address = Object.fromEntries(ADDRESS_KEYS.map((key) => [key, values[`address.${key}`]]));
  }

  const result = validateForm(updateBusinessInputSchema, input);
  if (Object.keys(numberErrors).length === 0) {
    return result;
  }
  const fieldErrors: FieldErrors = result.success
    ? numberErrors
    : { ...result.fieldErrors, ...numberErrors };
  return { success: false, fieldErrors };
}

/**
 * The form values after a save: fields still showing what was submitted take
 * the server's (normalised) value; fields edited while the save was in flight
 * keep the newer edit.
 */
export function rebaseBusinessFormValues(
  current: BusinessFormValues,
  submitted: BusinessFormValues,
  saved: BusinessFormValues,
): BusinessFormValues {
  const next = { ...current };
  for (const key of Object.keys(next) as (keyof BusinessFormValues)[]) {
    if (current[key] === submitted[key]) {
      next[key] = saved[key];
    }
  }
  return next;
}

/** Example document number for a prefix being typed, e.g. `QT-0001`; null while it is invalid. */
export function previewDocumentNumber(prefix: string): string | null {
  const parsed = documentPrefixSchema.safeParse(prefix);
  return parsed.success ? formatDocumentNumber(parsed.data, 1) : null;
}

/** The color for the native picker: the typed hex when complete and valid, else the fallback. */
export function pickerColor(value: string, fallback: string): string {
  const parsed = hexColorSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}
