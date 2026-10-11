import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

interface VercelConfig {
  buildCommand: string;
  headers: HeaderRule[];
  rewrites: { source: string; destination: string }[];
}

const config = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as VercelConfig;

/** The static policy for this same-origin app (Turnstile is the only third party). */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const EVERY_PATH = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

/**
 * Vercel matches `source` like path-to-regexp. This handles the two forms vercel.json uses,
 * `/(.*)` and `/segment/:path*` (the segment itself and anything below it), and refuses others,
 * so a new form gets a matcher here before it is trusted.
 */
function sourceToRegExp(source: string): RegExp {
  if (source === '/(.*)') return /^\/.*$/;
  const segment = /^\/([a-z-]+)\/:path\*$/.exec(source)?.[1];
  if (segment === undefined) throw new Error(`No matcher for the source ${source}`);
  return new RegExp(`^/${segment}(?:/.*)?$`);
}

/** Every matching rule applies; a later rule's value for the same header wins. */
function headersFor(path: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const rule of config.headers) {
    if (!sourceToRegExp(rule.source).test(path)) continue;
    for (const { key, value } of rule.headers) headers[key] = value;
  }
  return headers;
}

const ADMIN_PATHS = ['/admin', '/admin/', '/admin/login', '/admin/quotes/abc123'];
const CAPABILITY_PATHS = ['/quote/AbC-123_xyz', '/invoice/AbC-123_xyz'];
// The API, including the capability PDFs a customer page links to.
const API_PATHS = ['/api', '/api/health', '/api/public/quotes/AbC-123_xyz/pdf'];
const PUBLIC_PATHS = ['/', '/services', '/request-a-quote', '/privacy', '/administrator'];
const OTHER_PATHS = ['/theme-init.js', '/assets/index-abc.js', '/apis', '/login'];

describe('vercel.json', () => {
  it('checks the environment before building anything', () => {
    expect(config.buildCommand.split(' && ')).toEqual([
      'pnpm --filter @quoteflow/api env:check',
      'pnpm --filter @quoteflow/api build',
      'pnpm --filter @quoteflow/web build',
    ]);
  });

  it.each([...ADMIN_PATHS, ...CAPABILITY_PATHS, ...API_PATHS, ...PUBLIC_PATHS, ...OTHER_PATHS])(
    'sends the security headers on %s',
    (path) => {
      expect(headersFor(path)).toMatchObject(
        CAPABILITY_PATHS.includes(path)
          ? { ...EVERY_PATH, 'Referrer-Policy': 'no-referrer' }
          : EVERY_PATH,
      );
    },
  );

  it.each([...ADMIN_PATHS, ...CAPABILITY_PATHS, ...API_PATHS])(
    'keeps %s out of search engines',
    (path) => {
      expect(headersFor(path)['X-Robots-Tag']).toBe('noindex');
    },
  );

  it.each([...PUBLIC_PATHS, ...OTHER_PATHS])('lets search engines index %s', (path) => {
    expect(headersFor(path)).not.toHaveProperty('X-Robots-Tag');
  });

  it('allows no inline or evaluated script, and no framing', () => {
    const policy = headersFor('/')['Content-Security-Policy'] ?? '';
    const directives = new Map(
      policy.split('; ').map((directive) => {
        const [name = '', ...sources] = directive.split(' ');
        return [name, sources];
      }),
    );
    expect(directives.get('script-src')).not.toContain("'unsafe-inline'");
    expect(directives.get('script-src')).not.toContain("'unsafe-eval'");
    expect(directives.get('frame-ancestors')).toEqual(["'none'"]);
  });

  it('still serves the SPA for every path but /api', () => {
    expect(config.rewrites).toEqual([
      { source: '/api/:path*', destination: '/api' },
      { source: '/((?!api/).*)', destination: '/index.html' },
    ]);
  });
});
