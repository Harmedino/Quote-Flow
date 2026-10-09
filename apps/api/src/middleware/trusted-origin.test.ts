import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRouterTestApp, errorOf } from '../test/helpers';
import { createTrustedOriginCheck } from './trusted-origin';

const APP_ORIGIN = 'https://app.example.com';

function buildApp() {
  const router = Router();
  router.post(
    '/refresh',
    createTrustedOriginCheck([APP_ORIGIN, 'http://localhost:5173']),
    (_req, res) => {
      res.status(204).end();
    },
  );
  return createRouterTestApp(router);
}

function post(headers: Record<string, string>) {
  const req = request(buildApp()).post('/refresh');
  for (const [name, value] of Object.entries(headers)) req.set(name, value);
  return req;
}

describe('createTrustedOriginCheck', () => {
  it.each([
    ['an allowed Origin', { Origin: APP_ORIGIN }],
    ['another allowed Origin', { Origin: 'http://localhost:5173' }],
    [
      'an allowed Origin with Sec-Fetch-Site: same-site',
      { Origin: APP_ORIGIN, 'Sec-Fetch-Site': 'same-site' },
    ],
    ['no Origin and Sec-Fetch-Site: same-origin', { 'Sec-Fetch-Site': 'same-origin' }],
    ['no Origin and Sec-Fetch-Site: none', { 'Sec-Fetch-Site': 'none' }],
    ['neither header (a non-browser client)', {}],
  ])('allows a request with %s', async (_label, headers) => {
    await post(headers).expect(204);
  });

  it("allows the API's own origin without listing it (web app and API on one host)", async () => {
    await post({
      Host: 'quote-flow-git-preview.vercel.app',
      Origin: 'http://quote-flow-git-preview.vercel.app',
    }).expect(204);
  });

  it.each([
    [
      'its own host on another scheme',
      { Host: 'quote-flow.example', Origin: 'https://quote-flow.example' },
    ],
    [
      'an Origin that differs from its own host',
      { Host: 'quote-flow.example', Origin: 'http://evil.example' },
    ],
  ])('rejects %s', async (_label, headers) => {
    await post(headers).expect(403);
  });

  it.each([
    ['another Origin', { Origin: 'https://evil.example' }],
    ['an allowed host on another scheme', { Origin: 'http://app.example.com' }],
    ['an allowed origin with a trailing slash', { Origin: `${APP_ORIGIN}/` }],
    ['an opaque Origin', { Origin: 'null' }],
    ['no Origin and Sec-Fetch-Site: cross-site', { 'Sec-Fetch-Site': 'cross-site' }],
    [
      'another Origin even though Sec-Fetch-Site says same-origin',
      { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'same-origin' },
    ],
  ])('rejects a request with %s with 403 FORBIDDEN', async (_label, headers) => {
    const res = await post(headers);

    expect(res.status).toBe(403);
    expect(errorOf(res)).toMatchObject({
      code: 'FORBIDDEN',
      message: 'This request is not allowed from this website.',
    });
  });
});
