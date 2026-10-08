import type { CSSProperties } from 'react';

/** Fills a button with the business's brand color (from `brandColorVars`). */
export const BRAND_FILL = {
  backgroundColor: 'var(--doc-accent)',
  color: 'var(--doc-on-accent)',
} satisfies CSSProperties;

/** A neutral dark fill for answers that should not look celebratory. */
export const INK_FILL = { backgroundColor: '#18181b', color: '#ffffff' } satisfies CSSProperties;
