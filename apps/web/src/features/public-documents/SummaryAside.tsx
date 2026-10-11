import type { ReactNode } from 'react';
import { Ticket, TicketPart } from '@/components/ui/Ticket';
import { cn } from '@/lib/cn';
import { DownloadPdfLink } from './DownloadPdfLink';

export interface SummaryAsideProps {
  /** E.g. 'Quote summary'. */
  label: string;
  pdfUrl: string;
  pdfFileName: string;
  /** The parts above the PDF link, each a TicketPart: the figure, then any answer buttons. */
  children: ReactNode;
}

/**
 * A small ticket beside the document on wide screens, kept in view while the customer reads. It
 * replaces the PDF button under the document and, for quotes, the pinned answer bar.
 */
export function SummaryAside({ label, pdfUrl, pdfFileName, children }: SummaryAsideProps) {
  return (
    <aside
      aria-label={label}
      className="sticky top-6 hidden animate-fade-in-up lg:block print:hidden"
    >
      <Ticket lift="high" className="[--notch:10px]">
        {children}
        <TicketPart className="p-5">
          <DownloadPdfLink href={pdfUrl} fileName={pdfFileName} className="w-full" />
        </TicketPart>
      </Ticket>
    </aside>
  );
}

/**
 * The figure that matters, in Archivo's wide heavy cut over a line of the business's colour, e.g.
 * "Total to pay ₦46,225.00". `struck` crosses it out, as on a declined quote.
 */
export function SummaryFigure({
  label,
  amount,
  struck = false,
  children,
}: {
  label: string;
  amount: string;
  struck?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="label-mono text-ink-2">{label}</p>
      <p className="mt-3 text-[32px] leading-none font-[820] tracking-[-0.02em] wrap-anywhere tabular-nums font-stretch-115%">
        <span
          className={cn(
            struck
              ? 'text-muted line-through decoration-declined decoration-2'
              : 'shadow-[inset_0_-5px_0_color-mix(in_srgb,var(--doc-accent)_30%,transparent)]',
          )}
        >
          {amount}
        </span>
      </p>
      {children}
    </div>
  );
}
