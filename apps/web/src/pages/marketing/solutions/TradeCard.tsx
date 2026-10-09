import type { Trade } from '@/components/marketing/trades';
import { SampleQuoteCard } from './SampleQuoteCard';
import type { TradeDetails } from './trade-details';

export function TradeCard({ trade, details }: { trade: Trade; details: TradeDetails }) {
  return (
    <article
      id={trade.id}
      aria-labelledby={`${trade.id}-title`}
      className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-stone-200 bg-surface p-5 sm:p-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <trade.icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
        <h2
          id={`${trade.id}-title`}
          className="text-xl font-semibold tracking-tight text-stone-900"
        >
          {trade.name}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-pretty text-stone-600">{details.pain}</p>
      <div className="mt-5">
        <SampleQuoteCard quote={details.quote} />
      </div>
      <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-stone-700 marker:text-stone-400">
        {details.wins.map((win) => (
          <li key={win}>{win}</li>
        ))}
      </ul>
    </article>
  );
}
