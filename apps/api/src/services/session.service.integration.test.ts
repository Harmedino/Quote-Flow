import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionModel } from '../models';
import { createTestClock } from '../test/auth';
import { TEST_DATABASE_URI, recordCommands, useTestDatabase } from '../test/database';
import { hashToken } from '../utils/tokens';
import { REFRESH_REUSE_GRACE_MS, createSessionService } from './session.service';

function setup() {
  const clock = createTestClock();
  const sessions = createSessionService({ refreshTokenTtlDays: 30, clock: clock.now });
  const owner = { userId: new Types.ObjectId(), businessId: new Types.ObjectId() };
  return { clock, sessions, owner };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe.skipIf(!TEST_DATABASE_URI)('session service (database)', () => {
  useTestDatabase();

  it('stores a new session with only the hash of its token and the truncated user agent', async () => {
    const { sessions, owner, clock } = setup();

    const { session, refreshToken } = await sessions.start(owner, `Agent/${'x'.repeat(400)}`);

    const stored = await SessionModel.findOne({
      _id: session._id,
      businessId: owner.businessId,
    }).lean();
    expect(stored).toMatchObject({
      userId: owner.userId,
      tokenHash: hashToken(refreshToken),
      previousTokenHash: null,
      lastUsedAt: clock.now(),
      expiresAt: new Date(clock.now().getTime() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });
    expect(stored?.userAgent).toHaveLength(256);
    expect(JSON.stringify(stored)).not.toContain(refreshToken);
  });

  it('loses a refresh race safely: the stale rotation finds nothing to swap', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);
    let racingOutcome: Awaited<ReturnType<typeof sessions.rotate>> | undefined;

    // Another request rotates the same token between this request's lookup and its swap.
    const findOneAndUpdate = SessionModel.findOneAndUpdate.bind(SessionModel);
    vi.spyOn(SessionModel, 'findOneAndUpdate').mockImplementationOnce(((
      ...args: Parameters<typeof findOneAndUpdate>
    ) =>
      sessions.rotate(refreshToken).then((outcome) => {
        racingOutcome = outcome;
        return findOneAndUpdate(...args);
      })) as unknown as typeof SessionModel.findOneAndUpdate);

    const outcome = await sessions.rotate(refreshToken);

    expect(racingOutcome?.status).toBe('rotated');
    expect(outcome).toEqual({ status: 'superseded' });
    if (racingOutcome?.status !== 'rotated') throw new Error('expected the racing rotation to win');
    const stored = await SessionModel.findOne({ businessId: owner.businessId }).lean();
    expect(stored).toMatchObject({
      tokenHash: hashToken(racingOutcome.refreshToken),
      previousTokenHash: hashToken(refreshToken),
      revokedAt: null,
    });
  });

  it('only treats the immediately previous token as a race inside the grace window', async () => {
    const { sessions, owner, clock } = setup();
    const { refreshToken: first } = await sessions.start(owner, undefined);
    const second = await sessions.rotate(first);
    if (second.status !== 'rotated') throw new Error('expected a rotation');

    clock.advance(REFRESH_REUSE_GRACE_MS);
    expect(await sessions.rotate(first)).toEqual({ status: 'superseded' });

    clock.advance(1);
    expect(await sessions.rotate(first)).toMatchObject({ status: 'reused' });
    expect(await sessions.rotate(second.refreshToken)).toEqual({ status: 'invalid' });
  });

  it('revokes a session by its current or just-rotated token, once', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);
    const rotated = await sessions.rotate(refreshToken);
    if (rotated.status !== 'rotated') throw new Error('expected a rotation');

    expect(await sessions.revokeByToken(refreshToken, 'logout')).not.toBeNull();
    expect(await sessions.revokeByToken(rotated.refreshToken, 'logout')).toBeNull();
    expect(await SessionModel.findOne({ businessId: owner.businessId }).lean()).toMatchObject({
      revokedReason: 'logout',
    });
  });

  it('revokes all of one user’s sessions, optionally keeping one, and nobody else’s', async () => {
    const { sessions, owner } = setup();
    const colleague = { userId: new Types.ObjectId(), businessId: owner.businessId };
    const keep = await sessions.start(owner, undefined);
    await sessions.start(owner, undefined);
    await sessions.start(owner, undefined);
    await sessions.start(colleague, undefined);

    const revoked = await sessions.revokeAllForUser(
      { userId: owner.userId.toString(), businessId: owner.businessId.toString() },
      'password_changed',
      keep.session.id,
    );

    expect(revoked).toBe(2);
    const active = await SessionModel.find({
      businessId: owner.businessId,
      revokedAt: null,
    }).lean();
    expect(active.map((session) => session._id.toString()).sort()).toEqual(
      [
        keep.session.id,
        (await SessionModel.findOne({ businessId: owner.businessId, userId: colleague.userId }))
          ?.id,
      ].sort(),
    );
  });

  it('scopes every write to the session’s own business', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);

    const commands = await recordCommands(async () => {
      const rotated = await sessions.rotate(refreshToken);
      if (rotated.status !== 'rotated') throw new Error('expected a rotation');
      await sessions.revokeByToken(rotated.refreshToken, 'logout');
    });

    const writes = commands.filter(({ name }) => name === 'findAndModify' || name === 'update');
    expect(writes).toHaveLength(2);
    for (const { name, command } of writes) {
      const filter =
        name === 'update'
          ? (command.updates as { q: unknown }[] | undefined)?.[0]?.q
          : command.query;
      expect(filter).toMatchObject({ businessId: owner.businessId });
    }
  });
});
