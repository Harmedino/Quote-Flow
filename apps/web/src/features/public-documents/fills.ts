import type { CSSProperties } from 'react';

/** Fills a button with the business's brand color (inside a BrandedPage). */
export const BRAND_FILL = {
  backgroundColor: 'var(--doc-fill)',
  color: 'var(--doc-on-fill)',
} satisfies CSSProperties;

/**
 * A neutral fill for answers that should not look celebratory: near-black on a
 * light page, near-white on a dark one (the stone and surface tokens flip).
 */
export const NEUTRAL_FILL = {
  backgroundColor: 'var(--color-stone-900)',
  color: 'var(--color-surface)',
} satisfies CSSProperties;
