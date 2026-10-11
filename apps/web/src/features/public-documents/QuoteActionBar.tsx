import { Button } from '@/components/ui/Button';
import { AcceptButton } from './AcceptButton';

export interface QuoteActionBarProps {
  total: string;
  validUntil: string;
  onAccept: () => void;
  onDecline: () => void;
}

/** Said under both ways of answering, on phones and beside the quote alike. */
export const NO_ACCOUNT_NOTE = 'One tap. No app or account needed.';

/**
 * Decline / Accept, always within reach below the wide layout (where QuoteSummary takes over):
 * pinned to the bottom of the screen on phones and floating there on tablets, with the total
 * above the buttons so a long amount is never cut short. Render it in an AnswerBarSlot.
 */
export function QuoteActionBar({ total, validUntil, onAccept, onDecline }: QuoteActionBarProps) {
  return (
    <section
      aria-label="Your answer"
      // The tablet's margin around the floating bar lets clicks through to the page.
      className="pointer-events-none sm:px-6 sm:pb-4 lg:hidden print:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl bg-surface px-4 pt-3 pb-[max(1.125rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-line),0_-10px_30px_rgb(14_27_51/0.08)] sm:rounded-xl sm:px-5 sm:pb-4 sm:shadow-(--shadow-elevated)">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-[13px] text-muted">Total · valid until {validUntil}</p>
          <p className="text-xl font-extrabold tracking-[-0.01em] tabular-nums font-stretch-112%">
            {total}
          </p>
        </div>
        <div className="mt-2.5 grid grid-cols-[1fr_1.7fr] gap-2.5">
          <Button variant="secondary" size="xl" onClick={onDecline} className="max-[359px]:px-3">
            Decline
          </Button>
          <AcceptButton
            onClick={onAccept}
            className="max-[359px]:px-3 max-[359px]:[&_svg]:hidden"
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted">{NO_ACCOUNT_NOTE}</p>
      </div>
    </section>
  );
}
