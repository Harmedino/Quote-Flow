import type { ApiErrorCode, ApiFieldError } from '@quoteflow/shared';

/** Server error codes plus the failures that can only be detected in the browser. */
export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'INVALID_RESPONSE';

export interface ApiErrorInit {
  /** HTTP status, or 0 when no response was received. */
  status: number;
  code: ClientErrorCode;
  message: string;
  details?: readonly ApiFieldError[];
  requestId?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly status: number;
  readonly code: ClientErrorCode;
  readonly details: readonly ApiFieldError[];
  readonly requestId: string | undefined;

  constructor({ status, code, message, details = [], requestId, cause }: ApiErrorInit) {
    super(message, { cause });
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const FRIENDLY_MESSAGES: Record<ClientErrorCode, string> = {
  BAD_REQUEST: 'We couldn’t process that request. Please check your input and try again.',
  VALIDATION_ERROR: 'Some fields need your attention.',
  INVALID_JSON: DEFAULT_ERROR_MESSAGE,
  UNAUTHORIZED: 'Your session has ended. Please sign in again.',
  FORBIDDEN: 'You don’t have permission to do that.',
  NOT_FOUND: 'We couldn’t find what you were looking for.',
  CONFLICT: 'This conflicts with existing data. Please refresh and try again.',
  PAYLOAD_TOO_LARGE: 'That request is too large. Please reduce its size and try again.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  SERVICE_UNAVAILABLE: 'QuoteFlow is temporarily unavailable. Please try again shortly.',
  INTERNAL_ERROR: 'Something went wrong on our side. Please try again.',
  NETWORK_ERROR: 'We couldn’t reach QuoteFlow. Check your internet connection and try again.',
  INVALID_RESPONSE: 'We received an unexpected response. Please try again.',
};

/**
 * Codes whose server message is written for end users (e.g. "Email is already
 * registered"). Everything else gets a friendly client-side message so
 * technical details never reach the screen.
 */
const USER_FACING_SERVER_CODES: ReadonlySet<ClientErrorCode> = new Set<ClientErrorCode>([
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
]);

export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return DEFAULT_ERROR_MESSAGE;
  }
  const serverMessage = error.message.trim();
  if (USER_FACING_SERVER_CODES.has(error.code) && serverMessage) {
    return serverMessage;
  }
  return FRIENDLY_MESSAGES[error.code];
}

/**
 * Whether loading one record by the id in the URL failed because there is no
 * such record in this business. A malformed id is rejected as a validation
 * error before the lookup, and means the same to the person following the link.
 */
export function isMissingRecordError(error: unknown): boolean {
  return isApiError(error) && (error.code === 'NOT_FOUND' || error.code === 'VALIDATION_ERROR');
}

/** Maps field paths (e.g. `items.0.quantity`) to their first error message. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!isApiError(error)) {
    return fieldErrors;
  }
  for (const { path, message } of error.details) {
    fieldErrors[path] ??= message;
  }
  return fieldErrors;
}
