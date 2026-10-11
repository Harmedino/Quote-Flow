import {
  type CurrencyCode,
  fromMinorUnits,
  getCurrencyMinorUnits,
  toMinorUnits,
} from '@quoteflow/shared';

/**
 * Parses what people type ("1,250.5", "1250", " 99.99 ") into minor units.
 * Returns undefined for text that is not an amount in this currency.
 */
export function parseMoneyInput(text: string, currency: CurrencyCode): number | null | undefined {
  const cleaned = text.replace(/[\s,]/g, '');
  if (cleaned === '') return null;
  const digits = getCurrencyMinorUnits(currency);
  const pattern = digits > 0 ? new RegExp(`^\\d+(\\.\\d{0,${digits}})?$`) : /^\d+$/;
  if (!pattern.test(cleaned)) return undefined;
  return toMinorUnits(Number(cleaned), currency);
}

/**
 * How an amount field shows its value. While editing it is plain ("12500000.00"); otherwise it
 * is grouped ("12,500,000.00") so a long amount reads at a glance. Both use the separators
 * parseMoneyInput accepts, whatever the browser's locale.
 */
export function formatMoneyInput(
  minor: number | null,
  currency: CurrencyCode,
  { grouped }: { grouped: boolean },
): string {
  if (minor === null) return '';
  const digits = getCurrencyMinorUnits(currency);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: grouped,
  }).format(fromMinorUnits(minor, currency));
}

/** The symbol people know the currency by (₦, GH₵, $), for the end of an amount field. */
export function currencySymbol(currency: CurrencyCode, locale?: string): string {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);
  return parts.find((part) => part.type === 'currency')?.value ?? currency;
}
