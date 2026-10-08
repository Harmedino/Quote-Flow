import type { ApiPaginatedResponse, ApiResponse, PaginationMeta } from '@quoteflow/shared';
import type { Response } from 'express';

export function sendData<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { data };
  res.status(status).json(body);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  const body: ApiPaginatedResponse<T> = { data, meta };
  res.status(200).json(body);
}
