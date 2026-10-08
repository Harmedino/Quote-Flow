import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './api-error';

const MAX_QUERY_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 30_000;

/** Retries transient failures (network errors and 5xx) only; 4xx responses never change on retry. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES || !isApiError(error)) {
    return false;
  }
  return error.code === 'NETWORK_ERROR' || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
