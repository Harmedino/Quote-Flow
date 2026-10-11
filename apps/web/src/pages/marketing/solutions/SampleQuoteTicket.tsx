import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { formatKobo, naira } from '../sample-money';
import { priceSampleQuote } from './sample-quote';
import type { SampleQuote } from './trade-details';

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="text-ink-2">{label}</dt>
      <dd className="money text-[13.5px] text-ink">{value}</dd>
    </div>
  );
}

/**
 * A trade's sample quote as a job ticket, totalled with QuoteFlow's own maths: the stub with
 * the number and the customer, the job, then the totals and the amount to pay.
 */
export function SampleQuoteTicket({
  quote,
  className,
}: {
  quote: SampleQuote;
  className?: string;
}) {
  const { lines, totals } = priceSampleQuote(quote);
  const discountLabel =
    quote.discount?.type === 'percentage' ? `Discount (${quote.discount.value}%)` : 'Discount';

  return (
    <div className={cn('lift ticket-col', className)}>
      <div className="bg-primary-tint px-5 pt-4 pb-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="label-mono text-ink-2">Quotation</p>
          <Badge>Sample</Badge>
        </div>
        <p className="mt-2 text-[1.6875rem] leading-none font-[820] text-ink font-stretch-125%">
          {quote.number}
        </p>
        <p className="mt-3 text-sm text-ink-2">
          Prepared for <b className="font-semibold text-ink">{quote.customer}</b>
        </p>
      </div>
      <div className="px-5 pt-3 pb-4 sm:px-6">
        <p className="flex justify-between pt-2 pb-1 label-mono text-muted">
          <span>The job</span>
          <span>Amount</span>
        </p>
        <ul>
          {lines.map((line) => (
            <li
              key={line.name}
              className="flex items-start justify-between gap-4 border-b-[1.5px] border-dashed border-line-strong py-3 last:border-b-0"
            >
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold text-ink">{line.name}</span>
                <span className="mt-0.5 block font-mono text-[12.5px] text-ink-2">
                  {line.quantity.toLocaleString('en-NG')}
                  {line.unit && ` ${line.unit}`} × {naira(line.rate)}
                </span>
              </span>
              <span className="money shrink-0 text-sm text-ink">{formatKobo(line.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-5 pt-4 pb-5 sm:px-6">
        {(totals.discount > 0 || totals.tax > 0) && (
          <dl className="mb-3 text-sm">
            <TotalRow label="Subtotal" value={formatKobo(totals.subtotal)} />
            {totals.discount > 0 && (
              <TotalRow label={discountLabel} value={`−${formatKobo(totals.discount)}`} />
            )}
            {totals.tax > 0 && (
              <TotalRow label={`Tax (${quote.taxRate}%)`} value={formatKobo(totals.tax)} />
            )}
          </dl>
        )}
        <div className="flex items-center justify-between gap-3 rounded-[10px] bg-surface-muted px-4 py-3.5">
          <span className="label-mono text-ink-2">Total to pay</span>
          <span className="figure text-[1.375rem] text-ink sm:text-[1.6875rem]">
            {formatKobo(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}
