import { describe, expect, it } from 'vitest';
import {
  SECURE_TOKEN_PATTERN,
  createRefreshTokenSuccessor,
  generatePublicToken,
  generateRefreshToken,
  hashToken,
} from './tokens';

describe.each([
  ['generatePublicToken', generatePublicToken],
  ['generateRefreshToken', generateRefreshToken],
])('%s', (_name, generate) => {
  it('produces 256-bit, URL-safe tokens', () => {
    const token = generate();
    expect(token).toMatch(SECURE_TOKEN_PATTERN);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 1_000 }, generate));
    expect(tokens.size).toBe(1_000);
  });
});

describe('hashToken', () => {
  it('is a deterministic SHA-256 digest that does not contain the token', () => {
    const token = generateRefreshToken();
    const hash = hashToken(token);

    expect(hashToken(token)).toBe(hash);
    expect(Buffer.from(hash, 'base64url')).toHaveLength(32);
    expect(hash).not.toContain(token);
    expect(hashToken(generateRefreshToken())).not.toBe(hash);
  });

  it('matches the standard SHA-256 test vector', () => {
    expect(Buffer.from(hashToken('abc'), 'base64url').toString('hex')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('createRefreshTokenSuccessor', () => {
  const SECRET = 'successor-test-secret-0123456789abcdef';

  it('derives a deterministic successor shaped like a generated refresh token', () => {
    const successorOf = createRefreshTokenSuccessor(SECRET);
    const token = generateRefreshToken();
    const successor = successorOf(token);

    expect(successor).toMatch(SECURE_TOKEN_PATTERN);
    expect(Buffer.from(successor, 'base64url')).toHaveLength(32);
    expect(successorOf(token)).toBe(successor);
    expect(createRefreshTokenSuccessor(SECRET)(token)).toBe(successor);
    expect(successor).not.toBe(token);
    expect(successor).not.toBe(hashToken(token));
    expect(successorOf(generateRefreshToken())).not.toBe(successor);
  });

  it('cannot be predicted without the secret', () => {
    const token = generateRefreshToken();
    expect(createRefreshTokenSuccessor(`${SECRET}x`)(token)).not.toBe(
      createRefreshTokenSuccessor(SECRET)(token),
    );
  });

  it('keeps its derivation, so rotations retried across a deploy still match', () => {
    expect(createRefreshTokenSuccessor('x'.repeat(32))('a'.repeat(43))).toBe(
      '5r1XdfiVo103MJIRQMiMtY1rrpelpSn_9dhkVFPIgZE',
    );
  });
});
