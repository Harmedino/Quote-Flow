import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';
import { isDatabaseConnected } from '../db/connection';
import type { HealthStatus } from '@quoteflow/shared';
import { createSilentLogger, createTestEnv, dataOf } from '../test/helpers';

vi.mock('../db/connection', () => ({ isDatabaseConnected: vi.fn() }));

function buildApp() {
  return createApp({ env: createTestEnv(), logger: createSilentLogger(), rateLimit: false });
}

describe('GET /api/health (readiness)', () => {
  beforeEach(() => {
    vi.mocked(isDatabaseConnected).mockReset();
  });

  it('returns 200 with the shared HealthStatus shape when the database is connected', async () => {
    vi.mocked(isDatabaseConnected).mockReturnValue(true);

    const res = await request(buildApp()).get('/api/health');

    expect(res.status).toBe(200);
    const health = dataOf<HealthStatus>(res);
    expect(health).toEqual({
      status: 'ok',
      database: 'connected',
      uptimeSeconds: health.uptimeSeconds,
    });
    expect(Number.isInteger(health.uptimeSeconds)).toBe(true);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('returns 503 with the standard error envelope when the database is not connected', async () => {
    vi.mocked(isDatabaseConnected).mockReturnValue(false);

    const res = await request(buildApp()).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
        requestId: res.headers['x-request-id'],
      },
    });
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
