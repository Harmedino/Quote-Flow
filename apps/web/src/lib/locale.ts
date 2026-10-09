import {
  CURRENCIES,
  type CurrencyCode,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
} from '@quoteflow/shared';

/**
 * Regions (ISO 3166-1 alpha-2) whose everyday currency is one QuoteFlow
 * supports. Typed by currency so a newly supported currency cannot be forgotten.
 */
const CURRENCY_REGIONS: Readonly<Record<CurrencyCode, readonly string[]>> = {
  USD: ['US', 'PR', 'EC', 'SV'],
  // prettier-ignore
  EUR: [
    'AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV',
    'MT', 'NL', 'PT', 'SI', 'SK', 'AD', 'MC', 'SM', 'VA', 'ME', 'XK',
  ],
  GBP: ['GB', 'IM', 'JE', 'GG'],
  CAD: ['CA'],
  AUD: ['AU'],
  NZD: ['NZ'],
  CHF: ['CH', 'LI'],
  SEK: ['SE'],
  NOK: ['NO'],
  DKK: ['DK', 'FO', 'GL'],
  PLN: ['PL'],
  TRY: ['TR'],
  NGN: ['NG'],
  GHS: ['GH'],
  KES: ['KE'],
  UGX: ['UG'],
  TZS: ['TZ'],
  RWF: ['RW'],
  ETB: ['ET'],
  ZAR: ['ZA'],
  EGP: ['EG'],
  MAD: ['MA'],
  XOF: ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'],
  XAF: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'],
  AED: ['AE'],
  SAR: ['SA'],
  QAR: ['QA'],
  KWD: ['KW'],
  BHD: ['BH'],
  OMR: ['OM'],
  JOD: ['JO'],
  INR: ['IN'],
  PKR: ['PK'],
  BDT: ['BD'],
  LKR: ['LK'],
  SGD: ['SG'],
  MYR: ['MY'],
  PHP: ['PH'],
  IDR: ['ID'],
  THB: ['TH'],
  HKD: ['HK'],
  CNY: ['CN'],
  JPY: ['JP'],
  KRW: ['KR'],
  BRL: ['BR'],
  MXN: ['MX'],
  COP: ['CO'],
  CLP: ['CL'],
};

const CURRENCY_BY_REGION = new Map<string, CurrencyCode>(
  Object.entries(CURRENCY_REGIONS).flatMap(([currency, regions]) =>
    regions.map((region) => [region, currency as CurrencyCode] as const),
  ),
);

/**
 * Suggests a currency from a BCP 47 locale such as `en-NG` (→ NGN). A locale
 * without a region (`en`) says nothing about where someone works, so it falls
 * back to the default rather than guessing.
 */
export function guessCurrency(locale: string | undefined): CurrencyCode {
  if (!locale) {
    return DEFAULT_CURRENCY;
  }
  try {
    const { region } = new Intl.Locale(locale);
    return (region && CURRENCY_BY_REGION.get(region.toUpperCase())) || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Every supported currency, labelled like "US Dollar (USD)". */
export const CURRENCY_OPTIONS: readonly SelectOption[] = CURRENCIES.map(({ code, name }) => ({
  value: code,
  label: `${name} (${code})`,
}));

/** The browser's IANA time zone, e.g. `Africa/Lagos`, if it reports one. */
export function detectTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** Current UTC offset of a time zone, e.g. `GMT+1`, or null when the browser cannot tell. */
function utcOffset(timeZone: string, at: Date): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' });
    const offset = parts.formatToParts(at).find((part) => part.type === 'timeZoneName')?.value;
    if (offset === undefined) return null;
    // ICU versions disagree on the zero offset ("GMT", "GMT+0", "UTC"); keep one style throughout.
    const gmt = offset.replace(/^UTC/, 'GMT');
    return /^GMT(?:[+-]0(?::00)?)?$/.test(gmt) ? 'GMT' : gmt;
  } catch {
    return null;
  }
}

export function timeZoneLabel(timeZone: string, at: Date): string {
  const name = timeZone.replaceAll('_', ' ');
  const offset = utcOffset(timeZone, at);
  return offset ? `${name} (${offset})` : name;
}

/**
 * Time zones to choose from: every zone the browser knows (where
 * `Intl.supportedValuesOf` exists), plus UTC and any `include`d zone, such as
 * the saved one, so the current value is always selectable. Sorted by name.
 */
export function listTimeZones(include: readonly (string | null | undefined)[] = []): string[] {
  const zones = new Set<string>(
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [],
  );
  zones.add(DEFAULT_TIMEZONE);
  for (const zone of include) {
    if (zone) {
      zones.add(zone);
    }
  }
  return [...zones].sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * Options for a time zone select, labelled with each zone's UTC offset at the
 * time of the call, e.g. "Africa/Lagos (GMT+1)".
 */
export function timeZoneOptions(
  include: readonly (string | null | undefined)[],
  at: Date = new Date(),
): SelectOption[] {
  return listTimeZones(include).map((zone) => ({ value: zone, label: timeZoneLabel(zone, at) }));
}
