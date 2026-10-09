import { describe, expect, it } from 'vitest';
import {
  isSessionExpiredState,
  postSignInPath,
  sanitizeRedirectPath,
  SESSION_EXPIRED_STATE,
  signInPathFor,
} from './redirect';

describe('sanitizeRedirectPath', () => {
  it.each([
    ['/quotes', '/quotes'],
    ['/quotes/abc/edit?tab=items#totals', '/quotes/abc/edit?tab=items#totals'],
    ['/customers?search=Ann%20Lee', '/customers?search=Ann%20Lee'],
    ['/settings/../dashboard', '/dashboard'],
  ])('accepts the in-app path %s', (value, expected) => {
    expect(sanitizeRedirectPath(value)).toBe(expected);
  });

  it.each([
    ['an empty value', ''],
    ['a missing value', null],
    ['an absolute URL', 'https://evil.example/quotes'],
    ['a scheme without slashes', 'javascript:alert(1)'],
    ['a data URL', 'data:text/html,<script>alert(1)</script>'],
    ['a protocol-relative URL', '//evil.example'],
    ['a protocol-relative URL with a path', '//evil.example/quotes'],
    ['a backslash host', '/\\evil.example'],
    ['a double backslash host', '\\\\evil.example'],
    ['a backslash later in the path', '/quotes\\..\\..\\evil'],
    ['a tab hiding a second slash', '/\t/evil.example'],
    ['a newline hiding a second slash', '/\n/evil.example'],
    ['a relative path', 'quotes'],
    ['a dot path', './quotes'],
    ['the sign-in page', '/login?redirectTo=/quotes'],
    ['the sign-up page', '/register'],
    ['an overly long path', `/${'a'.repeat(2048)}`],
  ])('rejects %s', (_case, value) => {
    expect(sanitizeRedirectPath(value)).toBeNull();
  });
});

describe('postSignInPath', () => {
  it('returns the safe path or the dashboard', () => {
    expect(postSignInPath('/invoices?status=overdue')).toBe('/invoices?status=overdue');
    expect(postSignInPath('https://evil.example')).toBe('/dashboard');
    expect(postSignInPath(null)).toBe('/dashboard');
  });
});

describe('signInPathFor', () => {
  it('encodes the current path and query as redirectTo', () => {
    expect(signInPathFor('/quotes?status=sent&page=2')).toBe(
      '/login?redirectTo=%2Fquotes%3Fstatus%3Dsent%26page%3D2',
    );
  });

  it('leaves out the default destination', () => {
    expect(signInPathFor('/dashboard')).toBe('/login');
  });
});

describe('isSessionExpiredState', () => {
  it('recognises only the session-expired navigation state', () => {
    expect(isSessionExpiredState(SESSION_EXPIRED_STATE)).toBe(true);
    expect(isSessionExpiredState({ sessionExpired: 'yes' })).toBe(false);
    expect(isSessionExpiredState(null)).toBe(false);
    expect(isSessionExpiredState(undefined)).toBe(false);
  });
});
