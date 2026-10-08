import type { PublicInvoiceDto, PublicQuoteDto, RejectQuoteInput } from '@quoteflow/shared';
import { request, resolveApiBaseUrl } from '@/lib/api-client';

/** Customer-facing endpoints: no account, the token in the link is the capability. */

const segment = (token: string) => encodeURIComponent(token);

export function getPublicQuote(token: string, signal?: AbortSignal): Promise<PublicQuoteDto> {
  return request(`/public/quotes/${segment(token)}`, { signal });
}

export function acceptPublicQuote(token: string): Promise<PublicQuoteDto> {
  return request(`/public/quotes/${segment(token)}/accept`, { method: 'POST' });
}

export function rejectPublicQuote(token: string, input: RejectQuoteInput): Promise<PublicQuoteDto> {
  return request(`/public/quotes/${segment(token)}/reject`, { method: 'POST', body: input });
}

export function getPublicInvoice(token: string, signal?: AbortSignal): Promise<PublicInvoiceDto> {
  return request(`/public/invoices/${segment(token)}`, { signal });
}

/** A plain link (not a fetch), so phones hand the PDF to their own viewer. */
export function buildPublicPdfUrl(
  apiBaseUrl: string,
  kind: 'quote' | 'invoice',
  token: string,
): string {
  return `${apiBaseUrl}/public/${kind === 'quote' ? 'quotes' : 'invoices'}/${segment(token)}/pdf`;
}

export function publicPdfUrl(kind: 'quote' | 'invoice', token: string): string {
  return buildPublicPdfUrl(resolveApiBaseUrl(import.meta.env.VITE_API_URL), kind, token);
}
