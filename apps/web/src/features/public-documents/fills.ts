import type { CSSProperties } from 'react';
import {
  brandColorVars,
  brandTextColor,
  contrastRatio,
  normalizeBrandColor,
  textColorOn,
} from '@/components/documents/brand-color';

/** WCAG AA for normal text: the band's small print and the Accept button's label. */
const READABLE_CONTRAST = 4.5;
/** WCAG 1.4.11: below this against the paper, a brand fill needs an edge to show its shape. */
const VISIBLE_CONTRAST = 3;
const PAPER = '#fffdf9';

/**
 * The colour of the band and the Accept button, and the text on it. A mid-tone colour that
 * neither white nor navy text reads on is darkened until white does, so any colour works.
 */
export function brandFill(brandColor: string | null | undefined): {
  fill: string;
  onFill: string;
} {
  const accent = normalizeBrandColor(brandColor);
  const fill =
    contrastRatio(accent, textColorOn(accent)) >= READABLE_CONTRAST
      ? accent
      : brandTextColor(accent);
  return { fill, onFill: textColorOn(fill) };
}

/**
 * The CSS variables for a customer's page in the business's colour: those of `brandColorVars`,
 * plus `--doc-fill` and `--doc-on-fill` (see `brandFill`) for the band and the Accept button.
 * `--doc-fill-away` is black under white text and white under navy text: mixing it into the fill
 * (the band's buttons) only ever raises the text's contrast. `--doc-fill-edge` outlines the fills
 * of a colour too light to stand out from the paper (white, pale yellow) in the band's text colour,
 * and is transparent otherwise.
 */
export function brandPageVars(brandColor: string | null | undefined): CSSProperties {
  const { fill, onFill } = brandFill(brandColor);
  return {
    ...brandColorVars(brandColor),
    '--doc-fill': fill,
    '--doc-on-fill': onFill,
    '--doc-fill-away': onFill === '#ffffff' ? '#000000' : '#ffffff',
    '--doc-fill-edge': contrastRatio(fill, PAPER) < VISIBLE_CONTRAST ? onFill : 'transparent',
  } as CSSProperties;
}

/**
 * Inline fills for buttons on a `primary` Button, which keeps its pressed edge: inline styles win
 * over the variant's own colours. The brand fill needs a BrandedPage around it; its border is
 * see-through unless the colour is too light to show on the paper.
 */
export const BRAND_FILL = {
  backgroundColor: 'var(--doc-fill)',
  color: 'var(--doc-on-fill)',
  border: '1.5px solid var(--doc-fill-edge)',
} satisfies CSSProperties;

/** Navy, for an answer that shouldn't look celebratory, such as declining. */
export const NEUTRAL_FILL = {
  backgroundColor: 'var(--color-ink)',
  color: 'var(--color-surface)',
} satisfies CSSProperties;

/** Feedback for the inline fills, which a variant's hover colour can't override. */
export const FILL_FEEDBACK = 'hover:brightness-95 active:brightness-90';
