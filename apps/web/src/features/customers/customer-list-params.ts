/** The customers list's state, kept in the URL so it survives reloads and can be shared. */
export interface CustomerListParams {
  search: string;
  /** Include archived customers. */
  archived: boolean;
  page: number;
}

/** A positive whole page number, or 1 for anything else. */
export function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function readCustomerListParams(params: URLSearchParams): CustomerListParams {
  return {
    search: params.get('search')?.trim() ?? '',
    archived: params.get('archived') === 'true',
    page: parsePage(params.get('page')),
  };
}

/** Only non-default values are written, so the plain list is just `/customers`. */
export function toCustomerListSearchParams({
  search,
  archived,
  page,
}: CustomerListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (archived) params.set('archived', 'true');
  if (page > 1) params.set('page', String(page));
  return params;
}
