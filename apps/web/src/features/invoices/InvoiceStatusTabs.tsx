import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@quoteflow/shared';
import { CountChip } from '@/components/ui/CountChip';
import { TAB_LIST_CLASSES, TAB_SCROLLER_CLASSES, tabClasses } from '@/components/ui/tab-styles';
import { useDashboardQuery } from '@/features/dashboard/use-dashboard';

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

/**
 * Status filter. It changes the URL rather than switching panels, so it is a set of toggle
 * buttons. Overdue carries the red count the top bar shows.
 */
export function InvoiceStatusTabs({ value, onChange }: InvoiceStatusTabsProps) {
  const overdue = useDashboardQuery().data?.invoices.overdueCount ?? 0;
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
              {status === 'overdue' && overdue > 0 && (
                <CountChip tone="alert" label="invoices">
                  {overdue}
                </CountChip>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
