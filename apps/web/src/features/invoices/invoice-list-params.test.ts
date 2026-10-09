import { describe, expect, it } from 'vitest';
import {
  INVOICE_PAGE_SIZE,
  readInvoiceListParams,
  toInvoiceListQuery,
  toInvoiceListSearchParams,
} from './invoice-list-params';

describe('invoice list params', () => {
  it('reads a status, search and page from the URL', () => {
    expect(
      readInvoiceListParams(new URLSearchParams('status=overdue&search=%20harper%20&page=3')),
    ).toEqual({ status: 'overdue', search: 'harper', page: 3 });
  });

  it('falls back to the defaults for unknown or malformed values', () => {
    expect(readInvoiceListParams(new URLSearchParams('status=unpaid&page=-2'))).toEqual({
      status: null,
      search: '',
      page: 1,
    });
    expect(readInvoiceListParams(new URLSearchParams('page=1.5')).page).toBe(1);
  });

  it('writes only non-default values', () => {
    expect(toInvoiceListSearchParams({ status: null, search: '', page: 1 }).toString()).toBe('');
    expect(
      toInvoiceListSearchParams({ status: 'partially_paid', search: 'INV-1', page: 2 }).toString(),
    ).toBe('status=partially_paid&search=INV-1&page=2');
  });

  it('round-trips through the URL', () => {
    const params = { status: 'paid' as const, search: 'olivia', page: 4 };
    expect(readInvoiceListParams(toInvoiceListSearchParams(params))).toEqual(params);
  });

  it('builds the API query', () => {
    expect(toInvoiceListQuery({ status: null, search: '', page: 1 })).toEqual({
      page: 1,
      pageSize: INVOICE_PAGE_SIZE,
    });
    expect(toInvoiceListQuery({ status: 'draft', search: 'x', page: 2 })).toEqual({
      page: 2,
      pageSize: INVOICE_PAGE_SIZE,
      status: 'draft',
      search: 'x',
    });
  });
});
