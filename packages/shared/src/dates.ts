import { z } from 'zod';

/**
 * Calendar dates (issue, expiry, due and payment dates) travel as
 * 'YYYY-MM-DD' strings and are stored as UTC midnight. "Today" is always
 * evaluated in the business's time zone so a quote does not expire early
 * or late for businesses far from UTC.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const isoDateSchema = z.string().trim().refine(isValidIsoDate, 'Enter a valid date');

export function isoDateToUtcDate(isoDate: string): Date {
  if (!isValidIsoDate(isoDate)) throw new RangeError(`Invalid ISO date: ${isoDate}`);
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function utcDateToIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = isoDateToUtcDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToIsoDate(date);
}

/** Today's calendar date in the given IANA time zone, as 'YYYY-MM-DD'. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
