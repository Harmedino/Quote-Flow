import { Button } from '@/components/ui/Button';
import { AcceptButton } from './AcceptButton';
import { SummaryAside, SummaryFigure } from './SummaryAside';

export interface QuoteSummaryProps {
  total: string;
  validUntil: string;
  /** Whether the quote can still be answered: shows Accept and Decline. */
  live: boolean;
  pdfUrl: string;
  pdfFileName: string;
  onAccept: () => void;
  onDecline: () => void;
}

/** Beside the quote on wide screens: the total, the answer buttons and the PDF. */
export function QuoteSummary({
  total,
  validUntil,
  live,
  pdfUrl,
  pdfFileName,
  onAccept,
  onDecline,
}: QuoteSummaryProps) {
  return (
    <SummaryAside label="Quote summary" pdfUrl={pdfUrl} pdfFileName={pdfFileName}>
      <SummaryFigure label="Total" amount={total}>
        <p className="mt-1 text-sm text-stone-600">Valid until {validUntil}</p>
      </SummaryFigure>
      {live && (
        <div className="grid gap-2.5">
          <AcceptButton onClick={onAccept} className="w-full" />
          <Button variant="secondary" size="xl" onClick={onDecline} className="w-full">
            Decline
          </Button>
          <p className="pt-1 text-center text-xs text-stone-500">No account needed to answer.</p>
        </div>
      )}
    </SummaryAside>
  );
}
