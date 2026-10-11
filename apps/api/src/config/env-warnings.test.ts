import { describe, expect, it } from 'vitest';
import { createCapturingLogger } from '../test/helpers';
import { loadEnv } from './env';
import { usesDefaultHostName, warnAboutEnv } from './env-warnings';

const PRODUCTION = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/quoteflow',
  JWT_SECRET: 'a-very-long-jwt-secret-for-tests-0123456789',
  CORS_ORIGIN: 'https://quotes.example.com',
  APP_URL: 'https://quotes.example.com',
  TRUST_PROXY: '1',
};

function warningsFor(source: NodeJS.ProcessEnv) {
  const { logger, entries } = createCapturingLogger();
  warnAboutEnv(loadEnv(source), logger);
  return entries().filter((entry) => entry.level === 'warn');
}

describe('usesDefaultHostName', () => {
  it.each([
    'https://cleanco.vercel.app',
    'https://cleanco-git-release-team.vercel.app/',
    'https://CleanCo.Vercel.App',
    'https://cleanco.onrender.com',
  ])('is true for %s', (url) => {
    expect(usesDefaultHostName(url)).toBe(true);
  });

  it.each([
    'https://quotes.example.com',
    'https://vercel.app.example.com',
    'https://example.com/cleanco.vercel.app',
    'https://notvercel.app',
  ])('is false for %s', (url) => {
    expect(usesDefaultHostName(url)).toBe(false);
  });
});

describe('warnAboutEnv', () => {
  it("warns, naming APP_URL but not its value, when production uses a host's default address", () => {
    for (const appUrl of ['https://cleanco.vercel.app', 'https://cleanco.onrender.com']) {
      const warnings = warningsFor({ ...PRODUCTION, APP_URL: appUrl, CORS_ORIGIN: appUrl });
      expect(warnings.map(({ variable }) => variable)).toEqual(['APP_URL']);
      expect(warnings[0]?.msg).toMatch(/^APP_URL is the hosting provider's default address/);
      expect(JSON.stringify(warnings)).not.toContain('cleanco');
    }
  });

  it("stays quiet on the business's own domain", () => {
    expect(warningsFor(PRODUCTION)).toEqual([]);
  });

  it('stays quiet outside production, where local and preview addresses are expected', () => {
    expect(
      warningsFor({ ...PRODUCTION, NODE_ENV: 'development', APP_URL: 'https://x.vercel.app' }),
    ).toEqual([]);
  });
});
