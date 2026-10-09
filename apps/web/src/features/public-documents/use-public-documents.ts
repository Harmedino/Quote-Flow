import type { PublicQuoteDto } from '@quoteflow/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@/lib/api-client';
import {
  acceptPublicQuote,
  getPublicInvoice,
  getPublicQuote,
  rejectPublicQuote,
} from './public-api';

export const publicQuoteKey = (token: string) => ['public', 'quote', token] as const;
export const publicInvoiceKey = (token: string) => ['public', 'invoice', token] as const;

export function usePublicQuote(token: string, preview = false) {
  return useQuery({
    queryKey: publicQuoteKey(token),
    queryFn: ({ signal }) => getPublicQuote(token, signal, preview),
  });
}

export function usePublicInvoice(token: string) {
  return useQuery({
    queryKey: publicInvoiceKey(token),
    queryFn: ({ signal }) => getPublicInvoice(token, signal),
  });
}

export type QuoteAnswer = { action: 'accept' } | { action: 'reject'; reason?: string };

/** An answer, and the revision the customer had on screen when they chose to give it. */
export interface QuoteAnswerVariables {
  answer: QuoteAnswer;
  revision: number;
}

/**
 * Accepts or declines the revision passed with the answer, never whatever the
 * cache holds by then. The answer's response replaces the cached quote
 * straight away; on a conflict (answered elsewhere, expired, or revised by the
 * business meanwhile) the quote is refetched so the page shows its real state.
 */
export function answerQuoteOptions(queryClient: QueryClient, token: string) {
  const queryKey = publicQuoteKey(token);
  return {
    mutationFn: ({ answer, revision }: QuoteAnswerVariables): Promise<PublicQuoteDto> =>
      answer.action === 'accept'
        ? acceptPublicQuote(token, { revision })
        : rejectPublicQuote(
            token,
            answer.reason ? { revision, reason: answer.reason } : { revision },
          ),
    onSuccess: (quote: PublicQuoteDto) => {
      queryClient.setQueryData(queryKey, quote);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      if (isApiError(error) && error.code === 'CONFLICT') {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  };
}

export function useAnswerQuote(token: string) {
  const queryClient = useQueryClient();
  return useMutation(answerQuoteOptions(queryClient, token));
}
