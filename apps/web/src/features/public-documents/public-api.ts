import type {
  AcceptQuoteInput,
  PublicInvoiceDto,
  PublicQuoteDto,
  RejectQuoteInput,
} from '@quoteflow/shared';
import { request, resolveApiBaseUrl } from '@/lib/api-client';

/** Customer-facing endpoints: no account, the token in the link is the capability. */

const segment = (token: string) => encodeURIComponent(token);

/** `preview` is the business opening its own link, which the API does not count as a view. */
export function getPublicQuote(
  token: string,
  signal?: AbortSignal,
  preview = false,
): Promise<PublicQuoteDto> {
  return request(`/public/quotes/${segment(token)}`, {
    signal,
    query: preview ? { preview: 1 } : undefined,
  });
}

export function acceptPublicQuote(token: string, input: AcceptQuoteInput): Promise<PublicQuoteDto> {
  return request(`/public/quotes/${segment(token)}/accept`, { method: 'POST', body: input });
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
