import { z } from 'zod';
import { CURRENCY_CODES } from './constants/currencies';
import {
  DISCOUNT_TYPES,
  MAX_LINE_ITEMS,
  MAX_MONEY_AMOUNT,
  MAX_QUANTITY,
  PERCENTAGE_DECIMALS,
  QUANTITY_DECIMALS,
} from './constants/documents';

/**
 * Reusable validation primitives. Request schemas for individual endpoints
 * are composed from these so the API and the web forms enforce identical
 * rules. The API remains the authority: it validates every request itself.
 */

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email address is too long')
  .pipe(z.email('Enter a valid email address'));

export const optionalEmailSchema = z.union([z.literal(''), emailSchema]).optional();

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]{5,32}$/, 'Enter a valid phone number');

/** bcrypt only uses the first 72 bytes of a password, so longer ones are rejected. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((password) => utf8ByteLength(password) <= 72, 'Password is too long');

export const personNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(120, 'Name is too long');

export const hexColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'Enter a hex color such as #0f766e');

export const currencyCodeSchema = z.enum(CURRENCY_CODES);

export const timeZoneSchema = z
  .string()
  .trim()
  .refine(isValidTimeZone, 'Enter a valid IANA time zone such as Africa/Lagos');

export const documentPrefixSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/,
    'Use letters and numbers, optionally separated by single hyphens',
  )
  .max(12, 'Prefix must be at most 12 characters');

/** A monetary amount in minor units (e.g. cents). */
export const moneySchema = z
  .number()
  .int('Amount must be in minor units')
  .min(0, 'Amount cannot be negative')
  .max(MAX_MONEY_AMOUNT, 'Amount is too large');

export const quantitySchema = z
  .number()
  .positive('Quantity must be greater than zero')
  .max(MAX_QUANTITY, 'Quantity is too large')
  .refine(
    (value) => hasAtMostDecimals(value, QUANTITY_DECIMALS),
    `Quantity can have at most ${QUANTITY_DECIMALS} decimal places`,
  );

export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100')
  .refine(
    (value) => hasAtMostDecimals(value, PERCENTAGE_DECIMALS),
    `Percentage can have at most ${PERCENTAGE_DECIMALS} decimal places`,
  );

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const addressSchema = z.object({
  line1: optionalText(200),
  line2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  postalCode: optionalText(20),
  country: optionalText(100),
});

export const lineItemInputSchema = z.object({
  serviceId: objectIdSchema.optional(),
  name: z.string().trim().min(1, 'Item name is required').max(200, 'Item name is too long'),
  description: optionalText(2000),
  quantity: quantitySchema,
  unit: optionalText(30),
  unitPrice: moneySchema,
});

export const lineItemsSchema = z
  .array(lineItemInputSchema)
  .min(1, 'Add at least one item')
  .max(MAX_LINE_ITEMS, `A document can have at most ${MAX_LINE_ITEMS} items`);

export const discountSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(DISCOUNT_TYPES[0]), value: percentageSchema }),
  z.object({ type: z.literal(DISCOUNT_TYPES[1]), value: moneySchema }),
]);

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type LineItemInput = z.infer<typeof lineItemInputSchema>;
export type DiscountInput = z.infer<typeof discountSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
