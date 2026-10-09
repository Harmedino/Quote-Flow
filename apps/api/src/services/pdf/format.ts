import {
  type AddressInput,
  type CurrencyCode,
  type DiscountDto,
  QUANTITY_DECIMALS,
  formatMoney,
} from '@quoteflow/shared';

/** Same formatting as the web app, so a PDF never shows a different figure than the screen. */
export function formatPdfMoney(minor: number, currency: CurrencyCode): string {
  return formatMoney(minor, currency, 'en-US');
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 'YYYY-MM-DD' → "Oct 8, 2026" (month spelled out, so never ambiguous). */
export function formatPdfDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

const quantityFormat = new Intl.NumberFormat('en', { maximumFractionDigits: QUANTITY_DECIMALS });

export function formatQuantity(quantity: number, unit: string | null): string {
  const value = quantityFormat.format(quantity);
  return unit ? `${value} ${unit}` : value;
}

const percentFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

export function formatPercent(value: number): string {
  return `${percentFormat.format(value)}%`;
}

export function discountLabel(discount: DiscountDto): string {
  return discount?.type === 'percentage'
    ? `Discount (${formatPercent(discount.value)})`
    : 'Discount';
}

/** Postal address lines, skipping empty parts. */
export function addressLines(address: AddressInput | null | undefined): string[] {
  if (!address) return [];
  const locality = [address.city, [address.state, address.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [address.line1, address.line2, locality, address.country].filter((line): line is string =>
    Boolean(line?.trim()),
  );
}

/** A safe attachment name: the document number with anything unusual replaced. */
export function pdfFileName(documentNumber: string): string {
  const safe = documentNumber
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${safe || 'document'}.pdf`;
}

/**
 * 40 characters without a space, then more. A base character and its combining
 * marks count as one, so a mark is never split off.
 */
const LONG_RUN = /(?:[^\s\p{M}]\p{M}*){40}(?=[^\s\p{M}])/gu;

/**
 * Adds an invisible break opportunity (U+200B, which Inter draws as nothing)
 * every 40 characters of an unbroken run. pdfkit wraps a word wider than the
 * line by re-measuring the rest of it for every line, so a few thousand
 * characters without a space take seconds and block the server meanwhile.
 */
export function breakLongRuns(value: string): string {
  return value.replace(LONG_RUN, '$&\u200B');
}
