import { formatKobo, naira } from '../sample-money';
import { priceSampleQuote } from './sample-quote';
import type { SampleQuote } from './trade-details';

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className={strong ? 'font-semibold text-stone-900' : 'text-stone-600'}>{label}</dt>
      <dd
        className={
          strong
            ? 'font-display text-lg font-semibold tracking-tight text-stone-900 tabular-nums'
            : 'text-stone-700 tabular-nums'
        }
      >
        {value}
      </dd>
    </div>
  );
}

/** A quote as QuoteFlow would total it, written out in HTML on the Solutions page. */
export function SampleQuoteCard({ quote }: { quote: SampleQuote }) {
  const { lines, totals } = priceSampleQuote(quote);
  const discountLabel =
    quote.discount?.type === 'percentage' ? `Discount (${quote.discount.value}%)` : 'Discount';

  return (
    <figure className="rounded-2xl bg-stone-50 p-3 sm:p-4">
      <figcaption className="flex items-baseline justify-between gap-3 px-1">
        <span className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
          Sample quote
        </span>
        <span className="font-mono text-xs text-stone-600">{quote.number}</span>
      </figcaption>
      <p className="mt-1 px-1 text-sm text-stone-700">For {quote.customer}</p>
      <ul className="mt-2 divide-y divide-stone-200/70">
        {lines.map((line) => (
          <li key={line.name} className="flex items-start justify-between gap-3 px-1 py-2 text-sm">
            <span className="min-w-0">
              <span className="block text-stone-800">{line.name}</span>
              <span className="block text-xs text-stone-500 tabular-nums">
                {line.quantity.toLocaleString('en-NG')}
                {line.unit && ` ${line.unit}`} × {naira(line.rate)}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-stone-900 tabular-nums">
              {formatKobo(line.amount)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-1 border-t border-stone-200 px-1 pt-2 text-sm">
        {(totals.discount > 0 || totals.tax > 0) && (
          <TotalRow label="Subtotal" value={formatKobo(totals.subtotal)} />
        )}
        {totals.discount > 0 && (
          <TotalRow label={discountLabel} value={`−${formatKobo(totals.discount)}`} />
        )}
        {totals.tax > 0 && (
          <TotalRow label={`Tax (${quote.taxRate}%)`} value={formatKobo(totals.tax)} />
        )}
        <TotalRow label="Total" value={formatKobo(totals.total)} strong />
      </dl>
    </figure>
  );
}
