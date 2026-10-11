import type { InvoiceDto, InvoiceStatus } from '@quoteflow/shared';
import { TapeMeasure } from '@/components/ui/TapeMeasure';
import { DocumentHero, type DocumentHeroTone } from '@/features/documents/DocumentHero';
import { formatMoney } from '@/lib/format';
import { invoiceOutlook } from './invoice-view';

export interface InvoiceHeroProps {
  invoice: InvoiceDto;
  /** Today in the business time zone, 'YYYY-MM-DD'. */
  today: string;
  timeZone: string;
  className?: string;
}

const TONES: Record<InvoiceStatus, DocumentHeroTone> = {
  draft: 'open',
  sent: 'open',
  partially_paid: 'open',
  overdue: 'overdue',
  paid: 'settled',
  cancelled: 'ended',
};

/** Why nothing is being collected yet, when payments aren't tracked. */
function untrackedNote(status: InvoiceStatus): string {
  return status === 'cancelled'
    ? 'Nothing to collect: the invoice was cancelled.'
    : 'Payments are tracked once it’s sent.';
}

/** What is still owed and when it is due, then how much has come in so far on a tape measure. */
export function InvoiceHero({ invoice, today, timeZone, className }: InvoiceHeroProps) {
  const outlook = invoiceOutlook(invoice, today, timeZone);
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const paid = `${money(invoice.amountPaid)} of ${money(invoice.totals.total)} paid`;
  return (
    <DocumentHero
      label={outlook.label}
      amount={money(outlook.amount)}
      detail={outlook.line}
      tone={TONES[invoice.status]}
      className={className}
    >
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="label-mono text-muted">Collected</h2>
          <p className="font-mono text-[13px] font-semibold text-ink-2">
            {Math.round((outlook.paidShare ?? 0) * 100)}%
          </p>
        </div>
        <TapeMeasure value={outlook.paidShare ?? 0} label={paid} className="mt-3.5" />
        {outlook.paidShare === null ? (
          <p className="mt-3 text-[13.5px] text-muted">{untrackedNote(invoice.status)}</p>
        ) : (
          <p className="mt-3 text-[13.5px] text-ink-2">
            <span className="money text-ink">{money(invoice.amountPaid)}</span> of{' '}
            <span className="font-mono">{money(invoice.totals.total)}</span> paid
            {invoice.payments.length > 0 &&
              ` · ${invoice.payments.length} ${invoice.payments.length === 1 ? 'payment' : 'payments'}`}
          </p>
        )}
      </div>
    </DocumentHero>
  );
}
