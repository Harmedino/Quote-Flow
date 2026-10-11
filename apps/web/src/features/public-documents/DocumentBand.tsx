import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const TONES = {
  /** The business's colour (inside a BrandedPage), edged when it is as light as the page. */
  brand: 'border-b border-(--doc-fill-edge) bg-(--doc-fill) text-(--doc-on-fill)',
  /** No document to show: QuoteFlow's own navy. */
  navy: 'bg-navy text-on-navy',
  /** While the document loads. */
  loading: 'bg-canvas-deep',
} as const;

/** Lines the band's content up with the document column below it. */
export const PAGE_COLUMN = 'mx-auto w-full max-w-3xl lg:max-w-[68rem]';

/**
 * The colour band across the top of a customer's page. It runs deep enough for the document
 * below (DocumentColumns) to overlap its lower edge, like a ticket laid on a coloured folder.
 */
export function DocumentBand({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children?: ReactNode;
}) {
  return (
    <div className={cn('px-4 pt-4.5 pb-21 sm:px-6 sm:pt-6 lg:pb-30 print:hidden', TONES[tone])}>
      <div className={PAGE_COLUMN}>{children}</div>
    </div>
  );
}

/**
 * The page under the band: the document column, pulled up over the band, and from `lg` the
 * summary beside it, which stays in view while the customer reads.
 */
export function DocumentColumns({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative -mt-16 px-3 sm:px-6 lg:-mt-24">
      <div
        className={cn(
          PAGE_COLUMN,
          aside ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8' : null,
        )}
      >
        <div className="min-w-0 space-y-4">{children}</div>
        {aside}
      </div>
    </div>
  );
}
