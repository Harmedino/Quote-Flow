import { BulletList } from '@/components/marketing/BulletList';
import { Reveal } from '@/components/marketing/Reveal';
import type { Trade } from '@/components/marketing/trades';
import { cn } from '@/lib/cn';
import { SampleQuoteTicket } from './SampleQuoteTicket';
import type { TradeDetails } from './trade-details';

/**
 * One trade on the Solutions page: what pricing a job looks like without QuoteFlow and what
 * changes, beside a sample quote from that trade. Every other row swaps sides on desktop.
 */
export function TradeRow({
  trade,
  details,
  index,
  count,
}: {
  trade: Trade;
  details: TradeDetails;
  index: number;
  count: number;
}) {
  const flip = index % 2 === 1;
  return (
    <article
      id={trade.id}
      aria-labelledby={`${trade.id}-title`}
      className="grid scroll-mt-28 items-center gap-10 border-t-[1.5px] border-dashed border-line-strong py-14 first:border-t-0 first:pt-0 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-16 xl:scroll-mt-32"
    >
      <Reveal className={cn(flip && 'lg:order-2')}>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-primary-tint text-primary-ink">
            <trade.icon aria-hidden="true" className="size-5" />
          </span>
          <p className="label-mono text-muted">
            Trade {index + 1} of {count}
          </p>
        </div>
        <h2
          id={`${trade.id}-title`}
          className="mt-5 text-[1.75rem] leading-[1.06] font-[830] tracking-[-0.025em] text-balance text-ink font-stretch-118% sm:text-[2.375rem]"
        >
          {trade.name}
        </h2>
        <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-pretty text-ink-2">
          {details.pain}
        </p>
        <h3 className="mt-8 label-mono text-muted">With QuoteFlow</h3>
        <BulletList items={details.wins} className="mt-3.5" />
      </Reveal>
      <Reveal delay={100} className={cn('mx-auto w-full max-w-xl', flip && 'lg:order-1')}>
        <SampleQuoteTicket quote={details.quote} />
      </Reveal>
    </article>
  );
}
