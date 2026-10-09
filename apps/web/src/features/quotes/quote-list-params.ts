import { QUOTE_STATUSES, type QuoteStatus } from '@quoteflow/shared';
import type { QuoteListParamsQuery } from './quotes-api';

export type QuoteStatusTab = QuoteStatus | 'all';

export const QUOTE_STATUS_TABS: readonly { value: QuoteStatusTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

export const QUOTES_PAGE_SIZE = 20;

export interface QuoteListParams {
  status: QuoteStatusTab;
  search: string;
  page: number;
}

function isQuoteStatus(value: string | null): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly (string | null)[]).includes(value);
}

/** Reads the list state from the URL, ignoring anything invalid. */
export function readQuoteListParams(params: URLSearchParams): QuoteListParams {
  const status = params.get('status');
  const page = Number(params.get('page'));
  return {
    status: isQuoteStatus(status) ? status : 'all',
    search: params.get('search')?.trim() ?? '',
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/**
 * The URL for a changed list state. Defaults are left out, other parameters
 * are kept, and a new status or search goes back to the first page.
 */
export function writeQuoteListParams(
  current: URLSearchParams,
  changes: Partial<QuoteListParams>,
): URLSearchParams {
  const next = { ...readQuoteListParams(current), ...changes };
  if (changes.status !== undefined || changes.search !== undefined) {
    next.page = changes.page ?? 1;
  }
  const params = new URLSearchParams(current);
  const set = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  set('status', next.status === 'all' ? null : next.status);
  set('search', next.search.trim() || null);
  set('page', next.page > 1 ? String(next.page) : null);
  return params;
}

export function toQuoteListQuery(params: QuoteListParams): QuoteListParamsQuery {
  return {
    page: params.page,
    pageSize: QUOTES_PAGE_SIZE,
    ...(params.status !== 'all' && { status: params.status }),
    ...(params.search && { search: params.search }),
  };
}
