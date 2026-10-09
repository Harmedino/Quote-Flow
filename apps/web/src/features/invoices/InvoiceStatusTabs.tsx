import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@quoteflow/shared';
import { cn } from '@/lib/cn';

const TABS: readonly (InvoiceStatus | null)[] = [
  null,
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
];

export interface InvoiceStatusTabsProps {
  value: InvoiceStatus | null;
  onChange: (status: InvoiceStatus | null) => void;
}

/** Status filter. It changes the URL rather than switching panels, so it is a set of toggle buttons. */
export function InvoiceStatusTabs({ value, onChange }: InvoiceStatusTabsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by status"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
    >
      {TABS.map((status) => {
        const selected = status === value;
        return (
          <button
            key={status ?? 'all'}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(status)}
            className={cn(
              'h-9 shrink-0 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors',
              selected
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
            )}
          >
            {status ? INVOICE_STATUS_LABELS[status] : 'All'}
          </button>
        );
      })}
    </div>
  );
}
