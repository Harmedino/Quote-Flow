import { type CurrencyCode, fromMinorUnits } from '@quoteflow/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Good morning", "Good afternoon" or "Good evening" for the time in the business's zone. */
export function greeting(now: Date, timeZone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(now),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Today's date in the business's zone, e.g. "Friday, October 9". */
export function formatLongToday(now: Date, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone,
  }).format(now);
}

/** A 'YYYY-MM-DD' calendar date as a short label, e.g. "Oct 9". */
export function formatShortDate(isoDate: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

/** From here on a figure is shortened (₦4.3M); below it, it shows whole units (₦430,000). */
const COMPACT_FROM = 1_000_000;

/**
 * An amount short enough for a stat figure: whole units, and from a million up compact
 * notation, e.g. $2,497 or ₦4.3M. Show the exact amount alongside it.
 */
export function formatMoneyShort(minor: number, currency: CurrencyCode, locale?: string): string {
  const major = fromMinorUnits(minor, currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    notation: Math.abs(major) >= COMPACT_FROM ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(major) >= COMPACT_FROM ? 1 : 0,
  }).format(major);
}

/** Whole-percent change, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Calendar days from `today` to `isoDate` (negative when it is in the past). */
export function daysBetween(today: string, isoDate: string): number {
  return Math.round(
    (Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS,
  );
}

/** When an unpaid invoice is due, relative to today: "Due in 3 days", "4 days overdue". */
export function dueLabel(dueDate: string, today: string): string {
  const days = daysBetween(today, dueDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  return `${-days} ${days === -1 ? 'day' : 'days'} overdue`;
}

/** "1 quote", "3 quotes". */
export function plural(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
