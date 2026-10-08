import { describe, expect, it } from 'vitest';
import { ApiError, type ClientErrorCode } from './api-error';
import { createQueryClient, shouldRetryQuery } from './query-client';

function apiError(status: number, code: ClientErrorCode): ApiError {
  return new ApiError({ status, code, message: 'failed' });
}

describe('shouldRetryQuery', () => {
  it('retries network errors and server errors', () => {
    expect(shouldRetryQuery(0, apiError(0, 'NETWORK_ERROR'))).toBe(true);
    expect(shouldRetryQuery(0, apiError(500, 'INTERNAL_ERROR'))).toBe(true);
    expect(shouldRetryQuery(1, apiError(503, 'SERVICE_UNAVAILABLE'))).toBe(true);
    expect(shouldRetryQuery(0, apiError(502, 'INVALID_RESPONSE'))).toBe(true);
  });

  it('retries at most twice', () => {
    expect(shouldRetryQuery(2, apiError(0, 'NETWORK_ERROR'))).toBe(false);
  });

  it('never retries client errors', () => {
    expect(shouldRetryQuery(0, apiError(400, 'VALIDATION_ERROR'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(401, 'UNAUTHORIZED'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(404, 'NOT_FOUND'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(429, 'RATE_LIMITED'))).toBe(false);
  });

  it('does not retry unexpected errors', () => {
    expect(shouldRetryQuery(0, new TypeError('x is undefined'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('uses the retry policy for queries and never retries mutations', () => {
    const defaults = createQueryClient().getDefaultOptions();
    expect(defaults.queries?.retry).toBe(shouldRetryQuery);
    expect(defaults.mutations?.retry).toBe(false);
  });
});
