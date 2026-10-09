import type { AddressInput, DiscountDto } from '@quoteflow/shared';

/** Display helpers for quotes and invoices; pure so they can be unit-tested. */

/** Quantities keep up to three decimals (QUANTITY_DECIMALS) and drop trailing zeros. */
export function formatQuantity(quantity: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(quantity);
}

/** A tax or discount rate, e.g. 7.5 → '7.5%'. */
export function formatPercent(rate: number, locale?: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(rate)}%`;
}

/** Postal address as display lines, skipping empty parts: street, street 2, city/state/postcode, country. */
export function formatAddressLines(address: AddressInput | null | undefined): string[] {
  if (!address) return [];
  const locality = [address.city, address.state].filter(Boolean).join(', ');
  const cityLine = [locality, address.postalCode].filter(Boolean).join(' ');
  return [address.line1, address.line2, cityLine, address.country].filter((line): line is string =>
    Boolean(line?.trim()),
  );
}

export function discountLabel(discount: DiscountDto, locale?: string): string {
  return discount?.type === 'percentage'
    ? `Discount (${formatPercent(discount.value, locale)})`
    : 'Discount';
}

/** Up to two initials for a logo placeholder, e.g. 'Sparkle Cleaning Co.' → 'SC'. */
export function businessInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  return (initials || name.trim()[0] || '?').toUpperCase();
}

/** A website without its protocol and trailing slash, e.g. 'https://sparkle.example/' → 'sparkle.example'. */
export function websiteLabel(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/** Only http(s) URLs are rendered as links, so stored data can never inject a javascript: URL. */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}
