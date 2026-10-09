import { describe, expect, it } from 'vitest';
import {
  QUOTES_PAGE_SIZE,
  readQuoteListParams,
  toQuoteListQuery,
  writeQuoteListParams,
} from './quote-list-params';

const params = (query: string) => new URLSearchParams(query);

describe('quote list URL state', () => {
  it('reads valid values and ignores invalid ones', () => {
    expect(readQuoteListParams(params(''))).toEqual({ status: 'all', search: '', page: 1 });
    expect(readQuoteListParams(params('status=expired&search=%20chidi%20&page=3'))).toEqual({
      status: 'expired',
      search: 'chidi',
      page: 3,
    });
    expect(readQuoteListParams(params('status=archived&page=-2'))).toEqual({
      status: 'all',
      search: '',
      page: 1,
    });
    expect(readQuoteListParams(params('page=1.5')).page).toBe(1);
  });

  it('writes changes, dropping defaults and keeping unrelated parameters', () => {
    expect(writeQuoteListParams(params('utm=x'), { status: 'sent' }).toString()).toBe(
      'utm=x&status=sent',
    );
    expect(writeQuoteListParams(params('status=sent'), { status: 'all' }).toString()).toBe('');
    expect(writeQuoteListParams(params('status=sent'), { page: 2 }).toString()).toBe(
      'status=sent&page=2',
    );
  });

  it('goes back to the first page when the status or search changes', () => {
    expect(writeQuoteListParams(params('page=4'), { status: 'draft' }).toString()).toBe(
      'status=draft',
    );
    expect(writeQuoteListParams(params('status=sent&page=4'), { search: 'QT-1' }).toString()).toBe(
      'status=sent&search=QT-1',
    );
  });

  it('turns URL state into an API query', () => {
    expect(toQuoteListQuery({ status: 'all', search: '', page: 1 })).toEqual({
      page: 1,
      pageSize: QUOTES_PAGE_SIZE,
    });
    expect(toQuoteListQuery({ status: 'viewed', search: 'Ade', page: 2 })).toEqual({
      page: 2,
      pageSize: QUOTES_PAGE_SIZE,
      status: 'viewed',
      search: 'Ade',
    });
  });
});
