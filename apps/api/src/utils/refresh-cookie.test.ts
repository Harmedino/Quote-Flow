import { parseSetCookie } from 'cookie';
import express, { type Request } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestEnv } from '../test/helpers';
import {
  REFRESH_COOKIE_NAME,
  createRefreshCookie,
  readRefreshCookie,
  shouldUseSecureCookies,
} from './refresh-cookie';

const TOKEN = 'k3bq0b3J9r2uJ1yN8m6q2Wm0r8m2y6L0f9c3m2a1b7Q';

function cookieApp(env = createTestEnv()) {
  const cookie = createRefreshCookie(env);
  const app = express();
  app.post('/set', (_req, res) => {
    cookie.set(res, TOKEN);
    res.status(204).end();
  });
  app.post('/clear', (_req, res) => {
    cookie.clear(res);
    res.status(204).end();
  });
  app.post('/read', (req: Request, res) => {
    res.json({ token: readRefreshCookie(req) ?? null });
  });
  return app;
}

async function setCookieHeader(path: '/set' | '/clear', env = createTestEnv()): Promise<string> {
  const res = await request(cookieApp(env)).post(path);
  const header: unknown = res.headers['set-cookie'];
  if (!Array.isArray(header) || header.length !== 1) throw new Error('Expected one Set-Cookie');
  return String(header[0]);
}

const productionEnv = () =>
  createTestEnv({
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://app.example.com',
    APP_URL: 'https://app.example.com',
    TRUST_PROXY: '1',
    JWT_SECRET: 'Zr8vK2pQ7xW4mN9bT3yH6jL1cF5gD0sA8eU2iO4',
  });

describe('refresh cookie', () => {
  it('is httpOnly, SameSite=Strict, scoped to /api/auth and lasts REFRESH_TOKEN_TTL_DAYS', async () => {
    const header = await setCookieHeader('/set', createTestEnv({ REFRESH_TOKEN_TTL_DAYS: '7' }));

    expect(header).toBe(
      `qf_refresh=${TOKEN}; Max-Age=604800; Path=/api/auth; HttpOnly; SameSite=Strict`,
    );
  });

  it('is Secure in production', async () => {
    const header = await setCookieHeader('/set', productionEnv());

    expect(parseSetCookie(header)).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
    });
  });

  it('is Secure whenever the web app is served over https', () => {
    expect(shouldUseSecureCookies({ NODE_ENV: 'development', APP_URL: 'https://app.test' })).toBe(
      true,
    );
    expect(
      shouldUseSecureCookies({ NODE_ENV: 'development', APP_URL: 'http://localhost:5173' }),
    ).toBe(false);
    expect(shouldUseSecureCookies({ NODE_ENV: 'production', APP_URL: 'http://internal' })).toBe(
      true,
    );
  });

  it.each([
    ['development', createTestEnv()],
    ['production', productionEnv()],
  ])('is cleared with the same attributes it was set with (%s)', async (_label, env) => {
    const {
      value: setValue,
      maxAge: setMaxAge,
      ...setAttributes
    } = parseSetCookie(await setCookieHeader('/set', env));
    const { value, maxAge, expires, ...clearAttributes } = parseSetCookie(
      await setCookieHeader('/clear', env),
    );

    expect(setValue).toBe(TOKEN);
    expect(setMaxAge).toBeGreaterThan(0);
    expect(value).toBe('');
    expect(maxAge).toBe(0);
    expect(expires?.getTime()).toBe(0);
    expect(clearAttributes).toEqual(setAttributes);
  });

  it.each([
    [`${REFRESH_COOKIE_NAME}=${TOKEN}`, TOKEN],
    [`theme=dark; ${REFRESH_COOKIE_NAME}=${TOKEN}; other=1`, TOKEN],
    [`${REFRESH_COOKIE_NAME}=`, null],
    ['theme=dark', null],
  ])('reads the refresh token from the Cookie header %j', async (cookieHeader, expected) => {
    const res = await request(cookieApp()).post('/read').set('Cookie', cookieHeader);
    expect(res.body).toEqual({ token: expected });
  });

  it('reads nothing when there is no Cookie header', async () => {
    const res = await request(cookieApp()).post('/read');
    expect(res.body).toEqual({ token: null });
  });
});
