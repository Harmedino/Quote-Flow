import {
  API_ERROR_CODES,
  type ApiErrorBody,
  type ApiFieldError,
  type ApiPaginatedResponse,
  type PaginationMeta,
} from '@quoteflow/shared';
import { ApiError } from './api-error';

export {
  ApiError,
  getErrorMessage,
  getFieldErrors,
  isApiError,
  type ClientErrorCode,
} from './api-error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialized as JSON. */
  body?: unknown;
  /** Appended to the URL; `null` and `undefined` values are skipped. */
  query?: QueryParams;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

const DEFAULT_API_BASE_URL = '/api';

export function resolveApiBaseUrl(configured: string | undefined): string {
  const trimmed = configured?.trim().replace(/\/+$/, '');
  return trimmed || DEFAULT_API_BASE_URL;
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export function buildQueryString(query: QueryParams | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    const values: readonly (QueryPrimitive | null | undefined)[] = Array.isArray(value)
      ? value
      : [value as QueryPrimitive | null | undefined];
    for (const item of values) {
      if (item !== null && item !== undefined) {
        params.append(key, String(item));
      }
    }
  }
  return params.toString();
}

function buildUrl(path: string, query: QueryParams | undefined): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const queryString = buildQueryString(query);
  if (!queryString) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  const separator = normalizedPath.includes('?') ? '&' : '?';
  return `${API_BASE_URL}${normalizedPath}${separator}${queryString}`;
}

/** The single place where request headers are assembled. */
function buildHeaders({ body, headers }: RequestOptions): Headers {
  const result = new Headers(headers);
  if (!result.has('Accept')) {
    result.set('Accept', 'application/json');
  }
  if (body !== undefined && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json');
  }
  return result;
}

/** Aborts pass through untouched; any other transport failure becomes NETWORK_ERROR. */
function toTransportError(error: unknown, signal: AbortSignal | undefined): unknown {
  if (signal?.aborted) {
    return error;
  }
  return new ApiError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    cause: error,
  });
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: buildHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    throw toTransportError(error, options.signal);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const knownErrorCodes: ReadonlySet<string> = new Set(API_ERROR_CODES);

function isFieldError(value: unknown): value is ApiFieldError {
  return isRecord(value) && typeof value.path === 'string' && typeof value.message === 'string';
}

function parseErrorBody(payload: unknown): ApiErrorBody | null {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }
  const { code, message, details, requestId } = payload.error;
  if (typeof code !== 'string' || !knownErrorCodes.has(code) || typeof message !== 'string') {
    return null;
  }
  return {
    code: code as ApiErrorBody['code'],
    message,
    details: Array.isArray(details) ? details.filter(isFieldError) : undefined,
    requestId: typeof requestId === 'string' ? requestId : undefined,
  };
}

type ParsedBody = { ok: true; value: unknown } | { ok: false };

async function readBody(response: Response, signal: AbortSignal | undefined): Promise<ParsedBody> {
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw toTransportError(error, signal);
  }
  if (!text) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function invalidResponse(response: Response): ApiError {
  return new ApiError({
    status: response.status,
    code: 'INVALID_RESPONSE',
    message: `Unexpected response from the server (HTTP ${response.status})`,
  });
}

/**
 * Validates the response envelope. Returns `null` for 204 No Content, the
 * success envelope otherwise, and throws an {@link ApiError} for failures.
 */
async function readEnvelope(
  response: Response,
  signal: AbortSignal | undefined,
): Promise<Record<string, unknown> | null> {
  if (response.status === 204) {
    return null;
  }
  const payload = await readBody(response, signal);

  if (!response.ok) {
    const body = payload.ok ? parseErrorBody(payload.value) : null;
    if (!body) {
      throw invalidResponse(response);
    }
    throw new ApiError({ status: response.status, ...body });
  }

  if (!payload.ok || !isRecord(payload.value) || !('data' in payload.value)) {
    throw invalidResponse(response);
  }
  return payload.value;
}

function isPaginationMeta(value: unknown): value is PaginationMeta {
  return (
    isRecord(value) &&
    typeof value.page === 'number' &&
    typeof value.pageSize === 'number' &&
    typeof value.total === 'number' &&
    typeof value.totalPages === 'number'
  );
}

/**
 * Calls the QuoteFlow API and returns the unwrapped `data` of the response
 * envelope (`undefined` for 204 No Content). Every failure is thrown as an
 * {@link ApiError}, except aborts, which are rethrown untouched so callers can
 * tell cancellation apart from errors.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  const envelope = await readEnvelope(response, options.signal);
  return envelope?.data as T;
}

/** Like {@link request}, for list endpoints that return `{ data: T[], meta }`. */
export async function requestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiPaginatedResponse<T>> {
  const response = await send(path, options);
  const envelope = await readEnvelope(response, options.signal);
  if (!envelope || !Array.isArray(envelope.data) || !isPaginationMeta(envelope.meta)) {
    throw invalidResponse(response);
  }
  return { data: envelope.data as T[], meta: envelope.meta };
}
