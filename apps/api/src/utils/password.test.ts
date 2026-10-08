import bcrypt from 'bcryptjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from './password';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('password hashing', () => {
  it('round-trips with bcrypt at cost 12 and a per-hash salt', async () => {
    const password = 'correct horse battery staple';
    const [first, second] = await Promise.all([hashPassword(password), hashPassword(password)]);

    expect(bcrypt.getRounds(first)).toBe(12);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword('correct horse battery stapler', first)).toBe(false);
  });

  it('rejects passwords that bcrypt would silently truncate', async () => {
    await expect(hashPassword('é'.repeat(37))).rejects.toThrow(RangeError);
  });

  it('still does the bcrypt work when there is no stored hash', async () => {
    const compare = vi.spyOn(bcrypt, 'compare');

    expect(await verifyPassword('anything', undefined)).toBe(false);
    expect(await verifyPassword('anything', null)).toBe(false);

    expect(compare).toHaveBeenCalledTimes(2);
    for (const [, hash] of compare.mock.calls) {
      expect(bcrypt.getRounds(hash)).toBe(12);
    }
  });
});
