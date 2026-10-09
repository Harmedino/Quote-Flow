import { INVOICE_STATUSES, type InvoiceStatus } from '@quoteflow/shared';
import type { InvoiceListOptions } from './invoices-api';

/** The invoices list's state, kept in the URL so it survives reloads and can be shared. */
export interface InvoiceListParams {
  /** null shows every status. */
  status: InvoiceStatus | null;
  search: string;
  page: number;
}

export const INVOICE_PAGE_SIZE = 20;

const STATUSES: ReadonlySet<string> = new Set(INVOICE_STATUSES);

function isInvoiceStatus(value: string | null): value is InvoiceStatus {
  return value !== null && STATUSES.has(value);
}

/** A positive whole page number, or 1 for anything else. */
function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export function readInvoiceListParams(params: URLSearchParams): InvoiceListParams {
  const status = params.get('status');
  return {
    status: isInvoiceStatus(status) ? status : null,
    search: params.get('search')?.trim() ?? '',
    page: parsePage(params.get('page')),
  };
}

/** Only non-default values are written, so the plain list is just `/invoices`. */
export function toInvoiceListSearchParams({
  status,
  search,
  page,
}: InvoiceListParams): URLSearchParams {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  if (page > 1) params.set('page', String(page));
  return params;
}

export function toInvoiceListQuery({
  status,
  search,
  page,
}: InvoiceListParams): InvoiceListOptions {
  return {
    page,
    pageSize: INVOICE_PAGE_SIZE,
    ...(status && { status }),
    ...(search && { search }),
  };
}
