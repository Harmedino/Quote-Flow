import type {
  ApiPaginatedResponse,
  ServiceDto,
  ServiceInput,
  UpdateServiceInput,
} from '@quoteflow/shared';
import { request, requestPaginated } from '@/lib/api-client';

/** GET /api/services parameters (the shared ServiceListQuery, with values already parsed). */
export interface ServiceListOptions {
  page?: number;
  pageSize?: number;
  /** Matches name or description. */
  search?: string;
  /** Only active (true) or inactive (false) services; omit for all. */
  active?: boolean;
}

/** Sorted by name. Pass `active: true` to list only services offered for new quotes. */
export function listServices(
  query: ServiceListOptions = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<ServiceDto>> {
  return requestPaginated('/services', { query: { ...query }, signal });
}

export function getService(id: string, signal?: AbortSignal): Promise<ServiceDto> {
  return request(`/services/${encodeURIComponent(id)}`, { signal });
}

/** `price` is in the business currency's minor units. */
export function createService(input: ServiceInput): Promise<ServiceDto> {
  return request('/services', { method: 'POST', body: input });
}

/** Omitted fields are unchanged; '' clears an optional text field. */
export function updateService(id: string, input: UpdateServiceInput): Promise<ServiceDto> {
  return request(`/services/${encodeURIComponent(id)}`, { method: 'PATCH', body: input });
}

export async function deleteService(id: string): Promise<void> {
  await request<undefined>(`/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
