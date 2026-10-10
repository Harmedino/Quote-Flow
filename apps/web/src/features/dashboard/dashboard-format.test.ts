import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  dueLabel,
  formatLongToday,
  formatMoneyShort,
  formatShortDate,
  greeting,
  percentChange,
  plural,
} from './dashboard-format';

describe('greeting', () => {
  // 09:30 UTC is 10:30 in Lagos, 17:30 in Singapore and 23:30 the day before in Honolulu.
  const now = new Date('2026-10-09T09:30:00Z');

  it('uses the hour in the business time zone', () => {
    expect(greeting(now, 'Africa/Lagos')).toBe('Good morning');
    expect(greeting(now, 'Asia/Singapore')).toBe('Good afternoon');
    expect(greeting(now, 'Pacific/Honolulu')).toBe('Good evening');
  });

  it('treats midnight as morning', () => {
    expect(greeting(new Date('2026-10-09T00:00:00Z'), 'UTC')).toBe('Good morning');
  });
});

describe('formatLongToday', () => {
  it('names the day in the business time zone', () => {
    const now = new Date('2026-10-09T09:30:00Z');
    expect(formatLongToday(now, 'Africa/Lagos', 'en-US')).toBe('Friday, October 9');
    expect(formatLongToday(now, 'Pacific/Honolulu', 'en-US')).toBe('Thursday, October 8');
  });
});

describe('formatShortDate', () => {
  it('formats a calendar date without shifting it', () => {
    expect(formatShortDate('2026-10-01', 'en-US')).toBe('Oct 1');
  });
});

describe('formatMoneyShort', () => {
  it('shows whole units, and millions in compact notation', () => {
    expect(formatMoneyShort(43_000_000, 'NGN', 'en-US')).toBe('₦430,000');
    expect(formatMoneyShort(430_000_000, 'NGN', 'en-US')).toBe('₦4.3M');
    expect(formatMoneyShort(754_976, 'USD', 'en-US')).toBe('$7,550');
    expect(formatMoneyShort(95_000, 'USD', 'en-US')).toBe('$950');
    // No minor units: the amount is already whole.
    expect(formatMoneyShort(250_000, 'XOF', 'en-US')).toContain('250,000');
  });
});

describe('percentChange', () => {
  it('rounds to whole percents', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 150)).toBe(-67);
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe('dueLabel', () => {
  const today = '2026-10-09';

  it('counts calendar days to or past the due date', () => {
    expect(daysBetween(today, '2026-11-01')).toBe(23);
    expect(dueLabel('2026-10-09', today)).toBe('Due today');
    expect(dueLabel('2026-10-10', today)).toBe('Due tomorrow');
    expect(dueLabel('2026-10-12', today)).toBe('Due in 3 days');
    expect(dueLabel('2026-10-08', today)).toBe('1 day overdue');
    expect(dueLabel('2026-09-29', today)).toBe('10 days overdue');
  });
});

describe('plural', () => {
  it('adds an s for anything but one', () => {
    expect(plural(1, 'quote')).toBe('1 quote');
    expect(plural(0, 'invoice')).toBe('0 invoices');
  });
});
