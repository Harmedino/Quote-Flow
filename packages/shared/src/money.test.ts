import { describe, expect, it } from 'vitest';
import { formatMoney, fromMinorUnits, toMinorUnits } from './money';

describe('toMinorUnits', () => {
  it('converts decimal amounts using the currency exponent', () => {
    expect(toMinorUnits(12.34, 'USD')).toBe(1234);
    expect(toMinorUnits(1500, 'JPY')).toBe(1500);
    expect(toMinorUnits(1.234, 'KWD')).toBe(1234);
  });

  it('is not affected by binary floating point error', () => {
    expect(toMinorUnits(1.005, 'USD')).toBe(101);
    expect(toMinorUnits(0.1 + 0.2, 'USD')).toBe(30);
    expect(toMinorUnits(19.99, 'NGN')).toBe(1999);
  });

  it('handles zero and negative amounts', () => {
    expect(toMinorUnits(0, 'USD')).toBe(0);
    expect(Object.is(toMinorUnits(-0, 'USD'), 0)).toBe(true);
    expect(toMinorUnits(-2.5, 'USD')).toBe(-250);
  });

  it('rejects non-finite input', () => {
    expect(() => toMinorUnits(Number.NaN, 'USD')).toThrow(RangeError);
    expect(() => toMinorUnits(Number.POSITIVE_INFINITY, 'USD')).toThrow(RangeError);
  });
});

describe('fromMinorUnits', () => {
  it('converts minor units back to a decimal amount', () => {
    expect(fromMinorUnits(1234, 'USD')).toBe(12.34);
    expect(fromMinorUnits(1500, 'JPY')).toBe(1500);
    expect(fromMinorUnits(1234, 'BHD')).toBe(1.234);
  });
});

describe('formatMoney', () => {
  it('formats with the currency symbol and exact minor unit digits', () => {
    expect(formatMoney(123456, 'USD', 'en-US')).toBe('$1,234.56');
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500');
    expect(formatMoney(1234, 'KWD', 'en-US')).toMatch(/^KWD\s1\.234$/);
  });
});
