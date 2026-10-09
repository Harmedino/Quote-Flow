import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@quoteflow/shared';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';

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
    <div role="group" aria-label="Filter invoices by status" className={TAB_SCROLLER_CLASSES}>
      <div className={TAB_LIST_CLASSES}>
        {TABS.map((status) => {
          const selected = status === value;
          return (
            <button
              key={status ?? 'all'}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(status)}
              className={tabClasses(selected)}
            >
              {status ? INVOICE_STATUS_LABELS[status] : 'All'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
