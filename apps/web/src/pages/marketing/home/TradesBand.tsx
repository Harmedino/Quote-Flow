import { Fragment } from 'react';
import { Link } from 'react-router';
import { SITE_CONTAINER } from '@/components/marketing/site-container';
import { TRADE_BAND, tradePath } from '@/components/marketing/trades';
import { cn } from '@/lib/cn';

/**
 * The navy band under the hero: who QuoteFlow is for, each linking to their trade's sample
 * quote. One line with diamond separators on wide screens; centred rows below that.
 */
export function TradesBand() {
  return (
    <nav aria-label="Who it’s for" className="bg-navy text-on-navy">
      <ul
        className={cn(
          SITE_CONTAINER,
          'flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-5 xl:h-16 xl:flex-nowrap xl:justify-between xl:gap-0 xl:py-0',
        )}
      >
        {TRADE_BAND.map((entry, index) => (
          <Fragment key={entry.label}>
            {index > 0 && (
              <li aria-hidden="true" className="hidden size-[7px] rotate-45 bg-primary xl:block" />
            )}
            <li>
              <Link
                to={tradePath({ id: entry.trade })}
                className="inline-flex items-center gap-2.5 rounded-sm font-mono text-[13px] font-medium tracking-[0.1em] whitespace-nowrap uppercase underline-offset-4 hover:underline"
              >
                <entry.icon aria-hidden="true" className="size-[17px] text-primary" />
                {entry.label}
              </Link>
            </li>
          </Fragment>
        ))}
      </ul>
    </nav>
  );
}
