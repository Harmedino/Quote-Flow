import type {
  ApiPaginatedResponse,
  CustomerDto,
  CustomerInput,
  UpdateCustomerInput,
} from '@quoteflow/shared';
import { request, requestPaginated } from '@/lib/api-client';

/** GET /api/customers parameters (the shared CustomerListQuery, with values already parsed). */
export interface CustomerListOptions {
  page?: number;
  pageSize?: number;
  /** Matches name, email, phone or company. */
  search?: string;
  /** Include archived customers (hidden by default). */
  archived?: boolean;
}

/** Newest first. Archived customers are hidden unless `archived: true`. */
export function listCustomers(
  query: CustomerListOptions = {},
  signal?: AbortSignal,
): Promise<ApiPaginatedResponse<CustomerDto>> {
  return requestPaginated('/customers', { query: { ...query }, signal });
}

export function getCustomer(id: string, signal?: AbortSignal): Promise<CustomerDto> {
  return request(`/customers/${encodeURIComponent(id)}`, { signal });
}

export function createCustomer(input: CustomerInput): Promise<CustomerDto> {
  return request('/customers', { method: 'POST', body: input });
}

/** Omitted fields are unchanged; '' clears an optional field. */
export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerDto> {
  return request(`/customers/${encodeURIComponent(id)}`, { method: 'PATCH', body: input });
}

export function archiveCustomer(id: string): Promise<CustomerDto> {
  return request(`/customers/${encodeURIComponent(id)}/archive`, { method: 'POST' });
}

export function restoreCustomer(id: string): Promise<CustomerDto> {
  return request(`/customers/${encodeURIComponent(id)}/restore`, { method: 'POST' });
}
