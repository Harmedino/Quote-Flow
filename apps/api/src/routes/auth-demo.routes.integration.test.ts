import type { AuthSessionDto, DemoAvailabilityDto, QuoteListItemDto } from '@quoteflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { DEMO_BUSINESS, DEMO_OWNER_EMAIL } from '../demo/data/business';
import { BusinessModel } from '../models';
import {
  bearer,
  createAuthTestApp,
  createTestClock,
  refreshCookieOf,
  registerOwner,
} from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { TEST_ORIGIN, createTestEnv, dataOf } from '../test/helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

function demoApp(options: Parameters<typeof createAuthTestApp>[0] = {}) {
  return createAuthTestApp({ env: createTestEnv({ DEMO_LOGIN_ENABLED: 'true' }), ...options });
}

function startDemo(app: ReturnType<typeof createAuthTestApp>) {
  return request(app).post('/api/auth/demo').set('Origin', TEST_ORIGIN);
}

describe('demo availability', () => {
  it('reports whether the demo login is enabled', async () => {
    const off = await request(createAuthTestApp()).get('/api/auth/demo').expect(200);
    expect(dataOf<DemoAvailabilityDto>(off)).toEqual({ available: false });

    const on = await request(demoApp()).get('/api/auth/demo').expect(200);
    expect(dataOf<DemoAvailabilityDto>(on)).toEqual({ available: true });
  });

  it('refuses demo sign-ins when disabled', async () => {
    await request(createAuthTestApp())
      .post('/api/auth/demo')
      .set('Origin', TEST_ORIGIN)
      .expect(404);
  });

  it('refuses demo sign-ins from another website', async () => {
    await request(demoApp())
      .post('/api/auth/demo')
      .set('Origin', 'https://evil.example')
      .expect(403);
  });
});

describe.skipIf(!TEST_DATABASE_URI)('POST /api/auth/demo (database)', () => {
  useTestDatabase();

  it('creates the demo business on first use and signs in as its owner', async () => {
    const app = demoApp();
    const res = await startDemo(app).expect(200);

    const session = dataOf<AuthSessionDto>(res);
    expect(session.user).toMatchObject({ email: DEMO_OWNER_EMAIL, role: 'owner' });
    expect(session.business.name).toBe(DEMO_BUSINESS.name);
    expect(refreshCookieOf(res)?.value).toBeTruthy();

    const quotes = await request(app)
      .get('/api/quotes')
      .set('Authorization', bearer(session.accessToken))
      .expect(200);
    expect((quotes.body as { data: QuoteListItemDto[] }).data.length).toBeGreaterThan(0);
  });

  it('reuses the demo business while it is fresh and rebuilds it after a day', async () => {
    const clock = createTestClock();
    const app = demoApp({ clock: clock.now });

    const first = dataOf<AuthSessionDto>(await startDemo(app).expect(200));
    const again = dataOf<AuthSessionDto>(await startDemo(app).expect(200));
    expect(again.business.id).toBe(first.business.id);

    clock.advance(DAY_MS + 60_000);
    const rebuilt = dataOf<AuthSessionDto>(await startDemo(app).expect(200));
    expect(rebuilt.business.id).not.toBe(first.business.id);
    expect(await BusinessModel.exists({ _id: first.business.id })).toBeNull();
  });

  it('never touches real businesses when it rebuilds the demo', async () => {
    const clock = createTestClock();
    const app = demoApp({ clock: clock.now });
    const owner = await registerOwner(app);

    await startDemo(app).expect(200);
    clock.advance(DAY_MS + 60_000);
    await startDemo(app).expect(200);

    expect(await BusinessModel.exists({ _id: owner.session.business.id })).not.toBeNull();
  });
});
