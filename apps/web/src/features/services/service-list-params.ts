import { parsePage } from '@/features/customers/customer-list-params';

export const SERVICE_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;
export type ServiceStatusFilter = (typeof SERVICE_STATUS_FILTERS)[number];

/** The services list's state, kept in the URL so it survives reloads and can be shared. */
export interface ServiceListParams {
  search: string;
  status: ServiceStatusFilter;
  page: number;
}

function isStatusFilter(value: string | null): value is ServiceStatusFilter {
  return SERVICE_STATUS_FILTERS.some((status) => status === value);
}

export function readServiceListParams(params: URLSearchParams): ServiceListParams {
  const status = params.get('status');
  return {
    search: params.get('search')?.trim() ?? '',
    status: isStatusFilter(status) ? status : 'all',
    page: parsePage(params.get('page')),
  };
}

/** Only non-default values are written, so the plain list is just `/services`. */
export function toServiceListSearchParams({
  search,
  status,
  page,
}: ServiceListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status !== 'all') params.set('status', status);
  if (page > 1) params.set('page', String(page));
  return params;
}

/** The API's `active` filter for a status choice; undefined lists every service. */
export function activeFilterOf(status: ServiceStatusFilter): boolean | undefined {
  return status === 'all' ? undefined : status === 'active';
}
