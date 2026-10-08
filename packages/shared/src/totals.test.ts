import { describe, expect, it } from 'vitest';
import { MAX_LINE_ITEMS, MAX_MONEY_AMOUNT, MAX_QUANTITY } from './constants/documents';
import { calculateDocumentTotals, calculateLineAmount, calculatePercentageOf } from './totals';

describe('calculateLineAmount', () => {
  it('multiplies quantity by unit price in minor units', () => {
    expect(calculateLineAmount(3, 2500)).toBe(7500);
  });

  it('supports fractional quantities and rounds half up', () => {
    expect(calculateLineAmount(2.5, 1999)).toBe(4998);
    expect(calculateLineAmount(0.333, 100)).toBe(33);
    expect(calculateLineAmount(1.125, 2)).toBe(2);
    expect(calculateLineAmount(0.5, 1)).toBe(1);
  });

  it('stays exact up to MAX_MONEY_AMOUNT', () => {
    expect(calculateLineAmount(1_000, 100_000_000_000)).toBe(100_000_000_000_000);
    expect(calculateLineAmount(1, MAX_MONEY_AMOUNT)).toBe(MAX_MONEY_AMOUNT);
  });

  it('rejects a line amount above MAX_MONEY_AMOUNT', () => {
    expect(() => calculateLineAmount(100_000, MAX_MONEY_AMOUNT)).toThrow(
      new RangeError('Line amount is too large'),
    );
  });

  it('rejects invalid input', () => {
    expect(() => calculateLineAmount(-1, 100)).toThrow(RangeError);
    expect(() => calculateLineAmount(1, 10.5)).toThrow(RangeError);
    expect(() => calculateLineAmount(1, -5)).toThrow(RangeError);
  });
});

describe('calculatePercentageOf', () => {
  it('supports two decimal places of precision', () => {
    expect(calculatePercentageOf(10_000, 7.5)).toBe(750);
    expect(calculatePercentageOf(9_999, 12.25)).toBe(1225);
    expect(calculatePercentageOf(1, 50)).toBe(1);
  });

  it('rejects out-of-range percentages', () => {
    expect(() => calculatePercentageOf(100, 101)).toThrow(RangeError);
    expect(() => calculatePercentageOf(100, -1)).toThrow(RangeError);
  });
});

describe('calculateDocumentTotals', () => {
  const items = [
    { quantity: 2, unitPrice: 15_000 },
    { quantity: 1.5, unitPrice: 4_000 },
  ];

  it('sums line items without discount or tax', () => {
    expect(calculateDocumentTotals({ items })).toEqual({
      subtotal: 36_000,
      discount: 0,
      tax: 0,
      total: 36_000,
    });
  });

  it('applies a percentage discount before tax', () => {
    expect(
      calculateDocumentTotals({ items, discount: { type: 'percentage', value: 10 }, taxRate: 7.5 }),
    ).toEqual({ subtotal: 36_000, discount: 3_600, tax: 2_430, total: 34_830 });
  });

  it('applies a fixed discount capped at the subtotal', () => {
    expect(calculateDocumentTotals({ items, discount: { type: 'fixed', value: 1_000 } })).toEqual({
      subtotal: 36_000,
      discount: 1_000,
      tax: 0,
      total: 35_000,
    });
    expect(
      calculateDocumentTotals({ items, discount: { type: 'fixed', value: 50_000 }, taxRate: 10 }),
    ).toEqual({ subtotal: 36_000, discount: 36_000, tax: 0, total: 0 });
  });

  it('rejects a subtotal above MAX_MONEY_AMOUNT as soon as it is reached', () => {
    const line = { quantity: 1, unitPrice: MAX_MONEY_AMOUNT };
    expect(calculateDocumentTotals({ items: [line] }).total).toBe(MAX_MONEY_AMOUNT);
    expect(() => calculateDocumentTotals({ items: [line, { quantity: 1, unitPrice: 1 }] })).toThrow(
      new RangeError('Document total is too large'),
    );
  });

  it('rejects the largest items the validation rules accept', () => {
    const items = Array.from({ length: MAX_LINE_ITEMS }, () => ({
      quantity: MAX_QUANTITY,
      unitPrice: MAX_MONEY_AMOUNT,
    }));
    expect(() => calculateDocumentTotals({ items, taxRate: 0 })).toThrow(RangeError);
  });

  it('rejects a total that only exceeds MAX_MONEY_AMOUNT after tax', () => {
    const items = [{ quantity: 1, unitPrice: MAX_MONEY_AMOUNT }];
    expect(() => calculateDocumentTotals({ items, taxRate: 10 })).toThrow(
      new RangeError('Document total is too large'),
    );
    expect(
      calculateDocumentTotals({ items, discount: { type: 'percentage', value: 50 }, taxRate: 100 })
        .total,
    ).toBe(MAX_MONEY_AMOUNT);
  });

  it('returns zeros for an empty document', () => {
    expect(calculateDocumentTotals({ items: [], taxRate: 5 })).toEqual({
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    });
  });
});
