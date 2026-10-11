import { Types } from 'mongoose';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RetiredRefreshTokenModel, SessionModel } from '../models';
import { createTestClock } from '../test/auth';
import { TEST_DATABASE_URI, recordCommands, useTestDatabase } from '../test/database';
import { createRefreshTokenSuccessor, generateRefreshToken, hashToken } from '../utils/tokens';
import {
  REFRESH_REUSE_GRACE_MS,
  type RotationOutcome,
  createSessionService,
} from './session.service';

const SECRET = 'session-service-test-secret-0123456789abcdef';

function setup() {
  const clock = createTestClock();
  const sessions = createSessionService({
    refreshTokenTtlDays: 30,
    secret: SECRET,
    clock: clock.now,
  });
  const owner = { userId: new Types.ObjectId(), businessId: new Types.ObjectId() };
  return { clock, sessions, owner };
}

afterEach(() => {
  vi.restoreAllMocks();
});

function rotatedToken(outcome: RotationOutcome): string {
  if (outcome.status !== 'rotated') throw new Error(`expected a rotation, got ${outcome.status}`);
  return outcome.refreshToken;
}

const retiredCount = (businessId: Types.ObjectId, token: string) =>
  RetiredRefreshTokenModel.countDocuments({ businessId, tokenHash: hashToken(token) });

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

  it('hands the loser of a refresh race the token the winner rotated to', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);
    let racingOutcome: RotationOutcome | undefined;

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

    if (!racingOutcome) throw new Error('expected the racing rotation to run');
    const winnerToken = rotatedToken(racingOutcome);
    expect(rotatedToken(outcome)).toBe(winnerToken);
    const stored = await SessionModel.findOne({ businessId: owner.businessId }).lean();
    expect(stored).toMatchObject({
      tokenHash: hashToken(winnerToken),
      previousTokenHash: hashToken(refreshToken),
      revokedAt: null,
    });
    expect(await retiredCount(owner.businessId, refreshToken)).toBe(1);
  });

  it('gives two concurrent rotations of one token the same new token', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);

    const outcomes = await Promise.all([
      sessions.rotate(refreshToken),
      sessions.rotate(refreshToken),
    ]);

    const [first, second] = outcomes.map(rotatedToken);
    expect(second).toBe(first);
    expect(await SessionModel.findOne({ businessId: owner.businessId }).lean()).toMatchObject({
      tokenHash: hashToken(first ?? ''),
      revokedAt: null,
    });
    expect(await retiredCount(owner.businessId, refreshToken)).toBe(1);
    expect(rotatedToken(await sessions.rotate(first ?? ''))).not.toBe(first);
  });

  it('hands a page that reloaded mid-refresh the same new token, without rotating again', async () => {
    const { sessions, owner, clock } = setup();
    const { session, refreshToken: first } = await sessions.start(owner, undefined);
    // The response carrying `second` never reached the browser, which still holds `first`.
    const second = rotatedToken(await sessions.rotate(first));
    const rotatedAt = clock.now();
    clock.advance(5_000);

    const retry = await sessions.rotate(first);

    expect(retry).toMatchObject({ status: 'rotated', refreshToken: second });
    if (retry.status === 'rotated') expect(retry.session.id).toBe(session.id);
    expect(await SessionModel.findOne({ businessId: owner.businessId }).lean()).toMatchObject({
      tokenHash: hashToken(second),
      previousTokenHash: hashToken(first),
      rotatedAt,
      revokedAt: null,
    });
    expect(await retiredCount(owner.businessId, first)).toBe(1);

    const third = rotatedToken(await sessions.rotate(second));
    expect(third).not.toBe(second);
    // `first` is now two rotations old: a replay, however soon it comes.
    expect(await sessions.rotate(first)).toMatchObject({ status: 'reused' });
    expect(await sessions.rotate(third)).toEqual({ status: 'invalid' });
  });

  it('refuses a retry inside the grace window once the session has been revoked', async () => {
    const { sessions, owner, clock } = setup();
    const { session, refreshToken: first } = await sessions.start(owner, undefined);
    await sessions.rotate(first);
    await sessions.revoke(session, 'logout');
    clock.advance(5_000);

    expect(await sessions.rotate(first)).toEqual({ status: 'invalid' });
  });

  it('refuses the loser of a refresh race when the session was revoked meanwhile', async () => {
    const { sessions, owner } = setup();
    const { session, refreshToken } = await sessions.start(owner, undefined);

    // Another request rotates the token, then the session is signed out, before this swap runs.
    const findOneAndUpdate = SessionModel.findOneAndUpdate.bind(SessionModel);
    vi.spyOn(SessionModel, 'findOneAndUpdate').mockImplementationOnce(((
      ...args: Parameters<typeof findOneAndUpdate>
    ) =>
      sessions
        .rotate(refreshToken)
        .then(() => sessions.revoke(session, 'logout'))
        .then(() => findOneAndUpdate(...args))) as unknown as typeof SessionModel.findOneAndUpdate);

    expect(await sessions.rotate(refreshToken)).toEqual({ status: 'invalid' });
  });

  it('derives each new token from the presented one under the secret', async () => {
    const { sessions, owner } = setup();
    const { refreshToken } = await sessions.start(owner, undefined);

    const next = rotatedToken(await sessions.rotate(refreshToken));

    expect(next).toBe(createRefreshTokenSuccessor(SECRET)(refreshToken));
    expect(next).not.toBe(createRefreshTokenSuccessor(`${SECRET}-other`)(refreshToken));
  });

  it('rejects a retry, without revoking, once the session has moved past its successor', async () => {
    const { sessions, owner } = setup();
    const { refreshToken: first } = await sessions.start(owner, undefined);
    rotatedToken(await sessions.rotate(first));
    // As a rotation made before successors were derived left it: a random current token.
    const current = generateRefreshToken();
    await SessionModel.updateOne(
      { businessId: owner.businessId },
      { $set: { tokenHash: hashToken(current) } },
    );

    expect(await sessions.rotate(first)).toEqual({ status: 'superseded' });
    expect(await sessions.rotate(current)).toMatchObject({ status: 'rotated' });
  });

  it('only treats the immediately previous token as a retry inside the grace window', async () => {
    const { sessions, owner, clock } = setup();
    const { refreshToken: first } = await sessions.start(owner, undefined);
    const second = rotatedToken(await sessions.rotate(first));

    clock.advance(REFRESH_REUSE_GRACE_MS);
    expect(await sessions.rotate(first)).toMatchObject({ status: 'rotated', refreshToken: second });

    clock.advance(1);
    expect(await sessions.rotate(first)).toMatchObject({ status: 'reused' });
    expect(await sessions.rotate(second)).toEqual({ status: 'invalid' });
    expect(await SessionModel.findOne({ businessId: owner.businessId }).lean()).toMatchObject({
      revokedReason: 'reuse_detected',
    });
  });

  it('revokes the session when any earlier token is replayed, however many rotations ago', async () => {
    const { sessions, owner, clock } = setup();
    const { refreshToken: stolen } = await sessions.start(owner, undefined);
    // The thief refreshes twice; the victim's copy is now two rotations old.
    const first = await sessions.rotate(stolen);
    if (first.status !== 'rotated') throw new Error('expected a rotation');
    clock.advance(15 * 60_000);
    const second = await sessions.rotate(first.refreshToken);
    if (second.status !== 'rotated') throw new Error('expected a rotation');

    const retired = await RetiredRefreshTokenModel.findOne({
      businessId: owner.businessId,
      tokenHash: hashToken(stolen),
    }).lean();
    expect(retired).toMatchObject({
      sessionId: second.session._id,
      expiresAt: first.session.expiresAt,
    });

    clock.advance(60_000);
    expect(await sessions.rotate(stolen)).toMatchObject({ status: 'reused' });
    expect(await sessions.rotate(second.refreshToken)).toEqual({ status: 'invalid' });
    expect(await SessionModel.findOne({ businessId: owner.businessId }).lean()).toMatchObject({
      revokedReason: 'reuse_detected',
    });
  });

  it('reports whether a session is active and revokes a single one', async () => {
    const { sessions, owner, clock } = setup();
    const kept = await sessions.start(owner, undefined);
    const ended = await sessions.start(owner, undefined);
    const ref = (sessionId: string) => ({ ...owner, sessionId });

    expect(await sessions.revokeOne(ref(ended.session.id), 'logout_all')).toBe(1);
    expect(await sessions.revokeOne(ref(ended.session.id), 'logout_all')).toBe(0);
    expect(await sessions.isActive(ref(ended.session.id))).toBe(false);
    expect(await sessions.isActive(ref(kept.session.id))).toBe(true);
    // Another user's id or business never matches.
    expect(await sessions.isActive({ ...ref(kept.session.id), userId: new Types.ObjectId() })).toBe(
      false,
    );

    clock.advance(31 * 24 * 60 * 60 * 1000);
    expect(await sessions.isActive(ref(kept.session.id))).toBe(false);
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
