import type { AuthSessionDto, CurrentUserDto } from '@quoteflow/shared';
import { decodeJwt } from 'jose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { BusinessModel, SessionModel, UserModel } from '../models';
import { REFRESH_REUSE_GRACE_MS } from '../services/session.service';
import {
  TEST_PASSWORD,
  addUser,
  bearer,
  createAuthTestApp,
  createTestClock,
  login,
  refresh,
  refreshCookieHeader,
  refreshCookieOf,
  registerOwner,
  registrationInput,
  uniqueEmail,
} from '../test/auth';
import { TEST_DATABASE_URI, supportsAtomicIncrements, useTestDatabase } from '../test/database';
import { TEST_ORIGIN, createCapturingLogger, dataOf, errorOf } from '../test/helpers';
import { hashToken } from '../utils/tokens';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const SESSION_EXPIRED = {
  code: 'UNAUTHORIZED',
  message: 'Your session has expired. Please sign in again.',
};

async function sessionOf(refreshToken: string) {
  return SessionModel.findOne(
    {
      $or: [{ tokenHash: hashToken(refreshToken) }, { previousTokenHash: hashToken(refreshToken) }],
    },
    null,
    { skipTenantGuard: true },
  );
}

describe.skipIf(!TEST_DATABASE_URI)('auth routes (database)', () => {
  useTestDatabase();

  describe('POST /api/auth/register', () => {
    it('creates the business and its owner and signs the owner in', async () => {
      const app = createAuthTestApp();
      const input = registrationInput({
        email: uniqueEmail('Amina').toUpperCase(),
        currency: 'NGN',
        timezone: 'Africa/Lagos',
      });

      const res = await request(app).post('/api/auth/register').send(input);

      expect(res.status).toBe(201);
      expect(res.headers['cache-control']).toBe('no-store');
      const session = dataOf<AuthSessionDto>(res);
      const email = input.email.toLowerCase();
      expect(Object.keys(session).sort()).toEqual([
        'accessToken',
        'accessTokenExpiresAt',
        'business',
        'user',
      ]);
      const { id, createdAt, ...user } = session.user;
      expect(user).toEqual({ name: 'Amina Yusuf', email, role: 'owner' });
      expect(id).toMatch(/^[a-f\d]{24}$/);
      expect(new Date(createdAt).toISOString()).toBe(createdAt);
      expect(session.business).toMatchObject({
        name: 'Sparkle Cleaning Co.',
        // Customers see the business email, so the sign-in email is not published by default.
        email: null,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        address: {},
      });
      expect(Date.parse(session.accessTokenExpiresAt)).toBe(
        (decodeJwt(session.accessToken).exp ?? 0) * 1000,
      );
      expect(decodeJwt(session.accessToken)).toMatchObject({
        sub: session.user.id,
        bid: session.business.id,
        role: 'owner',
      });

      const { value: refreshToken = '', ...cookie } = refreshCookieOf(res) ?? {
        name: '',
        value: '',
      };
      expect(cookie).toEqual({
        name: 'qf_refresh',
        maxAge: THIRTY_DAYS_SECONDS,
        path: '/api/auth',
        httpOnly: true,
        sameSite: 'strict',
      });
      expect(refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(JSON.stringify(res.body)).not.toContain(refreshToken);
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenHash|\$2b\$/);

      // Only a hash of the refresh token is stored.
      const stored = await SessionModel.findOne({
        businessId: session.business.id,
        userId: session.user.id,
      });
      expect(stored?.tokenHash).toBe(hashToken(refreshToken));
      expect(stored?.id).toBe(decodeJwt(session.accessToken).sid);
      expect(
        await SessionModel.countDocuments({
          businessId: session.business.id,
          tokenHash: refreshToken,
        }),
      ).toBe(0);
      const owner = await UserModel.findOne(
        { _id: session.user.id, businessId: session.business.id },
        '+passwordHash',
      );
      expect(owner?.passwordHash).toMatch(/^\$2b\$12\$/);
      expect(owner?.lastLoginAt).toBeInstanceOf(Date);
    });

    it('applies the business defaults when no currency or time zone is given', async () => {
      const { session } = await registerOwner(createAuthTestApp(), { timezone: 'Mars/Olympus' });

      expect(session.business).toMatchObject({ currency: 'USD', timezone: 'UTC' });
    });

    it('rejects an email that is already registered, whatever its case, with 409', async () => {
      const app = createAuthTestApp();
      const { input } = await registerOwner(app);
      const businessesBefore = await BusinessModel.countDocuments();

      for (const email of [input.email, input.email.toUpperCase()]) {
        const res = await request(app)
          .post('/api/auth/register')
          .send(registrationInput({ email, businessName: 'Copycat Ltd' }));

        expect(res.status).toBe(409);
        expect(errorOf(res)).toMatchObject({
          code: 'CONFLICT',
          details: [{ path: 'email', message: 'An account with this email already exists' }],
        });
        expect(refreshCookieOf(res)).toBeUndefined();
      }
      expect(await BusinessModel.countDocuments()).toBe(businessesBefore);
    });

    it('creates exactly one account when the same email registers twice at once', async () => {
      const app = createAuthTestApp();
      const input = registrationInput({ businessName: `Twin Sign-ups ${uniqueEmail()}` });

      const results = await Promise.all(
        [1, 2].map(() => request(app).post('/api/auth/register').send(input)),
      );

      expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
      expect(await BusinessModel.countDocuments({ name: input.businessName })).toBe(1);
    });

    it('reserves the demo email domain', async () => {
      const app = createAuthTestApp();
      const businessesBefore = await BusinessModel.countDocuments();

      for (const email of ['demo@quoteflow.test', ' Staff@QuoteFlow.test ', 'x@quoteflow.test']) {
        const res = await request(app)
          .post('/api/auth/register')
          .send(registrationInput({ email }));

        expect(res.status).toBe(400);
        expect(errorOf(res).details).toEqual([
          { path: 'email', message: 'This email address is reserved' },
        ]);
      }
      expect(await BusinessModel.countDocuments()).toBe(businessesBefore);
    });

    it('reports every invalid field', async () => {
      const res = await request(createAuthTestApp())
        .post('/api/auth/register')
        .send({ name: ' ', businessName: '', email: 'nope', password: 'short', currency: 'XYZ' });

      expect(res.status).toBe(400);
      expect(
        errorOf(res)
          .details?.map((detail) => detail.path)
          .sort(),
      ).toEqual(['businessName', 'currency', 'email', 'name', 'password']);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user and business for a valid access token', async () => {
      const app = createAuthTestApp();
      const { session } = await registerOwner(app);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', bearer(session.accessToken));

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(dataOf<CurrentUserDto>(res)).toEqual({
        user: session.user,
        business: session.business,
      });
    });

    it('rejects a missing, invalid or expired access token with 401', async () => {
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now });
      const { session } = await registerOwner(app);

      const missing = await request(app).get('/api/auth/me');
      expect(missing.status).toBe(401);
      expect(missing.headers['www-authenticate']).toBe('Bearer');

      clock.advance(15 * 60 * 1000);
      const expired = await request(app)
        .get('/api/auth/me')
        .set('Authorization', bearer(session.accessToken));
      expect(expired.status).toBe(401);
      expect(expired.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
      expect(errorOf(expired)).toMatchObject(SESSION_EXPIRED);
    });

    it('rejects a valid token whose user no longer exists', async () => {
      const app = createAuthTestApp();
      const { session } = await registerOwner(app);
      await UserModel.deleteOne({ _id: session.user.id, businessId: session.business.id });

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', bearer(session.accessToken))
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates the refresh token; the old one stops working', async () => {
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now });
      const { session, refreshToken } = await registerOwner(app);
      clock.advance(60_000);

      const res = await refresh(app, refreshToken);

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      const rotated = dataOf<AuthSessionDto>(res);
      expect(rotated).toMatchObject({ user: session.user, business: session.business });
      expect(rotated.accessToken).not.toBe(session.accessToken);
      expect(decodeJwt(rotated.accessToken).sid).toBe(decodeJwt(session.accessToken).sid);
      const cookie = refreshCookieOf(res);
      expect(cookie).toMatchObject({
        maxAge: THIRTY_DAYS_SECONDS,
        path: '/api/auth',
        httpOnly: true,
      });
      expect(cookie?.value).not.toBe(refreshToken);

      const stale = await refresh(app, refreshToken);
      expect(stale.status).toBe(401);
      expect(errorOf(stale)).toMatchObject(SESSION_EXPIRED);
      expect(refreshCookieOf(stale)).toBeUndefined();

      await refresh(app, cookie?.value ?? '').expect(200);
    });

    it('slides the session expiry forward on every refresh', async () => {
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now });
      const { refreshToken } = await registerOwner(app);
      const before = (await sessionOf(refreshToken))?.expiresAt.getTime() ?? 0;
      clock.advance(24 * 60 * 60 * 1000);

      const next = refreshCookieOf(await refresh(app, refreshToken).expect(200))?.value ?? '';

      const stored = await sessionOf(next);
      expect(stored?.expiresAt.getTime()).toBe(before + 24 * 60 * 60 * 1000);
      expect(stored?.lastUsedAt.getTime()).toBe(clock.now().getTime());
    });

    it('revokes the session when a rotated token is replayed after the grace window', async () => {
      const { logger, entries } = createCapturingLogger();
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now, logger });
      const { session, refreshToken: stolen } = await registerOwner(app);
      const current = refreshCookieOf(await refresh(app, stolen).expect(200))?.value ?? '';
      clock.advance(REFRESH_REUSE_GRACE_MS + 1_000);

      const replay = await refresh(app, stolen);

      expect(replay.status).toBe(401);
      expect(await sessionOf(current)).toMatchObject({ revokedReason: 'reuse_detected' });
      // The legitimate holder's newer token is dead too: the session is gone.
      await refresh(app, current).expect(401);

      const sessionId = decodeJwt(session.accessToken).sid;
      expect(entries()).toContainEqual(
        expect.objectContaining({
          level: 'warn',
          event: 'auth.refresh_token_reused',
          sessionId,
          userId: session.user.id,
        }),
      );
      const output = JSON.stringify(entries());
      expect(output).not.toContain(stolen);
      expect(output).not.toContain(current);
    });

    it('rejects a just-rotated token inside the grace window without revoking the session', async () => {
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now });
      const { refreshToken } = await registerOwner(app);
      const current = refreshCookieOf(await refresh(app, refreshToken).expect(200))?.value ?? '';
      clock.advance(REFRESH_REUSE_GRACE_MS - 1_000);

      const racingTab = await refresh(app, refreshToken);

      expect(racingTab.status).toBe(401);
      expect(refreshCookieOf(racingTab)).toBeUndefined();
      expect(await sessionOf(current)).toMatchObject({ revokedAt: null });
      await refresh(app, current).expect(200);
    });

    it('lets only one of two concurrent refreshes with the same token succeed', async (context) => {
      context.skip(
        !(await supportsAtomicIncrements()),
        'This MongoDB stand-in does not apply concurrent updates to one document atomically; run against MongoDB to cover this.',
      );
      const app = createAuthTestApp();
      const { refreshToken } = await registerOwner(app);

      const results = await Promise.all([refresh(app, refreshToken), refresh(app, refreshToken)]);

      expect(results.map((res) => res.status).sort()).toEqual([200, 401]);
      const winner = results.find((res) => res.status === 200);
      expect(
        await sessionOf(refreshCookieOf(winner ?? { headers: {} })?.value ?? ''),
      ).toMatchObject({
        revokedAt: null,
      });
    });

    it('signs the new access token with the role the user has now', async () => {
      const app = createAuthTestApp();
      const { session, refreshToken } = await registerOwner(app);
      await UserModel.updateOne(
        { _id: session.user.id, businessId: session.business.id },
        { $set: { role: 'staff' } },
      );

      const res = await refresh(app, refreshToken).expect(200);

      const refreshed = dataOf<AuthSessionDto>(res);
      expect(refreshed.user.role).toBe('staff');
      expect(decodeJwt(refreshed.accessToken).role).toBe('staff');
      await request(app)
        .patch('/api/business')
        .set('Authorization', bearer(refreshed.accessToken))
        .send({ name: 'Renamed' })
        .expect(403);
    });

    it('revokes the session of a user who no longer exists', async () => {
      const app = createAuthTestApp();
      const { session, refreshToken } = await registerOwner(app);
      await UserModel.deleteOne({ _id: session.user.id, businessId: session.business.id });

      await refresh(app, refreshToken).expect(401);

      expect(await sessionOf(refreshToken)).toMatchObject({ revokedReason: 'account_removed' });
    });

    it.each([
      ['no cookie', undefined],
      ['an empty cookie', ''],
      ['a malformed token', 'not-a-token'],
      ['an unknown token', 'A'.repeat(43)],
    ])('rejects %s with 401', async (_label, token) => {
      const req = request(createAuthTestApp()).post('/api/auth/refresh');
      const res = await (token === undefined ? req : req.set('Cookie', refreshCookieHeader(token)));

      expect(res.status).toBe(401);
      expect(errorOf(res)).toMatchObject(SESSION_EXPIRED);
    });

    it('rejects an expired session', async () => {
      const clock = createTestClock();
      const app = createAuthTestApp({ clock: clock.now });
      const { refreshToken } = await registerOwner(app);
      clock.advance(THIRTY_DAYS_SECONDS * 1000 + 1_000);

      await refresh(app, refreshToken).expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the session and clears the cookie', async () => {
      const app = createAuthTestApp();
      const { refreshToken } = await registerOwner(app);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshCookieHeader(refreshToken));

      expect(res.status).toBe(204);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(refreshCookieOf(res)).toEqual({
        name: 'qf_refresh',
        value: '',
        maxAge: 0,
        expires: new Date(0),
        path: '/api/auth',
        httpOnly: true,
        sameSite: 'strict',
      });
      expect(await sessionOf(refreshToken)).toMatchObject({ revokedReason: 'logout' });
      await refresh(app, refreshToken).expect(401);
    });

    it('ends access at once, not when the access token expires', async () => {
      const app = createAuthTestApp();
      const { refreshToken, session } = await registerOwner(app);
      const me = () =>
        request(app).get('/api/auth/me').set('Authorization', bearer(session.accessToken));
      await me().expect(200);

      await request(app)
        .post('/api/auth/logout')
        .set('Cookie', refreshCookieHeader(refreshToken))
        .expect(204);

      const res = await me().expect(401);
      expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    });

    it.each([
      ['no cookie', undefined],
      ['an unknown token', 'A'.repeat(43)],
      ['garbage', 'garbage'],
    ])('answers 204 and clears the cookie for %s', async (_label, token) => {
      const req = request(createAuthTestApp()).post('/api/auth/logout');
      const res = await (token === undefined ? req : req.set('Cookie', refreshCookieHeader(token)));

      expect(res.status).toBe(204);
      expect(refreshCookieOf(res)).toMatchObject({ value: '', maxAge: 0 });
    });

    it('is idempotent', async () => {
      const app = createAuthTestApp();
      const { refreshToken } = await registerOwner(app);
      const logout = () =>
        request(app).post('/api/auth/logout').set('Cookie', refreshCookieHeader(refreshToken));

      await logout().expect(204);
      await logout().expect(204);
    });
  });

  describe('POST /api/auth/login', () => {
    it('signs in with the right password, whatever the email case', async () => {
      const app = createAuthTestApp();
      const { input, session } = await registerOwner(app);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `  ${input.email.toUpperCase()} `, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.headers['cache-control']).toBe('no-store');
      const signedIn = dataOf<AuthSessionDto>(res);
      expect(signedIn).toMatchObject({ user: session.user, business: session.business });
      // A new, independent session.
      expect(decodeJwt(signedIn.accessToken).sid).not.toBe(decodeJwt(session.accessToken).sid);
      expect(refreshCookieOf(res)).toMatchObject({ httpOnly: true, path: '/api/auth' });
    });

    it('gives the same 401 for a wrong password and an unknown email', async () => {
      const { logger, entries } = createCapturingLogger();
      const app = createAuthTestApp({ logger });
      const { input } = await registerOwner(app);
      const unknownEmail = uniqueEmail('nobody');

      const wrongPassword = await request(app)
        .post('/api/auth/login')
        .send({ email: input.email, password: 'not the password' });
      const unknown = await request(app)
        .post('/api/auth/login')
        .send({ email: unknownEmail, password: TEST_PASSWORD });

      for (const res of [wrongPassword, unknown]) {
        expect(res.status).toBe(401);
        expect(errorOf(res)).toEqual({
          code: 'UNAUTHORIZED',
          message: 'Incorrect email or password.',
          requestId: res.headers['x-request-id'],
        });
        expect(refreshCookieOf(res)).toBeUndefined();
        expect(res.headers).not.toHaveProperty('www-authenticate');
      }

      const failures = entries().filter((entry) => entry.event === 'auth.login_failed');
      expect(failures).toEqual([
        expect.objectContaining({ level: 'warn', reason: 'wrong_password' }),
        expect.objectContaining({ level: 'warn', reason: 'unknown_email' }),
      ]);
      const output = JSON.stringify(entries());
      for (const secret of [input.email, unknownEmail, 'not the password', TEST_PASSWORD]) {
        expect(output).not.toContain(secret);
      }
    });

    it('rate-limits repeated failures for one account', async () => {
      const app = createAuthTestApp({
        authRateLimits: { loginAccount: { windowMs: 60_000, limit: 3 } },
      });
      const { input } = await registerOwner(app);
      const attempt = (password: string) =>
        request(app).post('/api/auth/login').send({ email: input.email, password });

      for (let index = 0; index < 3; index += 1) await attempt('wrong password').expect(401);
      const limited = await attempt(TEST_PASSWORD);

      expect(limited.status).toBe(429);
      expect(errorOf(limited).code).toBe('RATE_LIMITED');
      expect(limited.headers['retry-after']).toBeDefined();
    });

    it('counts failed sign-ins across API instances', async () => {
      const authRateLimits = { loginAccount: { windowMs: 60_000, limit: 2 } };
      const [first, second] = [1, 2].map(() => createAuthTestApp({ authRateLimits }));
      if (!first || !second) throw new Error('expected two app instances');
      const email = uniqueEmail('shared');
      const attempt = (app: typeof first) =>
        request(app).post('/api/auth/login').send({ email, password: 'wrong' });

      await attempt(first).expect(401);
      await attempt(second).expect(401);
      await attempt(first).expect(429);
      await attempt(second).expect(429);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('revokes every session of the user and clears the cookie', async () => {
      const app = createAuthTestApp();
      const first = await registerOwner(app);
      const second = await login(app, first.input.email);
      const colleague = await addUser(app, first.session.business.id, 'staff');

      const res = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', bearer(second.session.accessToken));

      expect(res.status).toBe(204);
      expect(refreshCookieOf(res)).toMatchObject({ value: '', maxAge: 0, path: '/api/auth' });
      await refresh(app, first.refreshToken).expect(401);
      await refresh(app, second.refreshToken).expect(401);
      expect(await sessionOf(first.refreshToken)).toMatchObject({ revokedReason: 'logout_all' });
      const me = (accessToken: string) =>
        request(app).get('/api/auth/me').set('Authorization', bearer(accessToken));
      await me(first.session.accessToken).expect(401);
      // Other users of the business are not affected.
      await me(colleague.session.accessToken).expect(200);
      await refresh(app, colleague.refreshToken).expect(200);
    });

    it('requires an access token', async () => {
      const res = await request(createAuthTestApp()).post('/api/auth/logout-all');

      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toBe('Bearer');
    });
  });

  describe('cross-site protection of the cookie endpoints', () => {
    it.each(['/api/auth/refresh', '/api/auth/logout'])(
      'rejects %s from a disallowed origin with 403 and leaves the session alone',
      async (path) => {
        const app = createAuthTestApp();
        const { refreshToken } = await registerOwner(app);

        for (const headers of [
          { Origin: 'https://evil.example' },
          { 'Sec-Fetch-Site': 'cross-site' },
        ]) {
          const res = await request(app)
            .post(path)
            .set('Cookie', refreshCookieHeader(refreshToken))
            .set(headers);
          expect(res.status).toBe(403);
          expect(errorOf(res).code).toBe('FORBIDDEN');
          expect(refreshCookieOf(res)).toBeUndefined();
        }

        expect(await sessionOf(refreshToken)).toMatchObject({ revokedAt: null });
        await refresh(app, refreshToken).set('Origin', TEST_ORIGIN).expect(200);
      },
    );
  });

  it('never logs tokens, cookies, passwords or emails', async () => {
    const { logger, entries } = createCapturingLogger();
    const app = createAuthTestApp({ logger });

    const { input, refreshToken, session } = await registerOwner(app);
    await request(app).post('/api/auth/login').send({ email: input.email, password: 'wrong' });
    const signedIn = await login(app, input.email);
    const rotated =
      refreshCookieOf(await refresh(app, signedIn.refreshToken).expect(200))?.value ?? '';
    await request(app).get('/api/auth/me').set('Authorization', bearer(session.accessToken));
    await request(app).post('/api/auth/logout').set('Cookie', refreshCookieHeader(rotated));
    await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', bearer(session.accessToken));

    const events = entries()
      .map((entry) => entry.event)
      .filter(Boolean);
    expect(events).toEqual([
      'auth.registered',
      'auth.login_failed',
      'auth.login',
      'auth.logout',
      'auth.logout_all',
    ]);
    const output = JSON.stringify(entries());
    for (const secret of [
      input.email,
      TEST_PASSWORD,
      refreshToken,
      signedIn.refreshToken,
      rotated,
      session.accessToken,
      signedIn.session.accessToken,
    ]) {
      expect(output).not.toContain(secret);
    }
    expect(output).not.toContain('qf_refresh');
  });
});
