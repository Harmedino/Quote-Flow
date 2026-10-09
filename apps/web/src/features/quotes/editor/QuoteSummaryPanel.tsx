import type { CurrencyCode, DiscountInput } from '@quoteflow/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DocumentTotalsSummary } from '@/features/documents/DocumentTotalsSummary';
import type { LineItemDraft } from '@/features/documents/line-items';
import { cn } from '@/lib/cn';
import type { EditorAction, SaveIntent } from './editor-actions';
import type { SelectedCustomer } from './selected-customer';

export interface QuoteSummaryPanelProps {
  title: string;
  customer: SelectedCustomer | null;
  items: LineItemDraft[];
  discount: DiscountInput | null;
  taxRate: number;
  currency: CurrencyCode;
  actions: EditorAction[];
  pendingIntent: SaveIntent | null;
  onAction: (intent: SaveIntent) => void;
  className?: string;
}

/** The sticky side panel on wide screens: who it is for, live totals and the save actions. */
export function QuoteSummaryPanel({
  title,
  customer,
  items,
  discount,
  taxRate,
  currency,
  actions,
  pendingIntent,
  onAction,
  className,
}: QuoteSummaryPanelProps) {
  const filled = items.filter((item) => item.name.trim()).length;
  return (
    <Card className={cn('p-5', className)}>
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <dl className="mt-4 space-y-3 border-b border-zinc-200 pb-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600">Customer</dt>
          <dd className="min-w-0 truncate text-right font-medium text-zinc-950">
            {customer?.name ?? <span className="font-normal text-zinc-400">Not selected</span>}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-600">Items</dt>
          <dd className="font-medium text-zinc-950 tabular-nums">{filled}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <DocumentTotalsSummary
          items={items}
          discount={discount}
          taxRate={taxRate}
          currency={currency}
        />
      </div>
      <div className="mt-6 grid gap-2.5">
        {actions.map((action) => (
          <Button
            key={action.intent}
            variant={action.variant}
            size="lg"
            className="w-full"
            loading={pendingIntent === action.intent}
            aria-disabled={(pendingIntent !== null && pendingIntent !== action.intent) || undefined}
            onClick={() => onAction(action.intent)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {actions.some((action) => action.intent === 'draft') && (
        <p className="mt-3 text-xs text-pretty text-zinc-500">
          Drafts stay private. Sending gives you a link to share by WhatsApp or email.
        </p>
      )}
    </Card>
  );
}
