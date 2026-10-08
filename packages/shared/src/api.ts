/**
 * API response envelope shared by the API and the web client.
 *
 *   Success:   { data: T }
 *   Paginated: { data: T[], meta: PaginationMeta }
 *   Error:     { error: { code, message, details?, requestId? } }
 */

export const API_ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'INVALID_JSON',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiFieldError {
  /** Dot-separated path to the offending field, e.g. `items.0.quantity`. */
  path: string;
  message: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  details?: ApiFieldError[];
  requestId?: string;
}

export interface ApiErrorResponse {
  error: ApiErrorBody;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Body of a ready `GET /api/health` (200). When the API is not ready it
 * responds 503 with the standard error envelope (code SERVICE_UNAVAILABLE).
 */
export interface HealthStatus {
  status: 'ok';
  database: 'connected';
  uptimeSeconds: number;
}
