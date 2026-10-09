import { describe, expect, it } from 'vitest';
import { FROM_DEMO_STATE, isFromDemo } from './demo-state';
import { PREVIEW_STATE } from './preview-flag';

describe('isFromDemo', () => {
  it('recognises a page opened from the website demo', () => {
    expect(isFromDemo(FROM_DEMO_STATE)).toBe(true);
  });

  it('ignores any other history state', () => {
    expect(isFromDemo(null)).toBe(false);
    expect(isFromDemo(undefined)).toBe(false);
    expect(isFromDemo(PREVIEW_STATE)).toBe(false);
    expect(isFromDemo({ fromDemo: 'yes' })).toBe(false);
  });
});
