import type { CurrencyCode, DiscountInput } from '@quoteflow/shared';
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { DocumentTotalsSummary } from '@/features/documents/DocumentTotalsSummary';
import type { LineItemDraft } from '@/features/documents/line-items';
import { cn } from '@/lib/cn';
import { filledItemCount } from './editor-summary';
import type { SelectedCustomer } from './selected-customer';

export interface QuoteSummaryPanelProps {
  title: string;
  customer: SelectedCustomer | null;
  items: LineItemDraft[];
  discount: DiscountInput | null;
  taxRate: number;
  currency: CurrencyCode;
  /** The save buttons, main action first. */
  children: ReactNode;
  /** A short line under the buttons. */
  note?: string;
  className?: string;
}

/** The sticky side panel of the quote and invoice builders: who it is for, live totals, save. */
export function QuoteSummaryPanel({
  title,
  customer,
  items,
  discount,
  taxRate,
  currency,
  children,
  note,
  className,
}: QuoteSummaryPanelProps) {
  const count = filledItemCount(items);
  return (
    <Card className={cn('space-y-5 p-6', className)}>
      <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
      <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
        {customer ? (
          <Avatar name={customer.name} size="sm" />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-400">
            <UserRound aria-hidden="true" className="size-4" />
          </span>
        )}
        <div className="min-w-0 text-sm">
          <p className={cn('truncate font-medium', customer ? 'text-stone-900' : 'text-stone-500')}>
            {customer?.name ?? 'No customer yet'}
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            {count === 0 ? 'No items yet' : `${count} ${count === 1 ? 'item' : 'items'}`}
          </p>
        </div>
      </div>
      <DocumentTotalsSummary
        items={items}
        discount={discount}
        taxRate={taxRate}
        currency={currency}
      />
      <div className="grid gap-2.5">{children}</div>
      {note && <p className="text-xs text-pretty text-stone-500">{note}</p>}
    </Card>
  );
}
