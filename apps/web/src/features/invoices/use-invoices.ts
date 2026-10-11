import type { InvoiceDto, InvoiceInput, RecordPaymentInput } from '@quoteflow/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type InvoiceListOptions,
  cancelInvoice,
  convertQuote,
  createInvoice,
  deleteInvoice,
  deletePayment,
  getInvoice,
  listInvoices,
  recordPayment,
  sendInvoice,
  updateInvoice,
} from './invoices-api';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (query: InvoiceListOptions) => [...invoiceKeys.lists(), query] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
};

/** A page of invoices. The previous page stays on screen while the next one loads. */
export function useInvoicesQuery(query: InvoiceListOptions) {
  return useQuery({
    queryKey: invoiceKeys.list(query),
    queryFn: ({ signal }) => listInvoices(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useInvoiceQuery(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: ({ signal }) => getInvoice(id, signal),
  });
}

/**
 * Caches the changed invoice and refreshes what depends on it: invoice lists,
 * the dashboard and (for conversions) quotes.
 */
function useInvoiceChanged() {
  const queryClient = useQueryClient();
  return (invoice: InvoiceDto) => {
    queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      invoice.quoteId ? queryClient.invalidateQueries({ queryKey: ['quotes'] }) : undefined,
    ]);
  };
}

export function useCreateInvoice() {
  const onChanged = useInvoiceChanged();
  return useMutation({ mutationFn: createInvoice, onSuccess: onChanged });
}

export function useUpdateInvoice(id: string) {
  const onChanged = useInvoiceChanged();
  return useMutation({
    mutationFn: (input: InvoiceInput) => updateInvoice(id, input),
    onSuccess: onChanged,
  });
}

export function useSendInvoice(id: string) {
  const onChanged = useInvoiceChanged();
  return useMutation({ mutationFn: () => sendInvoice(id), onSuccess: onChanged });
}

export function useRecordPayment(id: string) {
  const onChanged = useInvoiceChanged();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => recordPayment(id, input),
    onSuccess: onChanged,
  });
}

export function useDeletePayment(id: string) {
  const onChanged = useInvoiceChanged();
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(id, paymentId),
    onSuccess: onChanged,
  });
}

export function useCancelInvoice(id: string) {
  const onChanged = useInvoiceChanged();
  return useMutation({ mutationFn: () => cancelInvoice(id), onSuccess: onChanged });
}

export function useConvertQuote() {
  const onChanged = useInvoiceChanged();
  return useMutation({ mutationFn: convertQuote, onSuccess: onChanged });
}

export function useDeleteInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteInvoice(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        // A deleted draft frees the quote it was converted from.
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
      ]);
    },
  });
}
