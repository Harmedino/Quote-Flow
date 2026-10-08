import { MAX_LINE_ITEMS, MAX_MONEY_AMOUNT, MAX_QUANTITY } from '@quoteflow/shared';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { quoteInput, validationErrorsOf } from '../test/model-fixtures';
import { QuoteModel } from './quote.model';

const LINE = { name: 'AC tune-up', quantity: 1, unitPrice: 12_900 };

describe('QuoteModel', () => {
  it('accepts a complete quote and applies defaults', async () => {
    const quote = new QuoteModel(quoteInput());
    expect(await validationErrorsOf(quote)).toEqual({});
    expect(quote).toMatchObject({ status: 'draft', taxRate: 0, discount: null });
  });

  it('requires the core fields', async () => {
    const errors = await validationErrorsOf(new QuoteModel({}));
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        'businessId',
        'customerId',
        'customer',
        'quoteNumber',
        'currency',
        'items',
        'issueDate',
        'expiryDate',
        'publicToken',
        'createdBy',
      ]),
    );
  });

  it('derives line amounts and totals, ignoring supplied values', async () => {
    const quote = new QuoteModel(
      quoteInput({
        items: [
          { name: 'Deep cleaning', quantity: 2.5, unitPrice: 1_999, amount: 1 },
          { name: 'AC tune-up', quantity: 1, unitPrice: 10_000, amount: 999_999 },
        ],
        discount: { type: 'percentage', value: 10 },
        taxRate: 8.25,
        totals: { subtotal: 1, discount: 2, tax: 3, total: 4 },
      }),
    );

    expect(await validationErrorsOf(quote)).toEqual({});
    expect(quote.items.map((item) => item.amount)).toEqual([4_998, 10_000]);
    // 14,998 − 10% (1,500) = 13,498; tax 8.25% = 1,113.585 → 1,114.
    expect(quote.totals).toMatchObject({
      subtotal: 14_998,
      discount: 1_500,
      tax: 1_114,
      total: 14_612,
    });
  });

  it('recalculates totals when the items change', async () => {
    const quote = new QuoteModel(quoteInput({ items: [LINE] }));
    await quote.validate();
    expect(quote.totals.total).toBe(12_900);

    quote.items.push({ ...LINE, quantity: 2 });
    await quote.validate();
    expect(quote.totals.total).toBe(38_700);
  });

  it('caps a fixed discount at the subtotal', async () => {
    const quote = new QuoteModel(
      quoteInput({ items: [LINE], discount: { type: 'fixed', value: 50_000 } }),
    );
    await quote.validate();
    expect(quote.totals).toMatchObject({ subtotal: 12_900, discount: 12_900, total: 0 });
  });

  it.each([
    ['a fractional unit price', { ...LINE, unitPrice: 10.5 }, 'items.0.unitPrice'],
    ['a negative unit price', { ...LINE, unitPrice: -1 }, 'items.0.unitPrice'],
    [
      'a unit price above the maximum',
      { ...LINE, unitPrice: MAX_MONEY_AMOUNT + 1 },
      'items.0.unitPrice',
    ],
    ['a zero quantity', { ...LINE, quantity: 0 }, 'items.0.quantity'],
    ['a quantity above the maximum', { ...LINE, quantity: MAX_QUANTITY + 1 }, 'items.0.quantity'],
    ['a quantity with four decimals', { ...LINE, quantity: 1.0005 }, 'items.0.quantity'],
    ['a blank name', { ...LINE, name: '   ' }, 'items.0.name'],
    ['an overlong unit', { ...LINE, unit: 'x'.repeat(31) }, 'items.0.unit'],
  ])('rejects an item with %s', async (_label, item, path) => {
    const errors = await validationErrorsOf(new QuoteModel(quoteInput({ items: [item] })));
    expect(errors).toHaveProperty([path]);
  });

  it('requires between 1 and MAX_LINE_ITEMS items', async () => {
    expect(await validationErrorsOf(new QuoteModel(quoteInput({ items: [] })))).toMatchObject({
      items: 'Add at least one item',
    });
    const tooMany = Array.from({ length: MAX_LINE_ITEMS + 1 }, () => LINE);
    expect(await validationErrorsOf(new QuoteModel(quoteInput({ items: tooMany })))).toHaveProperty(
      'items',
    );
  });

  it('rejects totals that exceed the safe integer range', async () => {
    const huge = { name: 'Huge', quantity: MAX_QUANTITY, unitPrice: MAX_MONEY_AMOUNT };
    const quote = new QuoteModel(
      quoteInput({
        items: Array.from({ length: 10 }, () => huge),
        discount: { type: 'percentage', value: 5 },
      }),
    );
    expect(await validationErrorsOf(quote)).toHaveProperty('totals');
  });

  it.each([
    [{ type: 'percentage', value: 100.5 }, 'Percentage cannot exceed 100'],
    [{ type: 'percentage', value: 12.345 }, 'Percentage can have at most 2 decimal places'],
    [{ type: 'fixed', value: 12.5 }, 'Amount must be in minor units'],
    [{ type: 'fixed', value: -100 }, 'Amount cannot be negative'],
  ])('validates the discount value against its type: %j', async (discount, message) => {
    const errors = await validationErrorsOf(new QuoteModel(quoteInput({ discount })));
    expect(errors['discount.value']).toBe(message);
  });

  it('rejects an unknown discount type', async () => {
    const errors = await validationErrorsOf(
      new QuoteModel(quoteInput({ discount: { type: 'bogus', value: 10 } })),
    );
    expect(errors).toHaveProperty(['discount.type']);
  });

  it.each([
    ['status', { status: 'archived' }],
    ['currency', { currency: 'XYZ' }],
    ['taxRate', { taxRate: 120 }],
    ['publicToken', { publicToken: 'too-short' }],
    ['customer.email', { customer: { name: 'Olivia Harper', email: 'not-an-email' } }],
    ['customer.name', { customer: { name: '' } }],
    ['rejectionReason', { rejectionReason: 'x'.repeat(1001) }],
  ])('rejects an invalid %s', async (path, overrides) => {
    expect(await validationErrorsOf(new QuoteModel(quoteInput(overrides)))).toHaveProperty([path]);
  });

  it('rejects an expiry date before the issue date but allows the same day', async () => {
    const issueDate = new Date('2026-03-02T09:00:00Z');
    const before = new QuoteModel(
      quoteInput({ issueDate, expiryDate: new Date('2026-03-01T09:00:00Z') }),
    );
    expect(await validationErrorsOf(before)).toMatchObject({
      expiryDate: 'The expiry date cannot be before the issue date',
    });
    const sameDay = new QuoteModel(quoteInput({ issueDate, expiryDate: issueDate }));
    expect(await validationErrorsOf(sameDay)).toEqual({});
  });

  it('keeps businessId, createdBy and currency immutable once saved', () => {
    const original = quoteInput();
    const quote = QuoteModel.hydrate({ _id: new Types.ObjectId(), ...original });

    quote.set({
      businessId: new Types.ObjectId(),
      createdBy: new Types.ObjectId(),
      currency: 'EUR',
    });

    expect(quote.businessId).toEqual(original.businessId);
    expect(quote.createdBy).toEqual(original.createdBy);
    expect(quote.currency).toBe('USD');
  });

  it('declares the tenant-scoped and unique indexes', () => {
    const indexes = QuoteModel.schema.indexes();
    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ businessId: 1, quoteNumber: 1 }, expect.objectContaining({ unique: true })],
        [{ publicToken: 1 }, expect.objectContaining({ unique: true })],
        [{ businessId: 1, status: 1, createdAt: -1 }, expect.anything()],
        [{ businessId: 1, customerId: 1, createdAt: -1 }, expect.anything()],
        [{ businessId: 1, createdAt: -1 }, expect.anything()],
        [{ businessId: 1, expiryDate: 1 }, expect.anything()],
      ]),
    );
  });
});
