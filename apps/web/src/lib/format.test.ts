import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './format';

describe('formatDate', () => {
  const instant = '2026-03-01T02:30:00Z';

  it('formats in the requested locale and time zone', () => {
    expect(formatDate(instant, { locale: 'en-US', timeZone: 'UTC' })).toBe('Mar 1, 2026');
    expect(formatDate(instant, { locale: 'en-US', timeZone: 'America/New_York' })).toBe(
      'Feb 28, 2026',
    );
  });

  it('accepts Date objects, timestamps and a date style', () => {
    const date = new Date(instant);
    expect(formatDate(date, { locale: 'en-GB', timeZone: 'UTC', dateStyle: 'long' })).toBe(
      '1 March 2026',
    );
    expect(formatDate(date.getTime(), { locale: 'en-US', timeZone: 'UTC' })).toBe('Mar 1, 2026');
  });

  it('rejects invalid dates', () => {
    expect(() => formatDate('not a date')).toThrow(RangeError);
  });
});

describe('formatMoney', () => {
  it('formats minor units using the currency precision', () => {
    expect(formatMoney(123450, 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatMoney(5000, 'JPY', 'en-US')).toBe('¥5,000');
  });
});
