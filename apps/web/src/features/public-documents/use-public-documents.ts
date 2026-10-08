import type { PublicQuoteDto } from '@quoteflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api-client';
import {
  acceptPublicQuote,
  getPublicInvoice,
  getPublicQuote,
  rejectPublicQuote,
} from './public-api';

export const publicQuoteKey = (token: string) => ['public', 'quote', token] as const;
export const publicInvoiceKey = (token: string) => ['public', 'invoice', token] as const;

export function usePublicQuote(token: string) {
  return useQuery({
    queryKey: publicQuoteKey(token),
    queryFn: ({ signal }) => getPublicQuote(token, signal),
  });
}

export function usePublicInvoice(token: string) {
  return useQuery({
    queryKey: publicInvoiceKey(token),
    queryFn: ({ signal }) => getPublicInvoice(token, signal),
  });
}

export type QuoteAnswer = { action: 'accept' } | { action: 'reject'; reason?: string };

/**
 * Accepts or declines a quote. The answer's response replaces the cached quote
 * straight away; on a conflict (answered elsewhere, or expired meanwhile) the
 * quote is refetched so the page shows its real state.
 */
export function useAnswerQuote(token: string) {
  const queryClient = useQueryClient();
  const queryKey = publicQuoteKey(token);
  return useMutation({
    mutationFn: (answer: QuoteAnswer): Promise<PublicQuoteDto> =>
      answer.action === 'accept'
        ? acceptPublicQuote(token)
        : rejectPublicQuote(token, answer.reason ? { reason: answer.reason } : {}),
    onSuccess: (quote) => {
      queryClient.setQueryData(queryKey, quote);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      if (isApiError(error) && error.code === 'CONFLICT') {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
