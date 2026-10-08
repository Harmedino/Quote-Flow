import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { paths } from './paths';
import { routes } from './router';

/** Resolves a URL against the real route table and returns the deepest match. */
function resolve(url: string) {
  const match = matchRoutes(routes, url)?.at(-1);
  if (!match) {
    throw new Error(`No route matches ${url}`);
  }
  return { pattern: match.route.path, params: match.params };
}

describe('paths', () => {
  it('builds parameterized URLs', () => {
    expect(paths.customer('665f1c2b9a1e4b0012345678')).toBe('/customers/665f1c2b9a1e4b0012345678');
    expect(paths.quote('q1')).toBe('/quotes/q1');
    expect(paths.editQuote('q1')).toBe('/quotes/q1/edit');
    expect(paths.invoice('i1')).toBe('/invoices/i1');
    expect(paths.publicQuote('tok_123')).toBe('/quote/tok_123');
  });

  it('encodes parameters so they stay within one path segment', () => {
    expect(paths.quote('a/b')).toBe('/quotes/a%2Fb');
    expect(paths.editQuote('a b?c')).toBe('/quotes/a%20b%3Fc/edit');
    expect(paths.publicQuote('x#y&z')).toBe('/quote/x%23y%26z');
  });

  it.each([
    [paths.home, undefined],
    [paths.login, '/login'],
    [paths.register, '/register'],
    [paths.forgotPassword, '/forgot-password'],
    [paths.dashboard, '/dashboard'],
    [paths.customers, '/customers'],
    [paths.services, '/services'],
    [paths.quotes, '/quotes'],
    [paths.newQuote, '/quotes/new'],
    [paths.invoices, '/invoices'],
    [paths.businessSettings, '/settings/business'],
    [paths.accountSettings, '/settings/account'],
  ])('%s resolves to its own route', (url, pattern) => {
    expect(resolve(url).pattern).toBe(pattern);
  });

  it('resolves parameterized URLs to their routes with decoded params', () => {
    expect(resolve(paths.customer('c 1'))).toEqual({
      pattern: '/customers/:customerId',
      params: { customerId: 'c 1' },
    });
    expect(resolve(paths.quote('a/b'))).toEqual({
      pattern: '/quotes/:quoteId',
      params: { quoteId: 'a/b' },
    });
    expect(resolve(paths.editQuote('q1'))).toEqual({
      pattern: '/quotes/:quoteId/edit',
      params: { quoteId: 'q1' },
    });
    expect(resolve(paths.invoice('i1'))).toEqual({
      pattern: '/invoices/:invoiceId',
      params: { invoiceId: 'i1' },
    });
    expect(resolve(paths.publicQuote('tok'))).toEqual({
      pattern: '/quote/:token',
      params: { token: 'tok' },
    });
  });

  it('serves the settings index and unknown URLs from dedicated routes', () => {
    const settings = matchRoutes(routes, paths.settings)?.at(-1);
    expect(settings?.route.index).toBe(true);
    expect(resolve('/no/such/page').pattern).toBe('*');
  });
});
