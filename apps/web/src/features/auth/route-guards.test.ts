import { RouterContextProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testBusiness, testUser } from '@/test/fixtures';
import { redirectSignedIn, requireSession } from './route-guards';
import type { SessionSnapshot } from './session-store';

const { ensureSession, ensureSessionIfHinted } = vi.hoisted(() => ({
  ensureSession: vi.fn<() => Promise<SessionSnapshot>>(),
  ensureSessionIfHinted: vi.fn<() => Promise<SessionSnapshot>>(),
}));
vi.mock('./session', () => ({ ensureSession, ensureSessionIfHinted }));

const signedIn: SessionSnapshot = {
  status: 'authenticated',
  user: testUser,
  business: testBusiness,
};
const signedOut: SessionSnapshot = { status: 'anonymous', endReason: null };
/** What the hint-aware check answers in a browser that has never signed in. */
const unchecked: SessionSnapshot = { status: 'unknown' };

function run(middleware: typeof requireSession, url: string) {
  const request = new Request(new URL(url, 'https://app.example'));
  return middleware(
    {
      request,
      url: new URL(request.url),
      pattern: '',
      params: {},
      context: new RouterContextProvider(),
    },
    () => Promise.resolve(undefined),
  );
}

function location(result: unknown): string | null {
  return result instanceof Response ? result.headers.get('Location') : null;
}

beforeEach(() => {
  ensureSession.mockReset();
  ensureSessionIfHinted.mockReset();
});

describe('requireSession', () => {
  it('lets signed-in users through', async () => {
    ensureSession.mockResolvedValue(signedIn);
    expect(await run(requireSession, '/quotes')).toBeUndefined();
  });

  it('sends signed-out visitors to sign in, returning to the page they asked for', async () => {
    ensureSession.mockResolvedValue(signedOut);
    const result = await run(requireSession, '/settings/business?tab=documents');

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect(location(result)).toBe('/login?redirectTo=%2Fsettings%2Fbusiness%3Ftab%3Ddocuments');
  });

  it('lets a failed session check reach the error boundary', async () => {
    ensureSession.mockRejectedValue(new Error('offline'));
    await expect(run(requireSession, '/quotes')).rejects.toThrow('offline');
  });

  it('always checks the session itself, whatever the sign-in hint says', async () => {
    ensureSession.mockResolvedValue(signedIn);
    ensureSessionIfHinted.mockResolvedValue(unchecked);

    expect(await run(requireSession, '/dashboard')).toBeUndefined();
    expect(ensureSession).toHaveBeenCalledOnce();
    expect(ensureSessionIfHinted).not.toHaveBeenCalled();
  });
});

describe('redirectSignedIn', () => {
  it('checks the session only through the sign-in hint', async () => {
    ensureSessionIfHinted.mockResolvedValue(unchecked);

    expect(await run(redirectSignedIn, '/login')).toBeUndefined();
    expect(ensureSessionIfHinted).toHaveBeenCalledOnce();
    expect(ensureSession).not.toHaveBeenCalled();
  });

  it('shows the form to signed-out visitors', async () => {
    ensureSessionIfHinted.mockResolvedValue(signedOut);
    expect(await run(redirectSignedIn, '/login')).toBeUndefined();
  });

  it('shows the form when the session cannot be checked', async () => {
    ensureSessionIfHinted.mockRejectedValue(new Error('offline'));
    expect(await run(redirectSignedIn, '/login')).toBeUndefined();
  });

  it('sends signed-in users to a safe redirectTo or the dashboard', async () => {
    ensureSessionIfHinted.mockResolvedValue(signedIn);

    expect(location(await run(redirectSignedIn, '/login?redirectTo=%2Fquotes%2Fnew'))).toBe(
      '/quotes/new',
    );
    expect(location(await run(redirectSignedIn, '/register?redirectTo=%2F%2Fevil.example'))).toBe(
      '/dashboard',
    );
    expect(location(await run(redirectSignedIn, '/login'))).toBe('/dashboard');
  });
});
