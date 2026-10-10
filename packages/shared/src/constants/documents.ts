export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DEFAULT_QUOTE_PREFIX = 'QT';
export const DEFAULT_INVOICE_PREFIX = 'INV';
export const DEFAULT_QUOTE_VALIDITY_DAYS = 14;
export const DEFAULT_INVOICE_DUE_DAYS = 14;
/** Ink, as on QuoteFlow's own dark sections, until the business picks its colour. */
export const DEFAULT_BRAND_COLOR = '#0c1a14';
export const DEFAULT_TIMEZONE = 'UTC';

export const MAX_LINE_ITEMS = 100;
/** Quantities support up to three decimal places (e.g. 2.5 hours, 12.125 m²). */
export const MAX_QUANTITY = 100_000;
export const QUANTITY_DECIMALS = 3;
/**
 * Upper bound for every monetary value, in minor units: unit prices, line
 * amounts, fixed discounts, payments, and document subtotals and totals. It
 * allows 1 trillion major units in 2-decimal currencies (enough for IDR or
 * COP), keeps all arithmetic, even with 100% tax, far below
 * Number.MAX_SAFE_INTEGER, and lets a single payment settle any valid invoice.
 */
export const MAX_MONEY_AMOUNT = 100_000_000_000_000;
export const PERCENTAGE_DECIMALS = 2;

export const DOCUMENT_NUMBER_PAD_LENGTH = 4;

/** Formats a per-business document number, e.g. `QT-0042`. */
export function formatDocumentNumber(prefix: string, sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError('Document sequence must be a positive integer');
  }
  return `${prefix}-${String(sequence).padStart(DOCUMENT_NUMBER_PAD_LENGTH, '0')}`;
}
