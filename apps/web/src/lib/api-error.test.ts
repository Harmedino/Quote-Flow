import { describe, expect, it } from 'vitest';
import {
  ApiError,
  type ApiErrorInit,
  getErrorMessage,
  getFieldErrors,
  isApiError,
} from './api-error';

function apiError(init: Partial<ApiErrorInit> & Pick<ApiErrorInit, 'code'>): ApiError {
  return new ApiError({ status: 400, message: '', ...init });
}

describe('ApiError', () => {
  it('is an Error carrying the envelope fields', () => {
    const error = apiError({
      code: 'CONFLICT',
      status: 409,
      message: 'Duplicate',
      requestId: 'r1',
    });

    expect(error).toBeInstanceOf(Error);
    expect(isApiError(error)).toBe(true);
    expect(error.name).toBe('ApiError');
    expect(error.details).toEqual([]);
    expect(error.requestId).toBe('r1');
  });

  it('is not confused with other errors', () => {
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError({ code: 'NOT_FOUND' })).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('uses user-facing server messages for client errors', () => {
    expect(
      getErrorMessage(
        apiError({ code: 'UNAUTHORIZED', status: 401, message: 'Invalid email or password' }),
      ),
    ).toBe('Invalid email or password');
    expect(
      getErrorMessage(
        apiError({ code: 'CONFLICT', status: 409, message: 'Email is already registered' }),
      ),
    ).toBe('Email is already registered');
  });

  it('falls back to a friendly message when the server message is empty', () => {
    expect(getErrorMessage(apiError({ code: 'VALIDATION_ERROR', message: ' ' }))).toBe(
      'Some fields need your attention.',
    );
  });

  it('never exposes technical messages', () => {
    expect(
      getErrorMessage(
        apiError({ code: 'INTERNAL_ERROR', status: 500, message: 'MongoServerError: E11000' }),
      ),
    ).toBe('Something went wrong on our side. Please try again.');
    expect(
      getErrorMessage(
        apiError({ code: 'INVALID_JSON', message: 'Unexpected token } in JSON at position 4' }),
      ),
    ).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(new TypeError('Cannot read properties of undefined'))).toBe(
      'Something went wrong. Please try again.',
    );
    expect(getErrorMessage('boom')).toBe('Something went wrong. Please try again.');
  });

  it('has friendly defaults for transient failures', () => {
    expect(getErrorMessage(apiError({ code: 'RATE_LIMITED', status: 429 }))).toBe(
      'Too many attempts. Please wait a moment and try again.',
    );
    expect(getErrorMessage(apiError({ code: 'NETWORK_ERROR', status: 0 }))).toBe(
      'We couldn’t reach QuoteFlow. Check your internet connection and try again.',
    );
    expect(getErrorMessage(apiError({ code: 'SERVICE_UNAVAILABLE', status: 503 }))).toBe(
      'QuoteFlow is temporarily unavailable. Please try again shortly.',
    );
    expect(getErrorMessage(apiError({ code: 'INVALID_RESPONSE', status: 502 }))).toBe(
      'We received an unexpected response. Please try again.',
    );
  });
});

describe('getFieldErrors', () => {
  it('maps each field path to its first message', () => {
    const error = apiError({
      code: 'VALIDATION_ERROR',
      details: [
        { path: 'email', message: 'Enter a valid email address' },
        { path: 'items.0.quantity', message: 'Quantity must be greater than zero' },
        { path: 'email', message: 'Email is too long' },
      ],
    });

    expect(getFieldErrors(error)).toEqual({
      email: 'Enter a valid email address',
      'items.0.quantity': 'Quantity must be greater than zero',
    });
  });

  it('returns an empty object for errors without details', () => {
    expect(getFieldErrors(apiError({ code: 'NOT_FOUND', status: 404 }))).toEqual({});
    expect(getFieldErrors(new Error('boom'))).toEqual({});
    expect(getFieldErrors(undefined)).toEqual({});
  });
});
