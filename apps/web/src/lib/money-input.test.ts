import { describe, expect, it } from 'vitest';
import { parseMoneyInput } from './money-input';

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
