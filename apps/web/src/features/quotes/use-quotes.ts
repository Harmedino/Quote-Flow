import type { QuoteDto } from '@quoteflow/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  convertQuote,
  createQuote,
  deleteQuote,
  duplicateQuote,
  getQuote,
  listQuotes,
  type QuoteListParamsQuery,
  sendQuote,
  updateQuote,
} from './quotes-api';

export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (query: QuoteListParamsQuery) => [...quoteKeys.lists(), query] as const,
  detail: (id: string) => [...quoteKeys.all, 'detail', id] as const,
};

/** A page of quotes. The previous page stays on screen while the next one loads. */
export function useQuotesQuery(query: QuoteListParamsQuery) {
  return useQuery({
    queryKey: quoteKeys.list(query),
    queryFn: ({ signal }) => listQuotes(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useQuoteQuery(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: ({ signal }) => getQuote(id, signal),
  });
}

/** Caches the saved quote and refreshes lists (including the dashboard's). */
function useQuoteSaved() {
  const queryClient = useQueryClient();
  return (quote: QuoteDto) => {
    queryClient.setQueryData(quoteKeys.detail(quote.id), quote);
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    return queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
  };
}

export function useCreateQuote() {
  const onSaved = useQuoteSaved();
  return useMutation({ mutationFn: createQuote, onSuccess: onSaved });
}

export function useUpdateQuote() {
  const onSaved = useQuoteSaved();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateQuote>[1] }) =>
      updateQuote(id, input),
    onSuccess: onSaved,
  });
}

export function useSendQuote() {
  const onSaved = useQuoteSaved();
  return useMutation({ mutationFn: sendQuote, onSuccess: onSaved });
}

export function useDuplicateQuote() {
  const onSaved = useQuoteSaved();
  return useMutation({ mutationFn: duplicateQuote, onSuccess: onSaved });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: quoteKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      return queryClient.invalidateQueries({ queryKey: quoteKeys.lists() });
    },
  });
}

/** Converts an accepted quote into an invoice; the quote then links to it. */
export function useConvertQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: convertQuote,
    onSuccess: () =>
      Promise.all(
        [quoteKeys.all, ['invoices'], ['dashboard']].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}
