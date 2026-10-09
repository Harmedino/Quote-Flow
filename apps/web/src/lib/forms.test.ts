import {
  changePasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  updateBusinessInputSchema,
} from '@quoteflow/shared';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, type ApiErrorInit } from './api-error';
import {
  focusFirstInvalidField,
  getSubmitErrors,
  issuesToFieldErrors,
  validateForm,
} from './forms';

function apiError(init: Partial<ApiErrorInit> & Pick<ApiErrorInit, 'code' | 'status'>): ApiError {
  return new ApiError({ message: 'Request failed', ...init });
}

describe('validateForm', () => {
  it('returns the parsed, normalised data from a shared schema', () => {
    const result = validateForm(loginInputSchema, {
      email: ' Amina@Sparkle.Example ',
      password: 'x',
    });

    expect(result).toEqual({
      success: true,
      data: { email: 'amina@sparkle.example', password: 'x' },
    });
  });

  it('returns the first message for each field path', () => {
    const result = validateForm(registerInputSchema, {
      name: ' ',
      businessName: 'Sparkle',
      email: 'not an email',
      password: 'short',
    });

    expect(result).toEqual({
      success: false,
      fieldErrors: {
        name: 'Name is required',
        email: 'Enter a valid email address',
        password: 'Password must be at least 8 characters',
      },
    });
  });

  it('keys nested and refinement errors by their dotted path', () => {
    const nested = validateForm(updateBusinessInputSchema, {
      address: { city: 'x'.repeat(101) },
    });
    const refined = validateForm(changePasswordInputSchema, {
      currentPassword: 'same password',
      newPassword: 'same password',
    });

    expect(nested).toEqual({
      success: false,
      fieldErrors: { 'address.city': 'Must be at most 100 characters' },
    });
    expect(refined).toEqual({
      success: false,
      fieldErrors: { newPassword: 'Choose a password that is different from your current one' },
    });
  });
});

describe('issuesToFieldErrors', () => {
  it('joins array indexes and keeps the first message per path', () => {
    expect(
      issuesToFieldErrors([
        { path: ['items', 0, 'quantity'], message: 'Quantity must be greater than zero' },
        { path: ['items', 0, 'quantity'], message: 'Quantity is too large' },
        { path: [], message: 'Something is wrong with the form' },
      ]),
    ).toEqual({
      'items.0.quantity': 'Quantity must be greater than zero',
      '': 'Something is wrong with the form',
    });
  });
});

describe('getSubmitErrors', () => {
  const fields = ['name', 'email', 'password'];

  it('puts a CONFLICT detail on its field without a form-level message', () => {
    const error = apiError({
      status: 409,
      code: 'CONFLICT',
      message: 'An account with this email already exists',
      details: [{ path: 'email', message: 'An account with this email already exists' }],
    });

    expect(getSubmitErrors(error, fields)).toEqual({
      fieldErrors: { email: 'An account with this email already exists' },
      formError: null,
    });
  });

  it('puts VALIDATION_ERROR details on their fields', () => {
    const error = apiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [
        { path: 'name', message: 'Name is too long' },
        { path: 'password', message: 'Password is too long' },
      ],
    });

    expect(getSubmitErrors(error, fields)).toEqual({
      fieldErrors: { name: 'Name is too long', password: 'Password is too long' },
      formError: null,
    });
  });

  it('adds a form-level message when a detail matches no field', () => {
    const error = apiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Some fields are invalid',
      details: [
        { path: 'email', message: 'Enter a valid email address' },
        { path: 'timezone', message: 'Enter a valid IANA time zone' },
      ],
    });

    expect(getSubmitErrors(error, fields)).toEqual({
      fieldErrors: { email: 'Enter a valid email address' },
      formError: 'Some fields are invalid',
    });
  });

  it.each([
    [
      'wrong credentials',
      apiError({ status: 401, code: 'UNAUTHORIZED', message: 'Incorrect email or password.' }),
      'Incorrect email or password.',
    ],
    [
      'rate limiting',
      apiError({ status: 429, code: 'RATE_LIMITED', message: 'Slow down' }),
      'Too many attempts. Please wait a moment and try again.',
    ],
    [
      'a network failure',
      apiError({ status: 0, code: 'NETWORK_ERROR' }),
      'We couldn’t reach QuoteFlow. Check your internet connection and try again.',
    ],
    [
      'an unexpected error',
      new TypeError('x is undefined'),
      'Something went wrong. Please try again.',
    ],
  ])('turns %s into a form-level message', (_case, error, message) => {
    expect(getSubmitErrors(error, fields)).toEqual({ fieldErrors: {}, formError: message });
  });

  it('ignores field details on errors that are not about fields', () => {
    const error = apiError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Only the owner can change business settings',
      details: [{ path: 'name', message: 'irrelevant' }],
    });

    expect(getSubmitErrors(error, fields)).toEqual({
      fieldErrors: {},
      formError: 'Only the owner can change business settings',
    });
  });
});

describe('focusFirstInvalidField', () => {
  it('focuses the first control marked invalid', () => {
    const focus = vi.fn();
    const querySelector = vi.fn(() => ({ focus }));
    const form = { querySelector } as unknown as ParentNode;

    expect(focusFirstInvalidField(form)).toBe(true);
    expect(querySelector).toHaveBeenCalledWith('[aria-invalid="true"]');
    expect(focus).toHaveBeenCalledOnce();
  });

  it('does nothing without an invalid control or a container', () => {
    const form = { querySelector: () => null } as unknown as ParentNode;

    expect(focusFirstInvalidField(form)).toBe(false);
    expect(focusFirstInvalidField(null)).toBe(false);
  });
});
