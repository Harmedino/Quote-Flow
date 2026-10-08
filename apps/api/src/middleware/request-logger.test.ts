import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCapturingLogger, createRouterTestApp } from '../test/helpers';
import { generatePublicToken } from '../utils/tokens';
import { maskUrlTokens } from './request-logger';

describe('maskUrlTokens', () => {
  const token = generatePublicToken();

  it.each([
    [`/api/public/quotes/${token}`, '/api/public/quotes/:token'],
    [`/api/public/quotes/${token}/accept`, '/api/public/quotes/:token/accept'],
    [`/api/public/invoices/${token}/pdf?download=1`, '/api/public/invoices/:token/pdf?download=1'],
    [`/API/Public/Quotes/${token}`, '/API/Public/Quotes/:token'],
    ['/api/public/quotes/not-a-real-token', '/api/public/quotes/:token'],
  ])('masks the token in %s', (url, masked) => {
    expect(maskUrlTokens(url)).toBe(masked);
  });

  it.each(['/api/quotes/6650f1e2a3b4c5d6e7f80912', '/api/public/quotes', '/api/health'])(
    'leaves %s alone',
    (url) => {
      expect(maskUrlTokens(url)).toBe(url);
    },
  );
});

describe('request logger', () => {
  it('never writes a public token to the request log', async () => {
    const { logger, entries } = createCapturingLogger();
    const router = Router();
    router.get('/api/public/quotes/:token', (_req, res) => {
      res.json({ data: {} });
    });
    const token = generatePublicToken();

    await request(createRouterTestApp(router, logger))
      .get(`/api/public/quotes/${token}`)
      .expect(200);

    const output = JSON.stringify(entries());
    expect(output).not.toContain(token);
    const completed = entries().find((entry) => entry.msg?.startsWith('GET '));
    expect(completed).toMatchObject({
      msg: 'GET /api/public/quotes/:token 200',
      req: { url: '/api/public/quotes/:token' },
    });
  });
});
