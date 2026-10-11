import type { PublicInvoiceDto } from '@quoteflow/shared';
import { Card } from '@/components/ui/Card';
import { TapeMeasure } from '@/components/ui/TapeMeasure';
import { TicketPart } from '@/components/ui/Ticket';
import { dueLabel } from '@/features/dashboard/dashboard-format';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';
import { SummaryFigure } from './SummaryAside';
import { isAwaitingPayment } from './public-status';

type PublicInvoice = PublicInvoiceDto['invoice'];

interface InvoiceAmountProps {
  invoice: PublicInvoice;
  businessName: string;
  /** 'YYYY-MM-DD' where the customer is. */
  today: string;
}

/** "Due in 10 days · Oct 20, 2026", or in red once it is overdue. */
function DueLine({ invoice, today }: { invoice: PublicInvoice; today: string }) {
  const overdue = invoice.status === 'overdue';
  const due = formatCalendarDate(invoice.dueDate);
  return (
    <p className={cn('mt-3.5 text-sm', overdue ? 'font-semibold text-overdue' : 'text-ink-2')}>
      {dueLabel(invoice.dueDate, today)} · {overdue ? `was due ${due}` : due}
    </p>
  );
}

/**
 * How much is paid so far, on a tape measure in the business's colour: the shade that reads on
 * paper, so even a white or pale brand shows how far the payments have come.
 */
function PaidProgress({ invoice }: { invoice: PublicInvoice }) {
  const { total } = invoice.totals;
  if (invoice.amountPaid <= 0 || total <= 0) return null;
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  return (
    <div className="mt-4">
      <TapeMeasure
        value={invoice.amountPaid / total}
        label={`${money(invoice.amountPaid)} of ${money(total)} paid`}
        className="[--color-primary:var(--doc-accent-text)]"
      />
      <p className="mt-2 flex flex-wrap justify-between gap-x-4 font-mono text-xs text-muted">
        <span>
          Paid <b className="font-semibold text-ink">{money(invoice.amountPaid)}</b>
        </span>
        <span>
          Total <b className="font-semibold text-ink">{money(total)}</b>
        </span>
      </p>
    </div>
  );
}

/** Payments happen outside QuoteFlow: the business records them, and the page then shows them. */
function PayDirectlyNote({ businessName }: { businessName: string }) {
  return (
    <p className="mt-4 text-[13px] text-pretty text-muted">
      Pay {businessName} directly. Payments they record show here.
    </p>
  );
}

/**
 * The figure a customer opening an unpaid invoice is looking for, above the document on phones
 * and tablets (the summary beside the document shows it on wide screens).
 */
export function AmountDueCard({ invoice, businessName, today }: InvoiceAmountProps) {
  return (
    <Card
      elevated
      aria-label="Amount due"
      role="region"
      className="animate-fade-in-up p-5 lg:hidden print:hidden"
    >
      <SummaryFigure label="Amount due" amount={formatMoney(invoice.balanceDue, invoice.currency)}>
        <DueLine invoice={invoice} today={today} />
      </SummaryFigure>
      <PaidProgress invoice={invoice} />
      <PayDirectlyNote businessName={businessName} />
    </Card>
  );
}

/** The invoice's figure as the first part of the summary beside the document. */
export function InvoiceSummaryPart({ invoice, businessName, today }: InvoiceAmountProps) {
  const awaiting = isAwaitingPayment(invoice);
  return (
    <TicketPart className="bg-(--doc-accent-soft) p-6">
      {awaiting ? (
        <>
          <SummaryFigure
            label="Amount due"
            amount={formatMoney(invoice.balanceDue, invoice.currency)}
          >
            <DueLine invoice={invoice} today={today} />
          </SummaryFigure>
          <PaidProgress invoice={invoice} />
          <PayDirectlyNote businessName={businessName} />
        </>
      ) : (
        <SummaryFigure
          label="Total"
          amount={formatMoney(invoice.totals.total, invoice.currency)}
          struck={invoice.status === 'cancelled'}
        >
          <p className="mt-3.5 text-sm text-ink-2">
            {invoice.status === 'cancelled' ? 'Cancelled: nothing to pay' : 'Paid in full'}
          </p>
        </SummaryFigure>
      )}
    </TicketPart>
  );
}
