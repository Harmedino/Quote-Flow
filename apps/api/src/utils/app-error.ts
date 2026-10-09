import type { ApiErrorCode, ApiFieldError } from '@quoteflow/shared';

const HTTP_STATUS_BY_ERROR_CODE: Readonly<Record<ApiErrorCode, number>> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  INVALID_JSON: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export interface AppErrorOptions {
  details?: ApiFieldError[];
  cause?: unknown;
}

/**
 * An error whose code and message are safe to show to API clients. Anything
 * else that reaches the error handler is reported as a generic 500.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiFieldError[];

  constructor(code: ApiErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.status = HTTP_STATUS_BY_ERROR_CODE[code];
    this.details = options.details;
  }
}

export const badRequest = (message = 'The request could not be processed.') =>
  new AppError('BAD_REQUEST', message);

export const validationFailed = (
  details: ApiFieldError[],
  message = 'Some of the submitted information is invalid.',
) => new AppError('VALIDATION_ERROR', message, { details });

export const unauthorized = (message = 'Authentication is required.') =>
  new AppError('UNAUTHORIZED', message);

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

/** An access or refresh token that is invalid, expired or revoked, or whose account is gone. */
export const sessionExpired = () => unauthorized(SESSION_EXPIRED_MESSAGE);

export const forbidden = (message = 'You do not have permission to perform this action.') =>
  new AppError('FORBIDDEN', message);

export const notFound = (message = 'The requested resource was not found.') =>
  new AppError('NOT_FOUND', message);

export const conflict = (
  message = 'The request conflicts with the current state of the resource.',
) => new AppError('CONFLICT', message);

export const serviceUnavailable = (
  message = 'The service is temporarily unavailable. Please try again shortly.',
) => new AppError('SERVICE_UNAVAILABLE', message);
