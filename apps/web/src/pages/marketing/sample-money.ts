import { formatMoney } from '@/lib/format';

/** Formats kobo the way QuoteFlow shows money, e.g. "₦185,000.00". */
export function formatKobo(kobo: number): string {
  return formatMoney(kobo, 'NGN', 'en-NG');
}

/** For whole-naira amounts written into the website's illustrations: `naira(185000)`. */
export function naira(amount: number): string {
  return formatKobo(Math.round(amount * 100));
}

const WHOLE_NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

/** Without the kobo, as on a price list or a quick sum: `wholeNaira(6000)` is "₦6,000". */
export function wholeNaira(amount: number): string {
  return WHOLE_NAIRA.format(amount);
}
