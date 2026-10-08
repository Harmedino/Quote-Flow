import { describe, expect, it } from 'vitest';
import {
  SECURE_TOKEN_PATTERN,
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
