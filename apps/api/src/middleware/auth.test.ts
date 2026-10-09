import { Router } from 'express';
import { Types } from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { type AuthContext, createAccessTokenService } from '../services/access-token.service';
import { createTestClock } from '../test/auth';
import { createRouterTestApp, dataOf, errorOf } from '../test/helpers';
import { systemClock } from '../utils/clock';
import { sendData } from '../utils/response';
import { authOf, createRequireAuth, requireRole } from './auth';

const SECRET = 'test-only-jwt-secret-that-is-long-enough-123';

const owner: AuthContext = {
  userId: new Types.ObjectId().toString(),
  businessId: new Types.ObjectId().toString(),
  role: 'owner',
  sessionId: new Types.ObjectId().toString(),
};
const staff: AuthContext = { ...owner, role: 'staff' };

function setup() {
  const clock = createTestClock();
  const tokens = createAccessTokenService({ secret: SECRET, ttlSeconds: 60, clock: clock.now });
  const revokedSessions = new Set<string>();
  const requireAuth = createRequireAuth(tokens, {
    isActive: ({ sessionId }) => Promise.resolve(!revokedSessions.has(sessionId)),
  });

  const router = Router();
  router.get('/me', requireAuth, (req, res) => {
    sendData(res, authOf(req));
  });
  router.post('/owner-only', requireAuth, requireRole('owner'), (_req, res) => {
    sendData(res, { ok: true });
  });
  router.post('/any-role', requireAuth, requireRole('owner', 'staff'), (_req, res) => {
    sendData(res, { ok: true });
  });
  router.post('/unauthenticated-role-check', requireRole('owner'), (_req, res) => {
    sendData(res, { ok: true });
  });
  return { app: createRouterTestApp(router), tokens, clock, revokedSessions };
}

describe('requireAuth', () => {
  it('sets req.auth from a valid bearer token', async () => {
    const { app, tokens } = setup();
    const { token } = await tokens.issue(owner);

    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(dataOf(res)).toEqual(owner);
  });

  it('accepts the scheme in any case', async () => {
    const { app, tokens } = setup();
    const { token } = await tokens.issue(owner);

    await request(app).get('/me').set('Authorization', `bearer ${token}`).expect(200);
  });

  it.each([
    ['no Authorization header', undefined],
    ['another scheme', 'Basic dXNlcjpwYXNz'],
    ['an empty bearer token', 'Bearer '],
  ])('responds 401 with WWW-Authenticate: Bearer for %s', async (_label, header) => {
    const { app } = setup();
    const req = request(app).get('/me');
    const res = await (header === undefined ? req : req.set('Authorization', header));

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
    expect(errorOf(res)).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    });
  });

  it('responds 401 with error="invalid_token" for a forged or expired token', async () => {
    const { app, tokens, clock } = setup();
    const other = createAccessTokenService({
      secret: 'another-secret-that-is-also-long-enough-456',
      ttlSeconds: 60,
      clock: systemClock,
    });
    const { token: forged } = await other.issue(owner);
    const { token } = await tokens.issue(owner);
    clock.advance(61_000);

    for (const candidate of [forged, token, 'garbage']) {
      const res = await request(app).get('/me').set('Authorization', `Bearer ${candidate}`);
      expect(res.status).toBe(401);
      expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
      expect(errorOf(res)).toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Your session has expired. Please sign in again.',
      });
    }
  });

  it('responds 401 with error="invalid_token" once the session is revoked', async () => {
    const { app, tokens, revokedSessions } = setup();
    const { token } = await tokens.issue(owner);
    await request(app).get('/me').set('Authorization', `Bearer ${token}`).expect(200);

    revokedSessions.add(owner.sessionId);
    const res = await request(app).get('/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    expect(errorOf(res).message).toBe('Your session has expired. Please sign in again.');
  });

  it('never authenticates from cookies', async () => {
    const { app, tokens } = setup();
    const { token } = await tokens.issue(owner);

    await request(app).get('/me').set('Cookie', `qf_refresh=${token}`).expect(401);
  });
});

describe('requireRole', () => {
  it('lets allowed roles through and answers 403 FORBIDDEN to others', async () => {
    const { app, tokens } = setup();
    const ownerToken = (await tokens.issue(owner)).token;
    const staffToken = (await tokens.issue(staff)).token;

    await request(app).post('/owner-only').set('Authorization', `Bearer ${ownerToken}`).expect(200);
    await request(app).post('/any-role').set('Authorization', `Bearer ${staffToken}`).expect(200);

    const res = await request(app).post('/owner-only').set('Authorization', `Bearer ${staffToken}`);
    expect(res.status).toBe(403);
    expect(errorOf(res).code).toBe('FORBIDDEN');
  });

  it('fails loudly (500) when used without requireAuth', async () => {
    const { app } = setup();

    const res = await request(app).post('/unauthenticated-role-check');

    expect(res.status).toBe(500);
    expect(errorOf(res).code).toBe('INTERNAL_ERROR');
  });
});
