import { type CurrencyCode, getCurrencyMinorUnits } from './constants/currencies';

/**
 * All monetary values are stored and calculated as integers in the currency's
 * minor unit (cents, kobo, fils…). These helpers are the only place where
 * conversion to and from human-entered decimal amounts happens.
 */
export function toMinorUnits(amount: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError('Amount must be a finite number');
  }
  const digits = getCurrencyMinorUnits(currency);
  // Shift the decimal point textually so values like 1.005 are not rounded
  // down by binary floating point error (1.005 * 100 === 100.49999…).
  const shifted = Number(`${Math.abs(amount).toFixed(10)}e${digits}`);
  return Math.sign(amount) * Math.round(shifted) || 0;
}

export function fromMinorUnits(minor: number, currency: CurrencyCode): number {
  return minor / 10 ** getCurrencyMinorUnits(currency);
}

export function formatMoney(minor: number, currency: CurrencyCode, locale?: string): string {
  const digits = getCurrencyMinorUnits(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // Local symbols businesses and their customers recognise (₦, GH₵, R) instead of codes.
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fromMinorUnits(minor, currency));
}
