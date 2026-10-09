import type { PaginationMeta } from '@quoteflow/shared';

export interface PageRequest {
  page: number;
  pageSize: number;
}

/** How many documents to skip to reach the requested page. */
export function skipFor({ page, pageSize }: PageRequest): number {
  return (page - 1) * pageSize;
}

export function toPaginationMeta({ page, pageSize }: PageRequest, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
