import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import type { CSSProperties } from 'react';

/**
 * A business picks any brand color, so customer-facing documents derive
 * readable variants from it instead of trusting it to contrast with white.
 */

type Rgb = readonly [number, number, number];

const HEX_COLOR = /^#([0-9a-f]{6})$/i;
const WHITE: Rgb = [255, 255, 255];
const INK = '#18181b';
/** WCAG AA for normal text. */
const READABLE_CONTRAST = 4.5;

function parseHex(hex: string): Rgb | null {
  const match = HEX_COLOR.exec(hex.trim());
  if (!match?.[1]) return null;
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG contrast ratio of two '#rrggbb' colors (1–21); invalid colors count as the default brand. */
export function contrastRatio(a: string, b: string): number {
  const fallback = parseHex(DEFAULT_BRAND_COLOR) as Rgb;
  return contrast(parseHex(a) ?? fallback, parseHex(b) ?? fallback);
}

export function normalizeBrandColor(hex: string | null | undefined): string {
  return hex && parseHex(hex) ? hex.trim().toLowerCase() : DEFAULT_BRAND_COLOR;
}

/** White or near-black, whichever reads better on a surface filled with the brand color. */
export function textColorOn(hex: string): string {
  const rgb = parseHex(normalizeBrandColor(hex)) as Rgb;
  return contrast(rgb, WHITE) >= contrast(rgb, parseHex(INK) as Rgb) ? '#ffffff' : INK;
}

/** The brand color when it is readable as text on white; otherwise a darker shade of it. */
export function brandTextColor(hex: string): string {
  const rgb = parseHex(normalizeBrandColor(hex)) as Rgb;
  for (let factor = 1; factor > 0; factor -= 0.05) {
    const shade: Rgb = [rgb[0] * factor, rgb[1] * factor, rgb[2] * factor].map(Math.round) as [
      number,
      number,
      number,
    ];
    if (contrast(shade, WHITE) >= READABLE_CONTRAST) return toHex(shade);
  }
  return INK;
}

/**
 * CSS custom properties for brand-tinted UI: `--doc-accent` (fills),
 * `--doc-on-accent` (text on fills), `--doc-accent-text` (text on white) and
 * `--doc-accent-soft` (a light tint for highlighted areas).
 */
export function brandColorVars(hex: string | null | undefined): CSSProperties {
  const accent = normalizeBrandColor(hex);
  return {
    '--doc-accent': accent,
    '--doc-on-accent': textColorOn(accent),
    '--doc-accent-text': brandTextColor(accent),
    '--doc-accent-soft': `color-mix(in srgb, ${accent} 8%, white)`,
  } as CSSProperties;
}
