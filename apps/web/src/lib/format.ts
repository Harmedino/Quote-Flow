/** Formats an amount stored in minor units, e.g. `formatMoney(123450, 'USD')` → `$1,234.50`. */
export { formatMoney } from '@quoteflow/shared';

export interface FormatDateOptions {
  /** IANA time zone, typically the business's configured time zone. */
  timeZone?: string;
  locale?: string;
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
}

/** Formats a date for display, e.g. `Oct 8, 2026`. Throws a RangeError for invalid dates. */
export function formatDate(
  value: Date | string | number,
  { timeZone, locale, dateStyle = 'medium' }: FormatDateOptions = {},
): string {
  return new Intl.DateTimeFormat(locale, { dateStyle, timeZone }).format(new Date(value));
}

/**
 * Formats a calendar date sent by the API as 'YYYY-MM-DD' (issue, expiry, due
 * and payment dates). These are dates, not instants, so they are formatted in
 * UTC: formatting them in the viewer's zone could show the previous day.
 */
export function formatCalendarDate(
  isoDate: string,
  { locale, dateStyle = 'medium' }: Omit<FormatDateOptions, 'timeZone'> = {},
): string {
  return formatDate(`${isoDate}T00:00:00Z`, { locale, dateStyle, timeZone: 'UTC' });
}
