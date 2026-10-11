import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/components/documents/brand-color';
import { brandPageVars } from './fills';

function fillOf(brandColor: string | null) {
  const vars = brandPageVars(brandColor) as Record<string, string>;
  return { fill: vars['--doc-fill'] ?? '', onFill: vars['--doc-on-fill'] ?? '' };
}

const varOf = (brandColor: string, name: string) =>
  (brandPageVars(brandColor) as Record<string, string>)[name];
const awayOf = (brandColor: string) => varOf(brandColor, '--doc-fill-away');
const edgeOf = (brandColor: string) => varOf(brandColor, '--doc-fill-edge');

describe('brandPageVars', () => {
  it('fills the band and buttons with the brand colour when its text reads', () => {
    expect(fillOf('#0F6B78')).toEqual({ fill: '#0f6b78', onFill: '#ffffff' });
    expect(fillOf(DEFAULT_BRAND_COLOR)).toEqual({ fill: DEFAULT_BRAND_COLOR, onFill: '#ffffff' });
  });

  it('puts navy text on a light brand colour', () => {
    expect(fillOf('#facc15')).toEqual({ fill: '#facc15', onFill: '#0e1b33' });
  });

  it('washes the band’s buttons away from their text colour', () => {
    expect(awayOf('#0F6B78')).toBe('#000000');
    expect(awayOf('#facc15')).toBe('#ffffff');
  });

  it('outlines a fill too light to stand out from the paper, in the band’s text colour', () => {
    for (const light of ['#ffffff', '#fff6c2']) {
      expect(fillOf(light)).toEqual({ fill: light, onFill: '#0e1b33' });
      expect(edgeOf(light)).toBe('#0e1b33');
    }
    expect(edgeOf('#0F6B78')).toBe('transparent');
    expect(edgeOf(DEFAULT_BRAND_COLOR)).toBe('transparent');
  });

  it('darkens a mid-tone that neither white nor navy text reads on', () => {
    const { fill, onFill } = fillOf('#808080');
    expect(fill).not.toBe('#808080');
    expect(onFill).toBe('#ffffff');
    expect(contrastRatio(fill, onFill)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the paper variables and falls back to the default colour', () => {
    expect(brandPageVars('#1D4ED8')).toMatchObject({ '--doc-accent': '#1d4ed8' });
    expect(brandPageVars('not a colour')).toMatchObject({ '--doc-fill': DEFAULT_BRAND_COLOR });
  });
});
