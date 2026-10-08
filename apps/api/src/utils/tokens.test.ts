import { describe, expect, it } from 'vitest';
import { PUBLIC_TOKEN_PATTERN, generatePublicToken } from './tokens';

describe('generatePublicToken', () => {
  it('produces 256-bit, URL-safe tokens', () => {
    const token = generatePublicToken();
    expect(token).toMatch(PUBLIC_TOKEN_PATTERN);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('does not repeat', () => {
    const tokens = new Set(Array.from({ length: 1_000 }, generatePublicToken));
    expect(tokens.size).toBe(1_000);
  });
});
