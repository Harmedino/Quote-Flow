import { describe, expect, it, vi } from 'vitest';
import { SessionStore } from './session-store';
import { testBusiness, testSession, testUser } from '@/test/fixtures';

describe('SessionStore', () => {
  it('starts unknown, with no token', () => {
    const store = new SessionStore();
    expect(store.getSnapshot()).toEqual({ status: 'unknown' });
    expect(store.getAccessToken()).toBeNull();
  });

  it('keeps the access token out of the rendered snapshot', () => {
    const store = new SessionStore();
    store.setSession(testSession('secret-token'));

    expect(store.getAccessToken()).toBe('secret-token');
    expect(store.getSnapshot()).toEqual({
      status: 'authenticated',
      user: testUser,
      business: testBusiness,
    });
    expect(JSON.stringify(store.getSnapshot())).not.toContain('secret-token');
  });

  it('never touches Web Storage or cookies', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    vi.stubGlobal('sessionStorage', { setItem });
    const store = new SessionStore();
    store.setSession(testSession());
    store.clear('signed-out');
    vi.unstubAllGlobals();

    expect(setItem).not.toHaveBeenCalled();
  });

  it('notifies subscribers with a new immutable snapshot on every change', () => {
    const store = new SessionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setSession(testSession());
    const signedIn = store.getSnapshot();
    store.updateBusiness({ ...testBusiness, name: 'Sparkle & Shine' });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).not.toBe(signedIn);
    expect(signedIn).toMatchObject({ business: { name: 'Sparkle Cleaning Co.' } });
    expect(store.getSnapshot()).toMatchObject({ business: { name: 'Sparkle & Shine' } });

    unsubscribe();
    store.clear('signed-out');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('updates the user and business only for the signed-in identity', () => {
    const store = new SessionStore();
    store.updateUser(testUser);
    expect(store.getSnapshot()).toEqual({ status: 'unknown' });

    store.setSession(testSession());
    store.updateUser({ ...testUser, id: 'someone-else', name: 'Other' });
    store.updateBusiness({ ...testBusiness, id: 'other-business', name: 'Other' });
    store.updateUser({ ...testUser, name: 'Amina B. Yusuf' });

    expect(store.getSnapshot()).toMatchObject({
      user: { name: 'Amina B. Yusuf' },
      business: { name: 'Sparkle Cleaning Co.' },
    });
  });

  it('clears the token and records why the session ended', () => {
    const store = new SessionStore();
    store.setSession(testSession());
    store.clear('expired');

    expect(store.getAccessToken()).toBeNull();
    expect(store.getSnapshot()).toEqual({ status: 'anonymous', endReason: 'expired' });
  });

  it('does not notify when clearing an already identical anonymous state', () => {
    const store = new SessionStore();
    store.clear(null);
    const listener = vi.fn();
    store.subscribe(listener);

    store.clear(null);

    expect(listener).not.toHaveBeenCalled();
  });

  it('reports user changes, not every session update', () => {
    const store = new SessionStore();
    const onUserChange = vi.fn();
    store.onUserChange(onUserChange);

    store.setSession(testSession('a'));
    store.setSession(testSession('b'));
    store.updateBusiness({ ...testBusiness, name: 'Renamed' });
    expect(onUserChange).toHaveBeenCalledTimes(1);

    store.setSession(testSession('c', { ...testUser, id: 'user-2' }));
    store.clear('signed-out');
    expect(onUserChange).toHaveBeenCalledTimes(3);
  });
});
