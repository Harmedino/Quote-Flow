import { SignJWT, decodeJwt, decodeProtectedHeader } from 'jose';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createTestClock } from '../test/auth';
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AuthContext,
  createAccessTokenService,
} from './access-token.service';

const SECRET = 'test-only-jwt-secret-that-is-long-enough-123';
const TTL_SECONDS = 15 * 60;
const START = new Date('2026-05-04T10:00:00.000Z');

const identity: AuthContext = {
  userId: new Types.ObjectId().toString(),
  businessId: new Types.ObjectId().toString(),
  role: 'owner',
  sessionId: new Types.ObjectId().toString(),
};

function setup(secret = SECRET) {
  const clock = createTestClock(START);
  return {
    clock,
    tokens: createAccessTokenService({ secret, ttlSeconds: TTL_SECONDS, clock: clock.now }),
  };
}

const key = new TextEncoder().encode(SECRET);
const epoch = (date: Date) => Math.floor(date.getTime() / 1000);

/** A token signed with the right key but with the given header and claims. */
function forge({
  alg = 'HS256',
  typ = 'JWT',
  issuer = ACCESS_TOKEN_ISSUER,
  audience = ACCESS_TOKEN_AUDIENCE,
  claims = { bid: identity.businessId, role: identity.role, sid: identity.sessionId },
}: {
  alg?: string;
  /** null leaves the header out. */
  typ?: string | null;
  issuer?: string;
  audience?: string;
  claims?: Record<string, unknown>;
} = {}) {
  return new SignJWT(claims)
    .setProtectedHeader(typ === null ? { alg } : { alg, typ })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(identity.userId)
    .setIssuedAt(epoch(START))
    .setExpirationTime(epoch(START) + TTL_SECONDS)
    .sign(key);
}

function base64url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

describe('access tokens', () => {
  it('round-trips the identity in an HS256 JWT with the designed claims', async () => {
    const { tokens } = setup();
    const { token, expiresAt } = await tokens.issue(identity);

    expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decodeJwt(token)).toEqual({
      iss: 'quoteflow-api',
      aud: 'quoteflow-app',
      sub: identity.userId,
      bid: identity.businessId,
      role: 'owner',
      sid: identity.sessionId,
      iat: epoch(START),
      exp: epoch(START) + TTL_SECONDS,
    });
    expect(expiresAt.toISOString()).toBe('2026-05-04T10:15:00.000Z');
    expect(await tokens.verify(token)).toEqual(identity);
  });

  it('accepts a token until it expires and rejects it afterwards', async () => {
    const { tokens, clock } = setup();
    const { token } = await tokens.issue(identity);

    clock.advance(TTL_SECONDS * 1000 - 1000);
    expect(await tokens.verify(token)).toEqual(identity);
    clock.advance(1000);
    expect(await tokens.verify(token)).toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const { token } = await setup('another-secret-that-is-also-long-enough-456').tokens.issue(
      identity,
    );
    expect(await setup().tokens.verify(token)).toBeNull();
  });

  it.each(['HS384', 'HS512'])(
    'rejects a token signed with %s, even with the right key',
    async (alg) => {
      expect(await setup().tokens.verify(await forge({ alg }))).toBeNull();
    },
  );

  it('rejects an unsigned token (alg "none")', async () => {
    const { tokens } = setup();
    const valid = decodeJwt(await forge());
    const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(valid)}.`;

    expect(await tokens.verify(unsigned)).toBeNull();
  });

  it.each([
    ['another issuer', { issuer: 'someone-else' }],
    ['another audience', { audience: 'another-app' }],
    ['no type header', { typ: null }],
    ['another type header', { typ: 'at+jwt' }],
    [
      'an unknown role',
      { claims: { bid: identity.businessId, role: 'admin', sid: identity.sessionId } },
    ],
    ['no session id', { claims: { bid: identity.businessId, role: 'owner' } }],
    ['a malformed business id', { claims: { bid: 'x', role: 'owner', sid: identity.sessionId } }],
  ])('rejects a token with %s', async (_label, overrides) => {
    expect(await setup().tokens.verify(await forge(overrides))).toBeNull();
  });

  it('accepts the forged baseline, so the cases above fail for the stated reason', async () => {
    expect(await setup().tokens.verify(await forge())).toEqual(identity);
  });

  it.each(['', 'not-a-jwt', 'a.b.c', `${base64url({ alg: 'HS256' })}..`])(
    'rejects the malformed token %j',
    async (token) => {
      expect(await setup().tokens.verify(token)).toBeNull();
    },
  );

  it('rejects a token whose payload was altered after signing', async () => {
    const { tokens } = setup();
    const [header, , signature] = (await tokens.issue(identity)).token.split('.');
    const escalated = base64url({
      ...decodeJwt(await forge()),
      bid: new Types.ObjectId().toString(),
    });

    expect(await tokens.verify(`${header}.${escalated}.${signature}`)).toBeNull();
  });
});
