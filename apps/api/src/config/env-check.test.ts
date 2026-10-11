import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { checkEnv } from './env-check';

const SECRET = 'a-very-long-jwt-secret-for-tests-0123456789';
const PRODUCTION = {
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb+srv://quotes:Sup3rS3cretPassw0rd@cluster.example.net/quoteflow',
  JWT_SECRET: SECRET,
  CORS_ORIGIN: 'https://quotes.example.com',
  APP_URL: 'https://quotes.example.com',
  TRUST_PROXY: '1',
};

function runCheck(source: NodeJS.ProcessEnv) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const exitCode = checkEnv(source, {
    info: (line) => stdout.push(line),
    error: (line) => stderr.push(line),
  });
  return { exitCode, stdout: stdout.join('\n'), stderr: stderr.join('\n') };
}

describe('checkEnv', () => {
  it('passes a complete production environment', () => {
    expect(runCheck(PRODUCTION)).toEqual({
      exitCode: 0,
      stdout: 'Environment check passed (production rules, because NODE_ENV=production).',
      stderr: '',
    });
  });

  it('fails a bad production environment, naming each variable and no value', () => {
    const result = runCheck({
      ...PRODUCTION,
      JWT_SECRET: 'changemechangemechangemechangeme',
      APP_URL: 'http://quotes.example.com',
      CORS_ORIGIN: undefined,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain(
      'Environment check failed (production rules, because NODE_ENV=production).',
    );
    expect(result.stderr).toContain('  - JWT_SECRET: must be a random value');
    expect(result.stderr).toContain('  - CORS_ORIGIN: is required in production');
    expect(result.stderr).toContain('  - APP_URL: must use https in production');
    expect(result.stderr).toContain('the current deployment keeps serving');
    for (const value of ['changemechangeme', 'http://quotes.example.com', 'Sup3rS3cretPassw0rd']) {
      expect(result.stderr).not.toContain(value);
    }
  });

  it('applies the production rules on a production host that forgot NODE_ENV', () => {
    const result = runCheck({ ...PRODUCTION, NODE_ENV: undefined, VERCEL_ENV: 'production' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('(production rules, because VERCEL_ENV=production)');
    expect(result.stderr).toContain('  - NODE_ENV: must be production on a production deployment');
  });

  it("skips Vercel's preview and development builds, which often have no secrets", () => {
    for (const vercelEnv of ['preview', 'development']) {
      expect(runCheck({ VERCEL_ENV: vercelEnv })).toEqual({
        exitCode: 0,
        stdout: `Environment check skipped: not a production deployment (VERCEL_ENV=${vercelEnv}).`,
        stderr: '',
      });
    }
    // Even one set up with production values: only a production deployment is checked.
    expect(runCheck({ ...PRODUCTION, APP_URL: undefined, VERCEL_ENV: 'preview' })).toMatchObject({
      exitCode: 0,
    });
  });

  it('applies the development rules elsewhere, such as a local check', () => {
    const local = { MONGODB_URI: PRODUCTION.MONGODB_URI, JWT_SECRET: SECRET };

    expect(runCheck(local)).toMatchObject({
      exitCode: 0,
      stdout:
        'Environment check passed (development rules, because neither NODE_ENV nor VERCEL_ENV is production).',
    });
    expect(runCheck({})).toMatchObject({ exitCode: 1 });
  });

  it("prints the boot warnings too, without failing, for a host's default address", () => {
    const appUrl = 'https://cleanco.vercel.app';
    const result = runCheck({ ...PRODUCTION, APP_URL: appUrl, CORS_ORIGIN: appUrl });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/^Warning: APP_URL is the hosting provider's default address/);
    expect(result.stdout).toMatch(/Environment check passed/);
  });
});

describe('pnpm env:check', () => {
  const apiRoot = fileURLToPath(new URL('../..', import.meta.url));

  /** Runs the real script, as the build command does, with only `env` as its environment. */
  async function runScript(env: NodeJS.ProcessEnv) {
    try {
      const { stdout, stderr } = await promisify(execFile)(
        process.execPath,
        ['--import', 'tsx', 'scripts/env-check.ts'],
        { cwd: apiRoot, env: { PATH: process.env.PATH, ...env } },
      );
      return { exitCode: 0, stdout, stderr };
    } catch (error) {
      const { code, stdout, stderr } = error as { code: number; stdout: string; stderr: string };
      return { exitCode: code, stdout, stderr };
    }
  }

  it('exits 1 with the variable names for a bad production environment', async () => {
    const result = await runScript({ VERCEL_ENV: 'production', MONGODB_URI: 'mongodb://db' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr.match(/^ {2}- [A-Z_]+/gm)).toEqual([
      '  - NODE_ENV',
      '  - MONGODB_URI',
      '  - JWT_SECRET',
      '  - CORS_ORIGIN',
      '  - APP_URL',
      '  - TRUST_PROXY',
    ]);
    expect(result.stderr).not.toContain('mongodb://db');
  });

  it('exits 0 on a preview build without any variables', async () => {
    const result = await runScript({ VERCEL_ENV: 'preview' });

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('Environment check skipped');
  });

  it('exits 0 for a good one', async () => {
    const result = await runScript({ ...PRODUCTION, VERCEL_ENV: 'production' });

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('Environment check passed (production rules');
  });
});
