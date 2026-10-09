import { describe, expect, it } from 'vitest';
import { TRADES } from '@/components/marketing/trades';
import { formatKobo } from '../sample-money';
import { priceSampleQuote } from './sample-quote';
import { TRADE_DETAILS } from './trade-details';

describe('priceSampleQuote', () => {
  it('totals a quote the way QuoteFlow does: discount first, then tax', () => {
    const { lines, totals } = priceSampleQuote({
      number: 'QT-0001',
      customer: 'Test',
      lines: [
        { name: 'Deep clean', quantity: 1, rate: 95_000 },
        { name: 'Windows', quantity: 14, unit: 'windows', rate: 1_500 },
      ],
      discount: { type: 'percentage', value: 10 },
      taxRate: 7.5,
    });

    expect(lines.map((line) => line.amount)).toEqual([9_500_000, 2_100_000]);
    expect(totals).toEqual({
      subtotal: 11_600_000,
      discount: 1_160_000,
      tax: 783_000,
      total: 11_223_000,
    });
  });

  it('reads a fixed discount in naira, like the rates', () => {
    const { totals } = priceSampleQuote({
      number: 'QT-0002',
      customer: 'Test',
      lines: [{ name: 'Install', quantity: 1, rate: 100_000 }],
      discount: { type: 'fixed', value: 10_000 },
    });

    expect(formatKobo(totals.total)).toBe('₦90,000.00');
  });

  it('has a sample quote for every trade, and every one adds up', () => {
    for (const trade of TRADES) {
      const { totals } = priceSampleQuote(TRADE_DETAILS[trade.id].quote);
      expect(totals.total, trade.id).toBe(totals.subtotal - totals.discount + totals.tax);
      expect(totals.total, trade.id).toBeGreaterThan(0);
    }
  });
});
