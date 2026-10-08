import type { ApiPaginatedResponse, InvoiceListItemDto, QuoteListItemDto } from '@quoteflow/shared';
import { useQuery } from '@tanstack/react-query';
import { requestPaginated } from '@/lib/api-client';

/** How many recent quotes and invoices the customer page shows. */
export const CUSTOMER_DOCUMENTS_LIMIT = 10;

function listCustomerQuotes(
  customerId: string,
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<QuoteListItemDto>> {
  return requestPaginated('/quotes', {
    query: { customerId, pageSize: CUSTOMER_DOCUMENTS_LIMIT },
    signal,
  });
}

function listCustomerInvoices(
  customerId: string,
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<InvoiceListItemDto>> {
  return requestPaginated('/invoices', {
    query: { customerId, pageSize: CUSTOMER_DOCUMENTS_LIMIT },
    signal,
  });
}

// Under the quotes and invoices keys, so changes made there refresh these lists too.
export function useCustomerQuotesQuery(customerId: string) {
  return useQuery({
    queryKey: ['quotes', 'list', { customerId, pageSize: CUSTOMER_DOCUMENTS_LIMIT }],
    queryFn: ({ signal }) => listCustomerQuotes(customerId, signal),
  });
}

export function useCustomerInvoicesQuery(customerId: string) {
  return useQuery({
    queryKey: ['invoices', 'list', { customerId, pageSize: CUSTOMER_DOCUMENTS_LIMIT }],
    queryFn: ({ signal }) => listCustomerInvoices(customerId, signal),
  });
}
