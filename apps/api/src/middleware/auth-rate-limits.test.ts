import { Router } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRouterTestApp, createSilentLogger, errorOf } from '../test/helpers';
import { unauthorized } from '../utils/app-error';
import { AUTH_RATE_LIMITS, createAuthRateLimiters } from './auth-rate-limits';

const WINDOW_MS = 60_000;

/** A sign-in route that succeeds only for the password "right". */
function signInApp(limits: Parameters<typeof createAuthRateLimiters>[0]) {
  const limiters = createAuthRateLimiters(limits, createSilentLogger());
  const router = Router();
  router.post('/login', limiters.login, limiters.loginAccount, limiters.loginEmail, (req, res) => {
    const { password } = req.body as { password?: string };
    if (password !== 'right') throw unauthorized('Incorrect email or password.');
    res.status(200).json({ data: {} });
  });
  router.post(
    '/password',
    (req, _res, next) => {
      req.auth = {
        userId: String(req.get('x-user')),
        businessId: new Types.ObjectId().toString(),
        role: 'owner',
        sessionId: new Types.ObjectId().toString(),
      };
      next();
    },
    limiters.changePassword,
    (_req, res) => {
      res.status(204).end();
    },
  );
  const app = createRouterTestApp(router);
  // Lets each request name its client address in X-Forwarded-For.
  app.set('trust proxy', 1);
  return app;
}

const attempt = (
  app: ReturnType<typeof signInApp>,
  email: string,
  password = 'wrong',
  ip = '203.0.113.1',
) => request(app).post('/login').set('X-Forwarded-For', ip).send({ email, password });

describe('auth rate limiters', () => {
  it('uses the documented defaults', () => {
    expect(AUTH_RATE_LIMITS).toEqual({
      login: { windowMs: 15 * 60_000, limit: 30 },
      loginAccount: { windowMs: 15 * 60_000, limit: 10 },
      loginEmail: { windowMs: 60 * 60_000, limit: 50 },
      register: { windowMs: 60 * 60_000, limit: 10 },
      refresh: { windowMs: 15 * 60_000, limit: 120 },
      changePassword: { windowMs: 15 * 60_000, limit: 10 },
      demo: { windowMs: 15 * 60_000, limit: 20 },
    });
  });

  it('limits failed sign-ins per IP and normalised email', async () => {
    const app = signInApp({ loginAccount: { windowMs: WINDOW_MS, limit: 2 } });

    await attempt(app, 'amina@example.com').expect(401);
    await attempt(app, '  AMINA@example.com ').expect(401);
    const limited = await attempt(app, 'amina@example.com', 'right');

    expect(limited.status).toBe(429);
    expect(errorOf(limited)).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
    });
    // Another account from the same address is not affected.
    await attempt(app, 'luis@example.com').expect(401);
  });

  it('does not count successful sign-ins', async () => {
    const app = signInApp({ loginAccount: { windowMs: WINDOW_MS, limit: 1 } });

    for (let index = 0; index < 3; index += 1) {
      await attempt(app, 'amina@example.com', 'right').expect(200);
    }
    await attempt(app, 'amina@example.com').expect(401);
    await attempt(app, 'amina@example.com').expect(429);
  });

  it('limits failed sign-ins per email across IP addresses', async () => {
    const app = signInApp({ loginEmail: { windowMs: WINDOW_MS, limit: 3 } });

    for (const ip of ['203.0.113.1', '203.0.113.2', '198.51.100.7']) {
      await attempt(app, 'amina@example.com', 'wrong', ip).expect(401);
    }
    // Even the right password from a new address waits until the window ends.
    await attempt(app, 'AMINA@example.com', 'right', '192.0.2.44').expect(429);
    await attempt(app, 'luis@example.com', 'right', '192.0.2.44').expect(200);
  });

  it('limits failed sign-ins per IP across emails', async () => {
    const app = signInApp({ login: { windowMs: WINDOW_MS, limit: 2 } });

    await attempt(app, 'a@example.com').expect(401);
    await attempt(app, 'b@example.com').expect(401);
    await attempt(app, 'c@example.com').expect(429);
  });

  it('limits password changes per user', async () => {
    const app = signInApp({ changePassword: { windowMs: WINDOW_MS, limit: 1 } });
    const change = (userId: string) => request(app).post('/password').set('X-User', userId);

    await change('user-a').expect(204);
    await change('user-a').expect(429);
    await change('user-b').expect(204);
  });

  it('can be switched off', async () => {
    const app = signInApp(false);
    for (let index = 0; index < 15; index += 1) {
      await attempt(app, 'amina@example.com').expect(401);
    }
  });
});
