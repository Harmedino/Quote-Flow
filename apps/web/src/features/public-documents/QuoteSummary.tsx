import { TicketPart } from '@/components/ui/Ticket';
import { Button } from '@/components/ui/Button';
import { AcceptButton } from './AcceptButton';
import { NO_ACCOUNT_NOTE } from './QuoteActionBar';
import { SummaryAside, SummaryFigure } from './SummaryAside';

export interface QuoteSummaryProps {
  total: string;
  validUntil: string;
  /** E.g. "9 days left", while the quote waits for an answer. */
  validityNote?: string;
  /** Whether the quote can still be answered: shows Accept and Decline. */
  live: boolean;
  /** Crosses the total out, once the quote is declined. */
  struck: boolean;
  pdfUrl: string;
  pdfFileName: string;
  onAccept: () => void;
  onDecline: () => void;
}

/** Beside the quote on wide screens: the total, the answer buttons and the PDF. */
export function QuoteSummary({
  total,
  validUntil,
  validityNote,
  live,
  struck,
  pdfUrl,
  pdfFileName,
  onAccept,
  onDecline,
}: QuoteSummaryProps) {
  return (
    <SummaryAside label="Quote summary" pdfUrl={pdfUrl} pdfFileName={pdfFileName}>
      <TicketPart className="bg-(--doc-accent-soft) p-6">
        <SummaryFigure label="Total to pay" amount={total} struck={struck}>
          <p className="mt-3.5 text-sm text-ink-2">
            Valid until {validUntil}
            {validityNote && (
              <span className="font-[650] text-(--doc-accent-text)"> · {validityNote}</span>
            )}
          </p>
        </SummaryFigure>
      </TicketPart>
      {live && (
        <TicketPart className="grid gap-2.5 p-5">
          <AcceptButton onClick={onAccept} className="w-full" />
          <Button variant="secondary" size="lg" onClick={onDecline} className="w-full">
            Decline
          </Button>
          <p className="pt-1 text-center text-xs text-muted">{NO_ACCOUNT_NOTE}</p>
        </TicketPart>
      )}
    </SummaryAside>
  );
}
