import type { AuthSessionDto, DemoAvailabilityDto, QuoteListItemDto } from '@quoteflow/shared';
import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createSeedClock } from '../demo/clock';
import { DEMO_BUSINESS, DEMO_OWNER_EMAIL } from '../demo/data/business';
import { replaceDemoBusiness } from '../demo/demo';
import { removeDemoBusiness } from '../demo/reset';
import { BusinessModel, CustomerModel, QuoteModel, SessionModel, UserModel } from '../models';
import {
  bearer,
  createAuthTestApp,
  createTestClock,
  refresh,
  refreshCookieOf,
  registerOwner,
} from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { TEST_ORIGIN, createCapturingLogger, createTestEnv, dataOf } from '../test/helpers';

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

  it('signs a demo visitor out of their own session only, not every visitor', async () => {
    const app = demoApp();
    const first = await startDemo(app).expect(200);
    const second = await startDemo(app).expect(200);

    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', bearer(dataOf<AuthSessionDto>(first).accessToken))
      .expect(204);

    await refresh(app, refreshCookieOf(first)?.value ?? '').expect(401);
    await refresh(app, refreshCookieOf(second)?.value ?? '').expect(200);
  });

  it('cannot be claimed by a business editing its own settings', async () => {
    const app = demoApp();
    const owner = await registerOwner(app);

    await request(app)
      .patch('/api/business')
      .set('Authorization', bearer(owner.session.accessToken))
      .send({ name: 'Still Not The Demo', isDemo: true });

    const stored = await BusinessModel.findById(owner.session.business.id).lean();
    expect(stored?.isDemo).toBe(false);
  });

  it('replaces a demo built before the isDemo flag existed', async () => {
    const app = demoApp();
    const { tenant } = await replaceDemoBusiness(createSeedClock(), 'placeholder-hash');
    const legacyId = tenant.business._id;
    // As the demo builder stored it before the flag existed: no isDemo field at all.
    await BusinessModel.collection.updateOne({ _id: legacyId }, { $unset: { isDemo: '' } });

    const session = dataOf<AuthSessionDto>(await startDemo(app).expect(200));

    expect(session.business.id).not.toBe(legacyId.toString());
    expect(await BusinessModel.exists({ _id: legacyId })).toBeNull();
    expect(await QuoteModel.countDocuments({ businessId: legacyId })).toBe(0);
    expect(await BusinessModel.exists({ _id: session.business.id, isDemo: true })).not.toBeNull();
    const quotes = await request(app)
      .get('/api/quotes')
      .set('Authorization', bearer(session.accessToken))
      .expect(200);
    expect((quotes.body as { data: QuoteListItemDto[] }).data.length).toBeGreaterThan(0);
  });

  it('logs when a visitor gets a demo whose rebuild did not finish', async () => {
    const { logger, entries } = createCapturingLogger();
    const app = demoApp({ logger });
    await removeDemoBusiness();
    // What a rebuild running at the same moment on another instance would cause.
    const collision = vi
      .spyOn(CustomerModel, 'create')
      .mockRejectedValueOnce(
        new mongoose.mongo.MongoServerError({ message: 'E11000 duplicate key', code: 11000 }),
      );

    try {
      await startDemo(app).expect(200);
    } finally {
      collision.mockRestore();
    }

    const warnings = entries().filter((entry) => entry.level === 'warn');
    expect(warnings.map((entry) => entry.event)).toEqual([
      'demo.rebuild_collided',
      'demo.incomplete',
    ]);
  });

  it('replaces an account that took the demo email instead of signing visitors in to it', async () => {
    const app = demoApp();
    await removeDemoBusiness();
    // A business marked as not being the demo (as every sign-up is) holding the demo owner's email.
    const impostor = await BusinessModel.create({ name: 'Attacker Co', isDemo: false });
    await UserModel.create({
      businessId: impostor._id,
      name: 'Attacker',
      email: DEMO_OWNER_EMAIL,
      passwordHash: 'not-used-here',
      role: 'owner',
    });

    try {
      const res = await startDemo(app).expect(200);

      // The impostor is replaced by the real demo; nobody is ever signed in to it.
      const { business } = dataOf<AuthSessionDto>(res);
      expect(business.id).not.toBe(impostor.id);
      expect(await BusinessModel.exists({ _id: business.id, isDemo: true })).not.toBeNull();
      expect(await BusinessModel.exists({ _id: impostor._id })).toBeNull();
      expect(await SessionModel.countDocuments({ businessId: impostor._id })).toBe(0);
    } finally {
      await UserModel.deleteMany({ businessId: impostor._id });
    }
  });
});
