import type {
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiResponse,
  PaginationMeta,
} from '@quoteflow/shared';
import type { Response } from 'express';
import type { AppError } from './app-error';

export function sendData<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data };
  res.status(status).json(body);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  const body: ApiPaginatedResponse<T> = { data, meta };
  res.status(200).json(body);
}

/** Responds with the standard error envelope. Only for errors that are safe to show clients. */
export function sendError(res: Response, error: AppError, requestId: string | undefined): void {
  const body: ApiErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      requestId,
    },
  };
  res.status(error.status).json(body);
}
