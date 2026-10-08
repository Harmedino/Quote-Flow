import type {
  ApiPaginatedResponse,
  InvoiceDto,
  InvoiceInput,
  InvoiceListItemDto,
  InvoiceStatus,
  RecordPaymentInput,
} from '@quoteflow/shared';
import { request, requestPaginated } from '@/lib/api-client';

export interface InvoiceListOptions {
  page?: number;
  pageSize?: number;
  status?: InvoiceStatus;
  customerId?: string;
  search?: string;
}

const invoicePath = (id: string) => `/invoices/${encodeURIComponent(id)}`;

/** Newest first. `status` filters by effective status, so 'overdue' includes past-due sent invoices. */
export function listInvoices(
  query: InvoiceListOptions = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<InvoiceListItemDto>> {
  return requestPaginated('/invoices', { query: { ...query }, signal });
}

export function getInvoice(id: string, signal?: AbortSignal): Promise<InvoiceDto> {
  return request(invoicePath(id), { signal });
}

/** A standalone draft; omitted tax rate, notes, terms and dates take the business defaults. */
export function createInvoice(input: InvoiceInput): Promise<InvoiceDto> {
  return request('/invoices', { method: 'POST', body: input });
}

/** Drafts only. */
export function updateInvoice(id: string, input: InvoiceInput): Promise<InvoiceDto> {
  return request(invoicePath(id), { method: 'PUT', body: input });
}

/** Drafts only. */
export function deleteInvoice(id: string): Promise<void> {
  return request(invoicePath(id), { method: 'DELETE' });
}

/** Marks a draft as sent; a no-op for invoices that are already out. */
export function sendInvoice(id: string): Promise<InvoiceDto> {
  return request(`${invoicePath(id)}/send`, { method: 'POST' });
}

export function recordPayment(id: string, input: RecordPaymentInput): Promise<InvoiceDto> {
  return request(`${invoicePath(id)}/payments`, { method: 'POST', body: input });
}

export function deletePayment(id: string, paymentId: string): Promise<InvoiceDto> {
  return request(`${invoicePath(id)}/payments/${encodeURIComponent(paymentId)}`, {
    method: 'DELETE',
  });
}

export function cancelInvoice(id: string): Promise<InvoiceDto> {
  return request(`${invoicePath(id)}/cancel`, { method: 'POST' });
}

/** Creates a draft invoice from an accepted quote (once per quote). */
export function convertQuote(quoteId: string): Promise<InvoiceDto> {
  return request(`/quotes/${encodeURIComponent(quoteId)}/convert`, { method: 'POST' });
}
