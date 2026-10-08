import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BRAND_FILL } from './fills';

export interface QuoteActionBarProps {
  total: string;
  validUntil: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Accept / Decline, always within reach: pinned to the bottom of the screen
 * on phones and floating at the bottom of the viewport on larger screens
 * until the end of the document is reached.
 */
export function QuoteActionBar({ total, validUntil, onAccept, onDecline }: QuoteActionBarProps) {
  return (
    <section
      aria-label="Respond to this quote"
      className="sticky bottom-0 z-20 -mx-4 mt-6 sm:bottom-4 sm:mx-0 print:hidden"
    >
      <div className="border-t border-zinc-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)] backdrop-blur sm:rounded-2xl sm:border sm:border-zinc-200 sm:p-5 sm:shadow-lg">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500 sm:text-sm">
              Total<span className="hidden sm:inline"> · valid until {validUntil}</span>
            </p>
            <p className="truncate text-lg font-semibold tracking-tight text-zinc-950 tabular-nums sm:text-xl">
              {total}
            </p>
          </div>
          <Button variant="secondary" size="lg" onClick={onDecline} className="px-4 sm:px-5">
            Decline
          </Button>
          <Button
            size="lg"
            style={BRAND_FILL}
            onClick={onAccept}
            className="px-4 hover:brightness-95 active:brightness-90 sm:px-6"
          >
            <Check aria-hidden="true" className="hidden sm:block" />
            <span className="sm:hidden">Accept</span>
            <span className="hidden sm:inline">Accept quote</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
