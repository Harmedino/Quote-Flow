import { DASHBOARD_ACTIVITY_DAYS, type DashboardDto } from '@quoteflow/shared';
import { useState } from 'react';
import { runningTotals } from '@/features/dashboard/chart-geometry';
import { plural } from '@/features/dashboard/dashboard-format';
import { SM_QUERY, useMediaQuery } from '@/features/dashboard/use-media-query';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { DashboardPanel } from './DashboardPanel';
import { type ChartNoun, RunningTotalChart } from './RunningTotalChart';

type Series = 'paid' | 'quoted';

const SERIES: Record<
  Series,
  {
    option: string;
    title: string;
    noun: ChartNoun;
    /** After the count, e.g. "3 payments recorded". */
    done: string;
    marker: string;
    emptyTitle: string;
    emptyHint: string;
  }
> = {
  paid: {
    option: 'Received',
    title: 'Payments received',
    noun: { one: 'payment', other: 'payments' },
    done: 'recorded',
    marker: 'Payment recorded',
    emptyTitle: `No payments recorded in the last ${DASHBOARD_ACTIVITY_DAYS} days`,
    emptyHint: 'When a customer pays, record it on the invoice and it shows up here.',
  },
  quoted: {
    option: 'Quoted',
    title: 'Value quoted',
    noun: { one: 'quote', other: 'quotes' },
    done: 'sent',
    marker: 'Quote sent',
    emptyTitle: `No quotes sent in the last ${DASHBOARD_ACTIVITY_DAYS} days`,
    emptyHint: 'Quotes you send appear here on the day they were issued.',
  },
};

/** The concept's segmented control: Received | Quoted. */
function SeriesPicker({ value, onChange }: { value: Series; onChange: (series: Series) => void }) {
  return (
    <div
      role="group"
      aria-label="Show"
      className="inline-flex shrink-0 rounded-[9px] bg-surface-muted p-[3px] shadow-[inset_0_0_0_1px_var(--color-line)]"
    >
      {(Object.keys(SERIES) as Series[]).map((series) => (
        <button
          key={series}
          type="button"
          aria-pressed={value === series}
          onClick={() => onChange(series)}
          className={cn(
            'rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors max-sm:py-1',
            value === series
              ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--color-line-strong)]'
              : 'text-muted hover:text-ink',
          )}
        >
          {SERIES[series].option}
        </button>
      ))}
    </div>
  );
}

function Legend({ marker }: { marker: string }) {
  return (
    <p aria-hidden="true" className="ml-auto hidden gap-4.5 text-[12.5px] text-muted md:flex">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0 w-4 border-t-[2.5px] border-primary-ink" />
        Running total
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border-[2.5px] border-ink" />
        {marker}
      </span>
    </p>
  );
}

/**
 * Money received (or value quoted) over the last 30 days as a running total, with each payment
 * pinned to the day it came in.
 */
export function ActivityCard({
  activity,
  currency,
  className,
}: {
  activity: DashboardDto['activity'];
  currency: DashboardDto['currency'];
  className?: string;
}) {
  const [series, setSeries] = useState<Series>('paid');
  const compact = !useMediaQuery(SM_QUERY);
  const { title, noun, done, marker, emptyTitle, emptyHint } = SERIES[series];
  const days = runningTotals(
    activity.days.map((day) => ({ date: day.date, value: day[series] })),
    activity.entries[series],
  );
  const total = days.at(-1)?.total ?? 0;
  const count = plural(activity.entries[series].length, noun.one);

  return (
    <DashboardPanel
      className={className}
      title={
        <>
          {title}
          <span className="max-lg:hidden"> · last {DASHBOARD_ACTIVITY_DAYS} days</span>
        </>
      }
      // On the narrowest phones the picker drops under the title rather than squeezing it.
      headerClassName="flex-wrap"
      titleClassName="lg:label-mono lg:text-muted"
      aside={<SeriesPicker value={series} onChange={setSeries} />}
    >
      <div className="px-4 pt-3.5 pb-2.5 lg:px-6 lg:pt-0 lg:pb-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <p className="figure text-[22px] text-ink sm:text-[28px]">
            {formatMoney(total, currency)}
          </p>
          <p className="text-[13px] text-muted max-sm:ml-auto max-sm:label-mono">
            {count} <span className="max-sm:hidden">{done}</span>
            <span className="sm:hidden">· {DASHBOARD_ACTIVITY_DAYS} days</span>
          </p>
          <Legend marker={marker} />
        </div>
        <div className="mt-2">
          <RunningTotalChart
            key={series}
            days={days}
            currency={currency}
            noun={noun}
            compact={compact}
            label={`${title} by day, last ${DASHBOARD_ACTIVITY_DAYS} days`}
            emptyMessage={total === 0 ? { title: emptyTitle, hint: emptyHint } : undefined}
          />
        </div>
      </div>
    </DashboardPanel>
  );
}
