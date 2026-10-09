import { describe, expect, it } from 'vitest';
import {
  activeFilterOf,
  readServiceListParams,
  toServiceListSearchParams,
} from './service-list-params';

describe('service list params', () => {
  it('defaults to every service', () => {
    expect(readServiceListParams(new URLSearchParams('status=bogus&page=x'))).toEqual({
      search: '',
      status: 'all',
      page: 1,
    });
  });

  it('round-trips through the URL', () => {
    const params = { search: 'paint', status: 'inactive' as const, page: 3 };
    const written = toServiceListSearchParams(params);
    expect(written.toString()).toBe('search=paint&status=inactive&page=3');
    expect(readServiceListParams(written)).toEqual(params);
  });

  it('maps the status filter to the API’s active flag', () => {
    expect(activeFilterOf('all')).toBeUndefined();
    expect(activeFilterOf('active')).toBe(true);
    expect(activeFilterOf('inactive')).toBe(false);
  });
});
