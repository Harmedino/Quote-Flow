import type { InvoiceDto } from '@quoteflow/shared';
import { DocumentHero } from '@/features/documents/DocumentHero';
import { formatMoney } from '@/lib/format';
import { invoiceOutlook } from './invoice-view';

export interface InvoiceHeroProps {
  invoice: InvoiceDto;
  /** Today in the business time zone, 'YYYY-MM-DD'. */
  today: string;
  timeZone: string;
  className?: string;
}

/** What is still owed, when it is due, and how much has come in so far. */
export function InvoiceHero({ invoice, today, timeZone, className }: InvoiceHeroProps) {
  const outlook = invoiceOutlook(invoice, today, timeZone);
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  return (
    <DocumentHero label={outlook.label} amount={money(outlook.amount)} className={className}>
      <p className="mt-2 text-sm text-white/70">{outlook.line}</p>
      {outlook.paidShare !== null && (
        <div className="mt-6">
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full animate-grow-width rounded-full bg-highlight"
              style={{ width: `${outlook.paidShare * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-white/70">
            <span className="font-medium text-white">{money(invoice.amountPaid)}</span> of{' '}
            {money(invoice.totals.total)} paid
          </p>
        </div>
      )}
    </DocumentHero>
  );
}
