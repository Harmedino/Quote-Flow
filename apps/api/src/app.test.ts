import { MAX_LINE_ITEMS, TEXT_LIMITS, lineItemsSchema } from '@quoteflow/shared';
import { Router } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { sendData } from './utils/response';
import {
  TEST_ORIGIN,
  createCapturingLogger,
  createRouterTestApp,
  createSilentLogger,
  createTestEnv,
  errorOf,
} from './test/helpers';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function buildApp() {
  return createApp({ env: createTestEnv(), logger: createSilentLogger(), rateLimit: false });
}

describe('createApp', () => {
  describe('health', () => {
    it('reports liveness without touching the database', async () => {
      const res = await request(buildApp()).get('/api/health/live');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: { status: 'ok' } });
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('reports not ready with 503 while the database is disconnected', async () => {
      const res = await request(buildApp()).get('/api/health');

      expect(res.status).toBe(503);
      expect(errorOf(res)).toEqual({
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
        requestId: res.headers['x-request-id'],
      });
      expect(res.headers['cache-control']).toBe('no-store');
    });

    it('does not log successful health checks', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createApp({ env: createTestEnv(), logger, rateLimit: false });

      await request(app).get('/api/health/live').expect(200);
      await request(app).get('/api/health').expect(503);
      await request(app).get('/api/unknown').expect(404);

      expect(entries().map((entry) => entry.msg)).toEqual(['GET /api/unknown 404']);
    });
  });

  describe('errors', () => {
    it('responds to unknown routes with the NOT_FOUND envelope', async () => {
      const res = await request(buildApp()).get('/api/does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          requestId: res.headers['x-request-id'],
        },
      });
    });

    it('rejects malformed JSON with INVALID_JSON', async () => {
      const res = await request(buildApp())
        .post('/api/does-not-exist')
        .set('Content-Type', 'application/json')
        .send('{"name": ');

      expect(res.status).toBe(400);
      expect(errorOf(res).code).toBe('INVALID_JSON');
      expect(JSON.stringify(res.body)).not.toMatch(/Unexpected|SyntaxError|position/);
    });

    it('rejects bodies over 1 MB with PAYLOAD_TOO_LARGE', async () => {
      const res = await request(buildApp())
        .post('/api/does-not-exist')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ notes: 'x'.repeat(1024 * 1024) }));

      expect(res.status).toBe(413);
      expect(errorOf(res)).toMatchObject({
        code: 'PAYLOAD_TOO_LARGE',
        requestId: res.headers['x-request-id'],
      });
    });

    it('accepts the largest document the shared rules allow', async () => {
      const text = (length: number) => '中'.repeat(length);
      const items = Array.from({ length: MAX_LINE_ITEMS }, () => ({
        name: text(TEXT_LIMITS.itemName),
        description: text(TEXT_LIMITS.itemDescription),
        unit: text(TEXT_LIMITS.itemUnit),
        quantity: 1,
        unitPrice: 100,
      }));
      expect(lineItemsSchema.safeParse(items).success).toBe(true);
      const body = { items, notes: text(TEXT_LIMITS.notes), terms: text(TEXT_LIMITS.terms) };

      const router = Router();
      router.post('/echo', (req, res) => {
        sendData(res, { received: Buffer.byteLength(JSON.stringify(req.body)) });
      });
      const res = await request(createRouterTestApp(router)).post('/echo').send(body);

      expect(res.status).toBe(200);
      expect(Buffer.byteLength(JSON.stringify(body))).toBeGreaterThan(700_000);
    });

    it('logs client errors at warn level without an error object', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createApp({ env: createTestEnv(), logger, rateLimit: false });

      await request(app).get('/api/missing').expect(404);

      const [entry] = entries();
      expect(entry).toMatchObject({ level: 'warn', res: { statusCode: 404 } });
      expect(entry).not.toHaveProperty('err');
    });
  });

  describe('request ids', () => {
    it('echoes a well-formed inbound X-Request-Id', async () => {
      const res = await request(buildApp())
        .get('/api/missing')
        .set('X-Request-Id', 'lb-trace_0123-ABC');

      expect(res.headers['x-request-id']).toBe('lb-trace_0123-ABC');
      expect(errorOf(res).requestId).toBe('lb-trace_0123-ABC');
    });

    it.each([
      ['unsafe characters', 'abc def<script>'],
      ['more than 64 characters', 'a'.repeat(65)],
      ['an empty value', ''],
    ])('replaces an inbound id with %s by a generated UUID', async (_label, inbound) => {
      const res = await request(buildApp()).get('/api/health/live').set('X-Request-Id', inbound);

      expect(res.headers['x-request-id']).toMatch(UUID);
    });

    it('generates a UUID when none is sent', async () => {
      const res = await request(buildApp()).get('/api/health/live');

      expect(res.headers['x-request-id']).toMatch(UUID);
    });
  });

  describe('security headers', () => {
    it('sets helmet headers suited to a JSON API and hides the framework', async () => {
      const res = await request(buildApp()).get('/api/health/live');

      expect(res.headers['content-security-policy']).toBe(
        "default-src 'none';frame-ancestors 'none'",
      );
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['strict-transport-security']).toContain('max-age=');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('CORS', () => {
    it('allows a configured origin with credentials and exposes the request id and retry timing', async () => {
      const res = await request(buildApp()).get('/api/health/live').set('Origin', TEST_ORIGIN);

      expect(res.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-expose-headers']).toBe(
        'X-Request-Id,Retry-After,RateLimit,RateLimit-Policy',
      );
      expect(res.headers.vary).toContain('Origin');
    });

    it('answers preflight requests from a configured origin', async () => {
      const res = await request(buildApp())
        .options('/api/quotes')
        .set('Origin', TEST_ORIGIN)
        .set('Access-Control-Request-Method', 'PATCH')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);
      expect(res.headers['access-control-allow-methods']).toBe('GET,POST,PUT,PATCH,DELETE,OPTIONS');
      expect(res.headers['access-control-allow-headers']).toBe(
        'Content-Type,Authorization,X-Request-Id',
      );
      expect(res.headers['access-control-max-age']).toBe('600');
    });

    it('sends no CORS headers to other origins', async () => {
      const res = await request(buildApp())
        .get('/api/health/live')
        .set('Origin', 'https://evil.example');

      expect(res.status).toBe(200);
      expect(res.headers).not.toHaveProperty('access-control-allow-origin');
      expect(res.headers).not.toHaveProperty('access-control-allow-credentials');
      expect(res.headers.vary).toContain('Origin');
    });

    it('sends no CORS headers in reply to a preflight from another origin', async () => {
      const res = await request(buildApp())
        .options('/api/quotes')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'DELETE');

      expect(res.headers).not.toHaveProperty('access-control-allow-origin');
      expect(res.headers).not.toHaveProperty('access-control-allow-methods');
    });
  });

  describe('rate limiting', () => {
    function buildLimitedApp() {
      return createApp({
        env: createTestEnv(),
        logger: createSilentLogger(),
        rateLimit: { windowMs: 60_000, limit: 2 },
      });
    }

    it('responds with the RATE_LIMITED envelope once the limit is exceeded', async () => {
      const app = buildLimitedApp();
      await request(app).get('/api/missing').expect(404);
      await request(app).get('/api/missing').expect(404);

      const res = await request(app).get('/api/missing');

      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          requestId: res.headers['x-request-id'],
        },
      });
      expect(res.headers['retry-after']).toBeDefined();
      expect(res.headers['ratelimit-policy']).toContain('q=2');
      expect(res.headers).not.toHaveProperty('x-ratelimit-limit');
    });

    it('keeps CORS headers on rate-limited responses so the browser can read them', async () => {
      const app = buildLimitedApp();
      await request(app).get('/api/missing');
      await request(app).get('/api/missing');

      const res = await request(app).get('/api/missing').set('Origin', TEST_ORIGIN);

      expect(res.status).toBe(429);
      expect(res.headers['access-control-allow-origin']).toBe(TEST_ORIGIN);
    });

    it('reports limiter misconfiguration through the application logger', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createApp({
        env: createTestEnv(),
        logger,
        rateLimit: { windowMs: 1000, limit: 5 },
      });

      // X-Forwarded-For while TRUST_PROXY=0 means every client may share the proxy's IP.
      await request(app).get('/api/missing').set('X-Forwarded-For', '203.0.113.7');

      const limiterError = entries().find((entry) => entry.level === 'error');
      expect(limiterError?.err).toMatchObject({ code: 'ERR_ERL_UNEXPECTED_X_FORWARDED_FOR' });
    });

    it('identifies clients by X-Forwarded-For when a proxy hop is trusted', async () => {
      const app = createApp({
        env: createTestEnv({ TRUST_PROXY: '1' }),
        logger: createSilentLogger(),
        rateLimit: { windowMs: 60_000, limit: 1 },
      });

      await request(app).get('/api/missing').set('X-Forwarded-For', '203.0.113.1').expect(404);
      await request(app).get('/api/missing').set('X-Forwarded-For', '203.0.113.2').expect(404);
      await request(app).get('/api/missing').set('X-Forwarded-For', '203.0.113.1').expect(429);
    });

    it('allows each client 1000 API requests per 15 minutes by default', async () => {
      const app = createApp({ env: createTestEnv(), logger: createSilentLogger() });

      const res = await request(app).get('/api/missing').expect(404);

      const policy = res.headers['ratelimit-policy'];
      expect(policy).toContain('q=1000;');
      expect(policy).toContain('w=900;');
    });

    it('never rate-limits health checks', async () => {
      const app = buildLimitedApp();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await request(app).get('/api/health/live').expect(200);
      }
    });
  });
});
