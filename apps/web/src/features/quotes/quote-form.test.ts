import type { QuoteDto } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { newLineItemDraft } from '@/features/documents/line-items';
import { testBusiness } from '@/test/fixtures';
import {
  newQuoteFormValues,
  parsePercent,
  placeFieldErrors,
  previewDiscount,
  previewTaxRate,
  quoteFormSnapshot,
  quoteFormValuesFromQuote,
  toQuoteInput,
  validateQuoteForm,
} from './quote-form';

const CUSTOMER_ID = '64b0000000000000000000aa';

const quote: QuoteDto = {
  id: '64b0000000000000000000bb',
  quoteNumber: 'QT-0007',
  status: 'sent',
  currency: 'NGN',
  customerId: CUSTOMER_ID,
  customer: { name: 'Chidi Okafor', email: null, phone: null, company: null, address: {} },
  items: [
    {
      serviceId: null,
      name: 'Paint walls',
      description: 'Two coats',
      quantity: 3,
      unit: 'room',
      unitPrice: 150_000,
      amount: 450_000,
    },
  ],
  discount: { type: 'fixed', value: 50_000 },
  taxRate: 7.5,
  totals: { subtotal: 450_000, discount: 50_000, tax: 30_000, total: 430_000 },
  notes: null,
  terms: 'Deposit required.',
  issueDate: '2026-10-01',
  expiryDate: '2026-10-15',
  publicToken: 'x'.repeat(43),
  sentAt: '2026-10-01T10:00:00.000Z',
  viewedAt: null,
  acceptedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  invoiceId: null,
  convertedAt: null,
  createdAt: '2026-10-01T09:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
};

describe('quote form', () => {
  it('starts a new quote from the business defaults', () => {
    const values = newQuoteFormValues(testBusiness, '2026-10-08', CUSTOMER_ID);
    expect(values).toMatchObject({
      customerId: CUSTOMER_ID,
      discountMode: 'none',
      taxRate: '7.5',
      notes: '',
      terms: 'Deposit required.',
      issueDate: '2026-10-08',
      expiryDate: '2026-10-22',
    });
    expect(values.items).toHaveLength(1);
  });

  it('round-trips an existing quote to the same API input', () => {
    const values = quoteFormValuesFromQuote(quote);
    expect(values).toMatchObject({ discountMode: 'fixed', discountAmount: 50_000, taxRate: '7.5' });
    expect(toQuoteInput(values)).toEqual({
      customerId: CUSTOMER_ID,
      items: [
        {
          name: 'Paint walls',
          description: 'Two coats',
          quantity: 3,
          unit: 'room',
          unitPrice: 150_000,
        },
      ],
      discount: { type: 'fixed', value: 50_000 },
      taxRate: 7.5,
      notes: '',
      terms: 'Deposit required.',
      issueDate: '2026-10-01',
      expiryDate: '2026-10-15',
    });
  });

  it('maps discount modes and percentages', () => {
    const values = quoteFormValuesFromQuote(quote);
    expect(toQuoteInput({ ...values, discountMode: 'none' }).discount).toBeNull();
    expect(
      toQuoteInput({ ...values, discountMode: 'percentage', discountPercent: '12.5%' }).discount,
    ).toEqual({ type: 'percentage', value: 12.5 });
    expect(parsePercent('')).toBe(0);
    expect(parsePercent('abc')).toBeNaN();
    expect(
      previewDiscount({ ...values, discountMode: 'percentage', discountPercent: '150' }),
    ).toBeNull();
    expect(previewTaxRate({ ...values, taxRate: 'x' })).toBe(0);
  });

  it('validates with the shared schema and friendly messages at API paths', () => {
    const values = {
      ...newQuoteFormValues(testBusiness, '2026-10-08'),
      items: [newLineItemDraft({ quantity: null })],
      taxRate: 'seven',
      expiryDate: '2026-10-01',
    };
    const result = validateQuoteForm(values);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.fieldErrors).toMatchObject({
      customerId: 'Choose a customer',
      'items.0.name': 'Item name is required',
      'items.0.quantity': 'Enter a quantity',
      'items.0.unitPrice': 'Enter a price',
      taxRate: 'Enter a percentage such as 7.5',
      expiryDate: 'The expiry date cannot be before the issue date',
    });
  });

  it('accepts a complete quote', () => {
    const result = validateQuoteForm(quoteFormValuesFromQuote(quote));
    expect(result.success).toBe(true);
  });

  it('places server errors next to visible fields', () => {
    expect(
      placeFieldErrors({ 'items.2.serviceId': 'Service not found', discount: 'Invalid discount' }),
    ).toEqual({ 'items.2.name': 'Service not found', 'discount.value': 'Invalid discount' });
  });

  it('compares content without row keys', () => {
    const a = quoteFormValuesFromQuote(quote);
    const b = quoteFormValuesFromQuote(quote);
    expect(a.items[0]?.key).not.toBe(b.items[0]?.key);
    expect(quoteFormSnapshot(a)).toBe(quoteFormSnapshot(b));
    expect(quoteFormSnapshot({ ...a, notes: 'Changed' })).not.toBe(quoteFormSnapshot(b));
  });
});
