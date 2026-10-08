import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { isTenantGuarded } from './plugins/tenant-guard';
import { SESSION_USER_AGENT_MAX_LENGTH, SessionModel } from './session.model';

function sessionInput(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    businessId: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    tokenHash: 'hash-of-the-current-token',
    lastUsedAt: now,
    expiresAt: new Date(now.getTime() + 60_000),
    ...overrides,
  };
}

describe('SessionModel', () => {
  it('starts active and unrotated', async () => {
    const session = new SessionModel(sessionInput());

    expect(await validationErrorsOf(session)).toEqual({});
    expect(session).toMatchObject({
      previousTokenHash: null,
      rotatedAt: null,
      revokedAt: null,
      revokedReason: null,
    });
  });

  it.each([
    ['businessId', { businessId: undefined }],
    ['userId', { userId: undefined }],
    ['tokenHash', { tokenHash: undefined }],
    ['lastUsedAt', { lastUsedAt: undefined }],
    ['expiresAt', { expiresAt: undefined }],
    ['revokedReason', { revokedReason: 'expired' }],
  ])('rejects a missing or invalid %s', async (path, overrides) => {
    expect(await validationErrorsOf(new SessionModel(sessionInput(overrides)))).toHaveProperty([
      path,
    ]);
  });

  it.each(['logout', 'logout_all', 'password_changed', 'reuse_detected', 'account_removed'])(
    'accepts the revocation reason %s',
    async (revokedReason) => {
      const session = new SessionModel(sessionInput({ revokedAt: new Date(), revokedReason }));
      expect(await validationErrorsOf(session)).toEqual({});
    },
  );

  it('truncates the user agent', async () => {
    const session = new SessionModel(sessionInput({ userAgent: 'Mozilla/5.0 '.repeat(100) }));

    expect(session.userAgent).toHaveLength(SESSION_USER_AGENT_MAX_LENGTH);
    expect(await validationErrorsOf(session)).toEqual({});
  });

  it('never serialises token hashes', () => {
    const session = new SessionModel(sessionInput({ previousTokenHash: 'hash-of-the-old-token' }));

    for (const output of [session.toJSON(), session.toObject()]) {
      expect(output).not.toHaveProperty('tokenHash');
      expect(output).not.toHaveProperty('previousTokenHash');
    }
  });

  it('is tenant-guarded and indexed for token lookups, revocation and expiry', () => {
    expect(isTenantGuarded(SessionModel.schema)).toBe(true);
    expect(SessionModel.schema.indexes()).toEqual(
      expect.arrayContaining([
        [{ tokenHash: 1 }, expect.objectContaining({ unique: true })],
        [{ previousTokenHash: 1 }, expect.anything()],
        [{ businessId: 1, userId: 1 }, expect.anything()],
        [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
      ]),
    );
  });
});
