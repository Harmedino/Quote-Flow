import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { PageHero } from '@/components/marketing/PageHero';
import { Reveal } from '@/components/marketing/Reveal';
import { TRADES } from '@/components/marketing/trades';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { DayTimeline } from './solutions/DayTimeline';
import { TRADE_DETAILS } from './solutions/trade-details';
import { TradeCard } from './solutions/TradeCard';
import { TradePhotos } from './solutions/TradePhotos';

export default function SolutionsPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="Who it’s for" />
      <PageHero
        grid
        title="Who it’s for"
        description="If you price a job before you do it, QuoteFlow fits. Here’s what quotes look like in different trades, with sample prices in naira."
      >
        <nav aria-label="Trades" className="mt-10">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {TRADES.map((trade) => (
              <li key={trade.id} className="shrink-0">
                <a
                  href={`#${trade.id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 focus-visible:outline-highlight"
                >
                  <trade.icon aria-hidden="true" className="size-4 text-highlight" />
                  {trade.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <section
        aria-label="Trades at work"
        className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8"
      >
        <TradePhotos />
      </section>

      <section
        aria-label="Sample quotes by trade"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TRADES.map((trade, index) => (
            <li key={trade.id}>
              <Reveal delay={(index % 3) * 60} className="h-full">
                <TradeCard trade={trade} details={TRADE_DETAILS[trade.id]} />
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <DayTimeline />
      <CtaBand
        title="Not sure it fits your business?"
        description={
          liveDemo
            ? 'Look around the demo business, or set up yours and send a quote today. It’s free while we’re in early access.'
            : 'Set up your business and send a quote today. It’s free while we’re in early access.'
        }
      />
    </>
  );
}
