import type { CurrencyCode, DiscountInput } from '@quoteflow/shared';
import { UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { DocumentTotalsSummary } from '@/features/documents/DocumentTotalsSummary';
import { draftTotals, type LineItemDraft } from '@/features/documents/line-items';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
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

/**
 * The side panel of the quote and invoice builders, as a ticket: a stub with the live total and
 * who it is for, the breakdown, then the save buttons.
 */
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
  const totals = draftTotals(items, discount, taxRate);
  return (
    <div className={cn('lift ticket-col', className)}>
      <div className="bg-primary-tint px-5 pt-5 pb-4">
        <h2 className="label-mono text-ink-2">{title}</h2>
        <p className="mt-2.5 figure text-[1.75rem] wrap-anywhere text-ink">
          {totals ? formatMoney(totals.total, currency) : '—'}
        </p>
        <div className="mt-4 flex items-center gap-3">
          {customer ? (
            <Avatar name={customer.name} size="sm" />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-dashed border-edge text-muted">
              <UserRound aria-hidden="true" className="size-4" />
            </span>
          )}
          <div className="min-w-0 text-sm">
            <p className={cn('truncate font-semibold', customer ? 'text-ink' : 'text-ink-2')}>
              {customer?.name ?? 'No customer yet'}
            </p>
            <p className="text-[12.5px] text-ink-2">
              {count === 0 ? 'No items yet' : `${count} ${count === 1 ? 'item' : 'items'}`}
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        <DocumentTotalsSummary
          items={items}
          discount={discount}
          taxRate={taxRate}
          currency={currency}
        />
      </div>
      <div className="space-y-3 px-5 py-5">
        <div className="grid gap-2.5">{children}</div>
        {note && <p className="text-[12.5px] text-pretty text-muted">{note}</p>}
      </div>
    </div>
  );
}
