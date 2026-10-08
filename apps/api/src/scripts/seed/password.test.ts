import { describe, expect, it } from 'vitest';
import { InvalidSeedPasswordError, resolveDemoPassword } from './password';

describe('resolveDemoPassword', () => {
  it.each([{}, { SEED_DEMO_PASSWORD: '' }, { SEED_DEMO_PASSWORD: '   ' }])(
    'generates a random password when SEED_DEMO_PASSWORD is unset (%j)',
    (source) => {
      const first = resolveDemoPassword(source);
      expect(first.generated).toBe(true);
      expect(first.value).toMatch(/^[\w-]{16}$/);
      expect(resolveDemoPassword(source).value).not.toBe(first.value);
    },
  );

  it('uses SEED_DEMO_PASSWORD when it is a valid password', () => {
    expect(resolveDemoPassword({ SEED_DEMO_PASSWORD: 'demo-pass-2026' })).toEqual({
      value: 'demo-pass-2026',
      generated: false,
    });
  });

  it.each([
    ['too short', 'short1', 'Invalid SEED_DEMO_PASSWORD: Password must be at least 8 characters'],
    ['over 72 bytes', 'é'.repeat(37), 'Invalid SEED_DEMO_PASSWORD: Password is too long'],
  ])('rejects a password that is %s without echoing it', (_label, password, message) => {
    let error: unknown;
    try {
      resolveDemoPassword({ SEED_DEMO_PASSWORD: password });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(InvalidSeedPasswordError);
    expect((error as Error).message).toBe(message);
  });
});
