import type { ReactNode } from 'react';
import { DownloadPdfLink } from './DownloadPdfLink';

export interface SummaryAsideProps {
  /** E.g. 'Quote summary'. */
  label: string;
  pdfUrl: string;
  pdfFileName: string;
  /** The figure that matters and any answer buttons, above the PDF link. */
  children: ReactNode;
}

/**
 * The card beside the document on wide screens, kept in view while the customer reads. It
 * replaces the header's PDF button and, for quotes, the floating Accept / Decline bar.
 */
export function SummaryAside({ label, pdfUrl, pdfFileName, children }: SummaryAsideProps) {
  return (
    <aside
      aria-label={label}
      className="sticky top-6 hidden animate-fade-in-up space-y-5 rounded-3xl border border-stone-200 bg-surface p-6 lg:block print:hidden"
    >
      {children}
      <DownloadPdfLink href={pdfUrl} fileName={pdfFileName} className="w-full" />
    </aside>
  );
}

/** A label, a big amount and a line under it, e.g. "Total · ₦250,000.00 · Valid until …". */
export function SummaryFigure({
  label,
  amount,
  children,
}: {
  label: string;
  amount: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tracking-tight wrap-anywhere text-stone-900 tabular-nums">
        {amount}
      </p>
      {children}
    </div>
  );
}
