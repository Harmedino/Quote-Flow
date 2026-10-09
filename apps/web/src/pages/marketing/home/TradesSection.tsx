import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { Reveal } from '@/components/marketing/Reveal';
import { SectionHeading } from '@/components/marketing/SectionHeading';
import { TRADES, tradePath } from '@/components/marketing/trades';

/** Who QuoteFlow is for, each trade linking to its card on the Solutions page. */
export function TradesSection() {
  return (
    <section aria-labelledby="trades-title" className="border-t border-stone-200/70">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
          <SectionHeading
            id="trades-title"
            eyebrow="Who it’s for"
            title="For businesses that price the job before they do it."
            description="Cleaners, plumbers, electricians, AC and solar technicians, painters, carpenters, decorators, caterers, photographers and makeup artists. First in Nigeria, in any currency."
          />
        </Reveal>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRADES.map((trade, index) => (
            <li key={trade.id}>
              <Reveal delay={(index % 3) * 60} className="h-full">
                <Link
                  to={tradePath(trade)}
                  className="group flex h-full items-start gap-4 rounded-3xl border border-stone-200 bg-surface p-5 transition-colors hover:border-stone-400 sm:p-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <trade.icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-semibold text-stone-900">{trade.name}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-stone-600">
                      {trade.jobs}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-stone-700"
                  />
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
