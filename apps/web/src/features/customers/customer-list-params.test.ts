import { describe, expect, it } from 'vitest';
import {
  parsePage,
  readCustomerListParams,
  toCustomerListSearchParams,
} from './customer-list-params';

describe('parsePage', () => {
  it('accepts positive whole numbers only', () => {
    expect(parsePage('3')).toBe(3);
    for (const value of [null, '', '0', '-1', '1.5', 'abc', '1e400']) {
      expect(parsePage(value)).toBe(1);
    }
  });
});

describe('customer list params', () => {
  it('reads defaults from an empty query string', () => {
    expect(readCustomerListParams(new URLSearchParams())).toEqual({
      search: '',
      archived: false,
      page: 1,
    });
  });

  it('round-trips through the URL, writing only non-default values', () => {
    const params = { search: 'a.*( & co', archived: true, page: 2 };
    const written = toCustomerListSearchParams(params);
    expect(written.toString()).toBe('search=a.*%28+%26+co&archived=true&page=2');
    expect(readCustomerListParams(written)).toEqual(params);
    expect(toCustomerListSearchParams({ search: '', archived: false, page: 1 }).toString()).toBe(
      '',
    );
  });

  it('trims the search and ignores unknown archived values', () => {
    expect(readCustomerListParams(new URLSearchParams('search=%20bob%20&archived=yes'))).toEqual({
      search: 'bob',
      archived: false,
      page: 1,
    });
  });
});
