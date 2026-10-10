import { formatMoney } from '@/lib/format';

/** Formats kobo the way QuoteFlow shows money, e.g. "₦185,000.00". */
export function formatKobo(kobo: number): string {
  return formatMoney(kobo, 'NGN', 'en-NG');
}

/** For whole-naira amounts written into the website's illustrations: `naira(185000)`. */
export function naira(amount: number): string {
  return formatKobo(Math.round(amount * 100));
}
