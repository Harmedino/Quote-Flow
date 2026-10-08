import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAuthHandler } from './api-client';
import { downloadFile } from './download';

const fetchMock = vi.fn<typeof fetch>();

interface FakeLink {
  href: string;
  download: string;
  rel: string;
  style: { display: string };
  click: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

let link: FakeLink;
const append = vi.fn();
const createObjectURL = vi.fn(() => 'blob:quoteflow/1');
const revokeObjectURL = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockReset();
  append.mockReset();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  link = {
    href: '',
    download: '',
    rel: '',
    style: { display: '' },
    click: vi.fn(),
    remove: vi.fn(),
  };
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('document', { createElement: () => link, body: { append } });
  vi.stubGlobal('window', { setTimeout });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  setAuthHandler(null);
});

describe('downloadFile', () => {
  it('saves the authenticated response through a temporary download link', async () => {
    setAuthHandler({ getAccessToken: () => 'token', renewSession: () => Promise.resolve(false) });
    fetchMock.mockResolvedValue(
      new Response('%PDF-1.7', { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    );

    await downloadFile('/quotes/q1/pdf', 'QUO-0001.pdf');

    expect(new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe(
      'Bearer token',
    );
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(link).toMatchObject({ href: 'blob:quoteflow/1', download: 'QUO-0001.pdf' });
    expect(append).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:quoteflow/1');
  });

  it('rejects with the API error and creates no link when the request fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Quote not found' } }), {
        status: 404,
      }),
    );

    await expect(downloadFile('/quotes/missing/pdf', 'x.pdf')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(link.click).not.toHaveBeenCalled();
  });
});
