import { DocumentTitle } from '@/components/DocumentTitle';
import { CtaBand } from '@/components/marketing/CtaBand';
import { PageHero } from '@/components/marketing/PageHero';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { TRADES } from '@/components/marketing/trades';
import { useLiveDemo } from '@/components/marketing/use-demo-status';
import { cn } from '@/lib/cn';
import { DayTimeline } from './solutions/DayTimeline';
import { TRADE_DETAILS } from './solutions/trade-details';
import { TradeRow } from './solutions/TradeRow';
import { TradePhotos } from './solutions/TradePhotos';

export default function SolutionsPage() {
  const liveDemo = useLiveDemo();

  return (
    <>
      <DocumentTitle title="Who it’s for" />
      <PageHero
        eyebrow="Solutions"
        title="Who it’s for"
        description="If you price a job before you do it, QuoteFlow fits. Here’s what quotes look like in different trades, with sample prices in naira."
      >
        <nav aria-label="Trades" className="mt-9">
          <ul className="flex flex-wrap gap-2">
            {TRADES.map((trade) => (
              <li key={trade.id}>
                <a
                  href={`#${trade.id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-surface px-3.5 text-sm font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] transition-colors hover:bg-surface-muted"
                >
                  <trade.icon aria-hidden="true" className="size-4 text-primary-ink" />
                  {trade.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <section aria-label="Trades at work" className={cn(SITE_CONTAINER, 'pt-12 sm:pt-16')}>
        <TradePhotos />
      </section>

      <section aria-label="Sample quotes by trade" className={cn(SITE_CONTAINER, 'py-20 sm:py-28')}>
        {TRADES.map((trade, index) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            details={TRADE_DETAILS[trade.id]}
            index={index}
            count={TRADES.length}
          />
        ))}
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
