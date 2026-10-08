import { describe, expect, it } from 'vitest';
import { formatDocumentNumber } from './constants/documents';
import {
  discountSchema,
  documentPrefixSchema,
  emailSchema,
  hexColorSchema,
  lineItemInputSchema,
  objectIdSchema,
  paginationQuerySchema,
  passwordSchema,
  percentageSchema,
  phoneSchema,
  quantitySchema,
  timeZoneSchema,
} from './validation';

describe('validation primitives', () => {
  it('normalises and validates email addresses', () => {
    expect(emailSchema.parse('  Owner@Example.COM ')).toBe('owner@example.com');
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });

  it('validates object ids', () => {
    expect(objectIdSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
    expect(objectIdSchema.safeParse('507f1f77bcf86cd79943901').success).toBe(false);
    expect(objectIdSchema.safeParse({ $ne: null }).success).toBe(false);
  });

  it('validates phone numbers loosely', () => {
    expect(phoneSchema.parse(' +234 803 123 4567 ')).toBe('+234 803 123 4567');
    expect(phoneSchema.safeParse('call me').success).toBe(false);
  });

  it('enforces password length in bytes', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
    expect(passwordSchema.safeParse('a'.repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(73)).success).toBe(false);
    expect(passwordSchema.safeParse('é'.repeat(37)).success).toBe(false);
  });

  it('normalises hex colors and document prefixes', () => {
    expect(hexColorSchema.parse('#0F766E')).toBe('#0f766e');
    expect(hexColorSchema.safeParse('teal').success).toBe(false);
    expect(documentPrefixSchema.parse(' inv ')).toBe('INV');
    expect(documentPrefixSchema.parse('ac-q')).toBe('AC-Q');
    expect(documentPrefixSchema.safeParse('-QT').success).toBe(false);
    expect(documentPrefixSchema.safeParse('Q T').success).toBe(false);
  });

  it('validates time zones', () => {
    expect(timeZoneSchema.safeParse('Africa/Lagos').success).toBe(true);
    expect(timeZoneSchema.safeParse('Mars/Olympus').success).toBe(false);
  });

  it('limits decimal places for quantities and percentages', () => {
    expect(quantitySchema.safeParse(2.125).success).toBe(true);
    expect(quantitySchema.safeParse(2.1255).success).toBe(false);
    expect(quantitySchema.safeParse(0).success).toBe(false);
    expect(percentageSchema.safeParse(7.5).success).toBe(true);
    expect(percentageSchema.safeParse(7.555).success).toBe(false);
    expect(percentageSchema.safeParse(100.01).success).toBe(false);
  });

  it('validates line items with integer minor-unit prices', () => {
    const item = { name: ' Deep cleaning ', quantity: 1, unitPrice: 25_000 };
    expect(lineItemInputSchema.parse(item).name).toBe('Deep cleaning');
    expect(lineItemInputSchema.safeParse({ ...item, unitPrice: 250.5 }).success).toBe(false);
    expect(lineItemInputSchema.safeParse({ ...item, name: '  ' }).success).toBe(false);
  });

  it('validates discounts by type', () => {
    expect(discountSchema.safeParse({ type: 'percentage', value: 15 }).success).toBe(true);
    expect(discountSchema.safeParse({ type: 'percentage', value: 150 }).success).toBe(false);
    expect(discountSchema.safeParse({ type: 'fixed', value: 5_000 }).success).toBe(true);
    expect(discountSchema.safeParse({ type: 'fixed', value: 50.5 }).success).toBe(false);
  });

  it('coerces and bounds pagination query parameters', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
    expect(paginationQuerySchema.safeParse({ pageSize: '1000' }).success).toBe(false);
  });
});

describe('formatDocumentNumber', () => {
  it('pads the sequence', () => {
    expect(formatDocumentNumber('QT', 7)).toBe('QT-0007');
    expect(formatDocumentNumber('INV', 12345)).toBe('INV-12345');
  });

  it('rejects invalid sequences', () => {
    expect(() => formatDocumentNumber('QT', 0)).toThrow(RangeError);
    expect(() => formatDocumentNumber('QT', 1.5)).toThrow(RangeError);
  });
});
