import { describe, expect, it } from 'vitest';
import { paths } from '@/app/paths';
import { PREVIEW_STATE, readPreviewFlag } from './preview-flag';

const previewSearch = paths.publicQuotePreview('tok').slice('/quote/tok'.length);

describe('readPreviewFlag', () => {
  it('reads the flag from a preview link and drops it from the search', () => {
    expect(readPreviewFlag({ search: previewSearch, state: null })).toEqual({
      preview: true,
      searchWithoutFlag: '',
    });
    expect(readPreviewFlag({ search: '?ref=share&preview=1', state: null })).toEqual({
      preview: true,
      searchWithoutFlag: 'ref=share',
    });
  });

  it('stays a preview once the flag has moved into history state', () => {
    expect(readPreviewFlag({ search: '', state: PREVIEW_STATE })).toEqual({
      preview: true,
      searchWithoutFlag: null,
    });
  });

  it('treats the plain link, copied from the address bar, as the customer', () => {
    expect(readPreviewFlag({ search: '', state: null })).toEqual({
      preview: false,
      searchWithoutFlag: null,
    });
    expect(readPreviewFlag({ search: '?preview=0', state: { preview: 'yes' } })).toEqual({
      preview: false,
      searchWithoutFlag: null,
    });
  });
});
