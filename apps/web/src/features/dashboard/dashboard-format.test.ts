import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  dueLabel,
  formatMoneyAxis,
  formatMoneyShort,
  formatPlace,
  formatShortDate,
  formatToday,
  greeting,
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

describe('formatToday', () => {
  it('names the day in the business time zone', () => {
    const now = new Date('2026-10-09T09:30:00Z');
    expect(formatToday(now, 'Africa/Lagos', 'en-GB')).toBe('Friday · 9 Oct 2026');
    expect(formatToday(now, 'Pacific/Honolulu', 'en-US')).toBe('Thursday · Oct 8, 2026');
  });
});

describe('formatPlace', () => {
  it('joins the city and state that are filled in', () => {
    expect(formatPlace({ city: 'Victoria Island', state: 'Lagos' })).toBe('Victoria Island, Lagos');
    expect(formatPlace({ city: ' ', state: 'Lagos' })).toBe('Lagos');
    expect(formatPlace({})).toBeNull();
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

describe('formatMoneyAxis', () => {
  it('always uses compact notation', () => {
    expect(formatMoneyAxis(0, 'NGN', 'en-US')).toBe('₦0');
    expect(formatMoneyAxis(10_000_000, 'NGN', 'en-US')).toBe('₦100K');
    expect(formatMoneyAxis(150_000_000, 'NGN', 'en-US')).toBe('₦1.5M');
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
