import type {
  ApiPaginatedResponse,
  InvoiceDto,
  QuoteDto,
  QuoteInput,
  QuoteListItemDto,
  QuoteStatus,
} from '@quoteflow/shared';
import { request, requestPaginated } from '@/lib/api-client';

/** GET /api/quotes parameters (the shared QuoteListQuery, with numbers already parsed). */
export interface QuoteListParamsQuery {
  page?: number;
  pageSize?: number;
  status?: QuoteStatus;
  customerId?: string;
  search?: string;
}

const quotePath = (id: string, action = '') => `/quotes/${encodeURIComponent(id)}${action}`;

/** Newest first. A `status` filter matches the effective status (e.g. lapsed quotes are 'expired'). */
export function listQuotes(
  query: QuoteListParamsQuery = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<QuoteListItemDto>> {
  return requestPaginated('/quotes', { query: { ...query }, signal });
}

export function getQuote(id: string, signal?: AbortSignal): Promise<QuoteDto> {
  return request(quotePath(id), { signal });
}

/** Creates a draft. Omitted tax rate, notes, terms and dates use the business defaults. */
export function createQuote(input: QuoteInput): Promise<QuoteDto> {
  return request('/quotes', { method: 'POST', body: input });
}

export function updateQuote(id: string, input: QuoteInput): Promise<QuoteDto> {
  return request(quotePath(id), { method: 'PUT', body: input });
}

export async function deleteQuote(id: string): Promise<void> {
  await request<undefined>(quotePath(id), { method: 'DELETE' });
}

/** Marks a draft as sent; a quote that is already out is returned unchanged. */
export function sendQuote(id: string): Promise<QuoteDto> {
  return request(quotePath(id, '/send'), { method: 'POST' });
}

export function duplicateQuote(id: string): Promise<QuoteDto> {
  return request(quotePath(id, '/duplicate'), { method: 'POST' });
}

/** Accepted quotes only, once. */
export function convertQuote(id: string): Promise<InvoiceDto> {
  return request(quotePath(id, '/convert'), { method: 'POST' });
}
