import { matchRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { redirectSignedIn, requireSession } from '@/features/auth/route-guards';
import { paths, withRedirectTo } from './paths';
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
    expect(paths.editInvoice('i1')).toBe('/invoices/i1/edit');
    expect(paths.publicQuote('tok_123')).toBe('/quote/tok_123');
    expect(paths.publicInvoice('tok_123')).toBe('/invoice/tok_123');
  });

  it('encodes parameters so they stay within one path segment', () => {
    expect(paths.quote('a/b')).toBe('/quotes/a%2Fb');
    expect(paths.editQuote('a b?c')).toBe('/quotes/a%20b%3Fc/edit');
    expect(paths.publicQuote('x#y&z')).toBe('/quote/x%23y%26z');
    expect(paths.publicInvoice('x#y&z')).toBe('/invoice/x%23y%26z');
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
    [paths.newInvoice, '/invoices/new'],
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
    expect(resolve(paths.editInvoice('i1'))).toEqual({
      pattern: '/invoices/:invoiceId/edit',
      params: { invoiceId: 'i1' },
    });
    expect(resolve(paths.publicQuote('tok'))).toEqual({
      pattern: '/quote/:token',
      params: { token: 'tok' },
    });
    expect(resolve(paths.publicInvoice('tok'))).toEqual({
      pattern: '/invoice/:token',
      params: { token: 'tok' },
    });
  });

  it('serves the settings index and unknown URLs from dedicated routes', () => {
    const settings = matchRoutes(routes, paths.settings)?.at(-1);
    expect(settings?.route.index).toBe(true);
    expect(resolve('/no/such/page').pattern).toBe('*');
  });

  it('protects every signed-in page and only the sign-in and sign-up pages redirect signed-in users', () => {
    const middlewareFor = (url: string) =>
      (matchRoutes(routes, url) ?? []).flatMap((match) => match.route.middleware ?? []);

    for (const url of [
      paths.dashboard,
      paths.customers,
      paths.customer('c1'),
      paths.services,
      paths.quotes,
      paths.newQuote,
      paths.quote('q1'),
      paths.editQuote('q1'),
      paths.invoices,
      paths.newInvoice,
      paths.invoice('i1'),
      paths.editInvoice('i1'),
      paths.settings,
      paths.businessSettings,
      paths.accountSettings,
    ]) {
      expect(middlewareFor(url), url).toEqual([requireSession]);
    }
    expect(middlewareFor(paths.login)).toEqual([redirectSignedIn]);
    expect(middlewareFor(paths.register)).toEqual([redirectSignedIn]);
    for (const url of [
      paths.home,
      paths.forgotPassword,
      paths.publicQuote('tok'),
      paths.publicInvoice('tok'),
      '/nope',
    ]) {
      expect(middlewareFor(url), url).toEqual([]);
    }
  });
});

describe('withRedirectTo', () => {
  it('adds an encoded redirectTo parameter', () => {
    expect(withRedirectTo(paths.login, '/quotes?status=sent')).toBe(
      '/login?redirectTo=%2Fquotes%3Fstatus%3Dsent',
    );
    expect(withRedirectTo(paths.register, '/quotes/new')).toBe(
      '/register?redirectTo=%2Fquotes%2Fnew',
    );
  });

  it('leaves the path alone without a destination', () => {
    expect(withRedirectTo(paths.login, null)).toBe('/login');
    expect(withRedirectTo(paths.login, '')).toBe('/login');
  });
});
