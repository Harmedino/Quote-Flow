import { Button } from '@/components/ui/Button';
import { AcceptButton } from './AcceptButton';

export interface QuoteActionBarProps {
  total: string;
  validUntil: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Accept / Decline, always within reach below the wide layout (where QuoteSummary takes over):
 * pinned to the bottom of the screen on phones, with the total on its own line so a long
 * amount is never cut short, and floating at the bottom of the viewport on tablets.
 */
export function QuoteActionBar({ total, validUntil, onAccept, onDecline }: QuoteActionBarProps) {
  return (
    <section
      aria-label="Respond to this quote"
      className="sticky bottom-0 z-20 -mx-4 mt-6 sm:bottom-4 sm:mx-0 lg:hidden print:hidden"
    >
      <div className="border-t border-stone-200 bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(12_26_20/0.18)] backdrop-blur-md sm:rounded-2xl sm:border sm:py-4 sm:pr-4 sm:pl-6 sm:shadow-[var(--shadow-elevated)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 sm:flex-nowrap sm:gap-4">
          <div className="flex min-w-0 basis-full items-baseline justify-between gap-3 sm:block sm:flex-1 sm:basis-auto">
            <p className="text-sm text-stone-500">
              Total<span className="hidden sm:inline"> · valid until {validUntil}</span>
            </p>
            <p className="min-w-0 text-right font-display text-xl font-semibold tracking-tight wrap-break-word text-stone-900 tabular-nums sm:text-left sm:text-2xl">
              {total}
            </p>
          </div>
          <Button
            variant="secondary"
            size="xl"
            onClick={onDecline}
            className="flex-1 px-4 sm:flex-none sm:px-5"
          >
            Decline
          </Button>
          <AcceptButton onClick={onAccept} className="flex-1 px-4 sm:flex-none sm:px-6">
            <span className="sm:hidden">Accept</span>
            <span className="hidden sm:inline">Accept quote</span>
          </AcceptButton>
        </div>
      </div>
    </section>
  );
}
