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
