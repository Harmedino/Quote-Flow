import { describe, expect, it } from 'vitest';
import { currencySymbol, formatMoneyInput, parseMoneyInput } from './money-input';

describe('parseMoneyInput', () => {
  it('converts typed amounts to minor units', () => {
    expect(parseMoneyInput('1,250.5', 'USD')).toBe(125050);
    expect(parseMoneyInput(' 99.99 ', 'USD')).toBe(9999);
    expect(parseMoneyInput('1500', 'JPY')).toBe(1500);
    expect(parseMoneyInput('1.234', 'KWD')).toBe(1234);
  });

  it('treats an empty field as no amount', () => {
    expect(parseMoneyInput('  ', 'USD')).toBeNull();
  });

  it('rejects text that is not an amount in the currency', () => {
    expect(parseMoneyInput('12.345', 'USD')).toBeUndefined();
    expect(parseMoneyInput('12.5', 'JPY')).toBeUndefined();
    expect(parseMoneyInput('-5', 'USD')).toBeUndefined();
    expect(parseMoneyInput('abc', 'USD')).toBeUndefined();
  });
});

describe('formatMoneyInput', () => {
  it('groups a long amount at rest and leaves it plain for editing', () => {
    expect(formatMoneyInput(1_250_000_000, 'NGN', { grouped: true })).toBe('12,500,000.00');
    expect(formatMoneyInput(1_250_000_000, 'NGN', { grouped: false })).toBe('12500000.00');
    expect(formatMoneyInput(1500, 'JPY', { grouped: true })).toBe('1,500');
    expect(formatMoneyInput(null, 'USD', { grouped: true })).toBe('');
  });

  it('reads back as the same amount', () => {
    const shown = formatMoneyInput(98_765_432, 'KWD', { grouped: true });
    expect(parseMoneyInput(shown, 'KWD')).toBe(98_765_432);
  });
});

describe('currencySymbol', () => {
  it('uses the symbol people know the currency by', () => {
    expect(currencySymbol('NGN', 'en-US')).toBe('₦');
    expect(currencySymbol('GHS', 'en-US')).toBe('GH₵');
    expect(currencySymbol('USD', 'en-US')).toBe('$');
  });
});
