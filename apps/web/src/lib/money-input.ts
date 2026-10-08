import { type CurrencyCode, getCurrencyMinorUnits, toMinorUnits } from '@quoteflow/shared';

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
