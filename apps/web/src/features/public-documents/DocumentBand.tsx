import { cn } from '@/lib/cn';

/**
 * The colour band across the top of a customer's page, behind its first card: plain ink from
 * PublicDocumentLayout under every state (loading, errors), covered by the business's colour
 * once a document arrives (`branded`, inside a BrandedPage). It sits behind the page's content
 * in the layout's `main`, which is its positioned ancestor and stacking context.
 */
export function DocumentBand({ branded = false }: { branded?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-x-0 top-0 -z-10 h-40 sm:h-56 print:hidden',
        branded ? 'bg-(--doc-accent)' : 'bg-ink',
        // A faint white wash keeps a near-black band distinct from the dark page.
        'dark:bg-linear-to-b dark:from-white/6 dark:to-white/6',
      )}
    />
  );
}
