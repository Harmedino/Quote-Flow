import type { UserDto } from '@quoteflow/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { SessionModel, UserModel } from '../models';
import {
  TEST_PASSWORD,
  bearer,
  createAuthTestApp,
  login,
  refresh,
  registerOwner,
} from '../test/auth';
import { TEST_DATABASE_URI, useTestDatabase } from '../test/database';
import { createCapturingLogger, dataOf, errorOf } from '../test/helpers';

const NEW_PASSWORD = 'a brand new passphrase';

describe.skipIf(!TEST_DATABASE_URI)('account routes (database)', () => {
  useTestDatabase();

  describe('PATCH /api/account', () => {
    it('renames the signed-in user', async () => {
      const app = createAuthTestApp();
      const { session } = await registerOwner(app);

      const res = await request(app)
        .patch('/api/account')
        .set('Authorization', bearer(session.accessToken))
        .send({ name: '  Amina Bello ', role: 'owner', email: 'hijack@example.com' });

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(dataOf<UserDto>(res)).toEqual({ ...session.user, name: 'Amina Bello' });
      const stored = await UserModel.findOne({
        _id: session.user.id,
        businessId: session.business.id,
      });
      expect(stored).toMatchObject({ name: 'Amina Bello', email: session.user.email });
    });

    it('rejects an empty name', async () => {
      const app = createAuthTestApp();
      const { session } = await registerOwner(app);

      const res = await request(app)
        .patch('/api/account')
        .set('Authorization', bearer(session.accessToken))
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(errorOf(res).details).toEqual([{ path: 'name', message: 'Name is required' }]);
    });

    it('requires an access token', async () => {
      const res = await request(createAuthTestApp()).patch('/api/account').send({ name: 'X' });

      expect(res.status).toBe(401);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('PUT /api/account/password', () => {
    it('rejects a wrong current password as a field error', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createAuthTestApp({ logger });
      const { session } = await registerOwner(app);

      const res = await request(app)
        .put('/api/account/password')
        .set('Authorization', bearer(session.accessToken))
        .send({ currentPassword: 'not my password', newPassword: NEW_PASSWORD });

      expect(res.status).toBe(400);
      expect(errorOf(res)).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: [{ path: 'currentPassword', message: 'Your current password is incorrect' }],
      });
      await login(app, session.user.email, TEST_PASSWORD);
      expect(entries()).toContainEqual(
        expect.objectContaining({ level: 'warn', event: 'auth.password_change_failed' }),
      );
      expect(JSON.stringify(entries())).not.toContain('not my password');
    });

    it.each([
      [
        'the same password',
        { currentPassword: TEST_PASSWORD, newPassword: TEST_PASSWORD },
        'newPassword',
      ],
      ['a short password', { currentPassword: TEST_PASSWORD, newPassword: 'short' }, 'newPassword'],
      [
        'no current password',
        { currentPassword: '', newPassword: NEW_PASSWORD },
        'currentPassword',
      ],
    ])('rejects %s', async (_label, body, path) => {
      const app = createAuthTestApp();
      const { session } = await registerOwner(app);

      const res = await request(app)
        .put('/api/account/password')
        .set('Authorization', bearer(session.accessToken))
        .send(body);

      expect(res.status).toBe(400);
      expect(errorOf(res).details?.map((detail) => detail.path)).toEqual([path]);
    });

    it('changes the password and signs out every other session', async () => {
      const app = createAuthTestApp();
      const current = await registerOwner(app);
      const otherDevice = await login(app, current.input.email);

      const res = await request(app)
        .put('/api/account/password')
        .set('Authorization', bearer(current.session.accessToken))
        .send({ currentPassword: TEST_PASSWORD, newPassword: NEW_PASSWORD });

      expect(res.status).toBe(204);
      expect(res.headers['cache-control']).toBe('no-store');
      await refresh(app, current.refreshToken).expect(200);
      await refresh(app, otherDevice.refreshToken).expect(401);
      expect(
        await SessionModel.countDocuments({
          businessId: current.session.business.id,
          revokedReason: 'password_changed',
        }),
      ).toBe(1);

      await request(app)
        .post('/api/auth/login')
        .send({ email: current.input.email, password: TEST_PASSWORD })
        .expect(401);
      await login(app, current.input.email, NEW_PASSWORD);
    });

    it('rate-limits attempts per user', async () => {
      const app = createAuthTestApp({
        authRateLimits: { changePassword: { windowMs: 60_000, limit: 1 } },
      });
      const { session } = await registerOwner(app);
      const attempt = () =>
        request(app)
          .put('/api/account/password')
          .set('Authorization', bearer(session.accessToken))
          .send({ currentPassword: 'wrong guess', newPassword: NEW_PASSWORD });

      await attempt().expect(400);
      const limited = await attempt();

      expect(limited.status).toBe(429);
      expect(errorOf(limited).code).toBe('RATE_LIMITED');
    });
  });
});
