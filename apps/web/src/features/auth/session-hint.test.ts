import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testBusiness, testUser } from '@/test/fixtures';
import { hasSessionHint, syncSessionHint } from './session-hint';
import type { SessionSnapshot } from './session-store';

const signedIn: SessionSnapshot = {
  status: 'authenticated',
  user: testUser,
  business: testBusiness,
};
const signedOut: SessionSnapshot = { status: 'anonymous', endReason: 'signed-out' };

let stored: Map<string, string>;

beforeEach(() => {
  stored = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBrokenStorage() {
  const fail = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  };
  vi.stubGlobal('localStorage', { getItem: fail, setItem: fail, removeItem: fail });
}

describe('the sign-in hint', () => {
  it('is absent in a browser that has never signed in', () => {
    expect(hasSessionHint()).toBe(false);
  });

  it('is set while signed in and removed once signed out', () => {
    syncSessionHint(signedIn);
    expect(hasSessionHint()).toBe(true);

    syncSessionHint({ status: 'anonymous', endReason: 'expired' });
    expect(hasSessionHint()).toBe(false);
  });

  it('is kept while the session is still unknown', () => {
    syncSessionHint(signedIn);
    syncSessionHint({ status: 'unknown' });

    expect(hasSessionHint()).toBe(true);
  });

  it('holds nothing about the session itself', () => {
    syncSessionHint(signedIn);

    expect([...stored.values()]).toEqual(['1']);
  });

  it('counts as set when storage cannot be read, so the session is still checked', () => {
    stubBrokenStorage();

    expect(hasSessionHint()).toBe(true);
    expect(() => syncSessionHint(signedIn)).not.toThrow();
    expect(() => syncSessionHint(signedOut)).not.toThrow();
  });

  it('counts as set where there is no storage at all', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(hasSessionHint()).toBe(true);
    expect(() => syncSessionHint(signedIn)).not.toThrow();
  });
});
