import {
  API_ERROR_CODES,
  type ApiErrorBody,
  type ApiErrorCode,
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
  isMissingRecordError,
  type ClientErrorCode,
} from './api-error';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

export interface RequestOptions {
  method?: HttpMethod;
  /**
   * Serialized as JSON, except FormData, Blob, URLSearchParams and binary
   * bodies, which are sent as-is with the Content-Type fetch derives for them.
   */
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

/**
 * Connects the client to the session layer without depending on it: the
 * handler supplies the Bearer token and renews the session after a 401.
 */
export interface AuthHandler {
  getAccessToken(): string | null;
  /**
   * Called at most once per request, after a 401. `rejectedToken` is the token
   * that was refused. Resolves true when a newer token is available and the
   * request should be retried with it, false when the session has ended.
   */
  renewSession(rejectedToken: string | null): Promise<boolean>;
}

let authHandler: AuthHandler | null = null;

export function setAuthHandler(handler: AuthHandler | null): void {
  authHandler = handler;
}

/** Session endpoints settle authentication themselves, so their 401s are final. */
export function isAuthPath(path: string): boolean {
  return /^\/?auth(?:[/?#]|$)/.test(path);
}

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

/** Bodies fetch sends natively; a multipart FormData body needs fetch to set its boundary. */
function isRawBody(body: unknown): body is BodyInit {
  return (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

function serializeBody(body: unknown): BodyInit | undefined {
  return body === undefined || isRawBody(body) ? body : JSON.stringify(body);
}

/** The single place where request headers are assembled. */
function buildHeaders({ body, headers }: RequestOptions, accessToken: string | null): Headers {
  const result = new Headers(headers);
  if (!result.has('Accept')) {
    result.set('Accept', 'application/json');
  }
  if (body !== undefined && !isRawBody(body) && !result.has('Content-Type')) {
    result.set('Content-Type', 'application/json');
  }
  if (accessToken && !result.has('Authorization')) {
    result.set('Authorization', `Bearer ${accessToken}`);
  }
  return result;
}

function isTimeout(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === 'TimeoutError';
}

/**
 * A caller's abort passes through untouched; a timeout (`AbortSignal.timeout`)
 * or any other transport failure becomes NETWORK_ERROR.
 */
function toTransportError(error: unknown, signal: AbortSignal | undefined): unknown {
  if (signal?.aborted && !isTimeout(signal.reason)) {
    return error;
  }
  return new ApiError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: signal?.aborted ? 'Network request timed out' : 'Network request failed',
    cause: error,
  });
}

async function sendOnce(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: buildHeaders(options, accessToken),
      body: serializeBody(options.body),
      credentials: 'include',
      signal: options.signal,
    });
  } catch (error) {
    throw toTransportError(error, options.signal);
  }
}

/** Sends the request with the current access token, renewing the session and retrying once on 401. */
async function send(path: string, options: RequestOptions): Promise<Response> {
  const handler = authHandler;
  const accessToken = handler?.getAccessToken() ?? null;
  const response = await sendOnce(path, options, accessToken);
  if (response.status !== 401 || !handler || isAuthPath(path)) {
    return response;
  }
  if (!(await handler.renewSession(accessToken))) {
    return response;
  }
  return sendOnce(path, options, handler.getAccessToken());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const knownErrorCodes: ReadonlySet<string> = new Set(API_ERROR_CODES);

function isFieldError(value: unknown): value is ApiFieldError {
  return isRecord(value) && typeof value.path === 'string' && typeof value.message === 'string';
}

/** Fallbacks for server codes this client does not know, e.g. ones added by a newer API. */
const STATUS_ERROR_CODES: Readonly<Partial<Record<number, ApiErrorCode>>> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
  503: 'SERVICE_UNAVAILABLE',
};

function toKnownErrorCode(code: string, status: number): ApiErrorCode {
  if (knownErrorCodes.has(code)) {
    return code as ApiErrorCode;
  }
  return STATUS_ERROR_CODES[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
}

function parseErrorBody(payload: unknown, status: number): ApiErrorBody | null {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }
  const { code, message, details, requestId } = payload.error;
  if (typeof code !== 'string' || !code || typeof message !== 'string') {
    return null;
  }
  return {
    code: toKnownErrorCode(code, status),
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

/** CORS exposes this header, so it is readable for cross-origin API calls too. */
function headerRequestId(response: Response): string | undefined {
  return response.headers.get('X-Request-Id') ?? undefined;
}

function invalidResponse(response: Response): ApiError {
  return new ApiError({
    status: response.status,
    code: 'INVALID_RESPONSE',
    message: `Unexpected response from the server (HTTP ${response.status})`,
    requestId: headerRequestId(response),
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
    const body = payload.ok ? parseErrorBody(payload.value, response.status) : null;
    if (!body) {
      throw invalidResponse(response);
    }
    throw new ApiError({
      status: response.status,
      ...body,
      requestId: body.requestId ?? headerRequestId(response),
    });
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
 * {@link ApiError}, except aborts by the caller's signal (not timeouts), which
 * are rethrown untouched so callers can tell cancellation apart from errors.
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

/**
 * Like {@link request}, for endpoints that return a file (e.g. a PDF). Shares
 * the base URL, Bearer token and 401 renewal; failures still arrive as JSON
 * error envelopes and are thrown as {@link ApiError}s.
 */
export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', '*/*');
  }
  const response = await send(path, { ...options, headers });
  if (!response.ok) {
    await readEnvelope(response, options.signal);
    throw invalidResponse(response);
  }
  try {
    return await response.blob();
  } catch (error) {
    throw toTransportError(error, options.signal);
  }
}
