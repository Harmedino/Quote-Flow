import type { CurrencyCode, DiscountInput } from '@quoteflow/shared';
import { Button } from '@/components/ui/Button';
import { draftTotals, type LineItemDraft } from '@/features/documents/line-items';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import type { EditorAction, SaveIntent } from './editor-actions';

export interface MobileActionBarProps {
  items: LineItemDraft[];
  discount: DiscountInput | null;
  taxRate: number;
  currency: CurrencyCode;
  actions: EditorAction[];
  pendingIntent: SaveIntent | null;
  onAction: (intent: SaveIntent) => void;
  className?: string;
}

/** Total and save actions pinned to the bottom of the screen below the wide layout. */
export function MobileActionBar({
  items,
  discount,
  taxRate,
  currency,
  actions,
  pendingIntent,
  onAction,
  className,
}: MobileActionBarProps) {
  const totals = draftTotals(items, discount, taxRate);
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_16px_-8px_rgb(0_0_0/0.12)] backdrop-blur-sm sm:px-6 lg:left-64',
        className,
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-3">
        <p className="mr-auto text-sm text-zinc-600">
          Total{' '}
          <span className="ml-1 text-lg font-semibold text-zinc-950 tabular-nums">
            {totals ? formatMoney(totals.total, currency) : '—'}
          </span>
        </p>
        <div className="flex w-full gap-2.5 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
          {[...actions].reverse().map((action) => (
            <Button
              key={action.intent}
              variant={action.variant}
              loading={pendingIntent === action.intent}
              aria-disabled={
                (pendingIntent !== null && pendingIntent !== action.intent) || undefined
              }
              onClick={() => onAction(action.intent)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
