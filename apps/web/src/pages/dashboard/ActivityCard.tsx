import { type CurrencyCode, DASHBOARD_ACTIVITY_DAYS, type DashboardDto } from '@quoteflow/shared';
import { useId, useState } from 'react';
import { formatShortDate, percentChange } from '@/features/dashboard/dashboard-format';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { AreaChart, type ChartDay } from './AreaChart';

type Series = 'paid' | 'quoted';

const SERIES: Record<
  Series,
  { option: string; title: string; other: string; emptyTitle: string; emptyHint: string }
> = {
  paid: {
    option: 'Received',
    title: 'Payments received',
    other: 'quoted',
    emptyTitle: 'No payments recorded in the last 30 days',
    emptyHint: 'When a customer pays, record it on the invoice and it shows up here.',
  },
  quoted: {
    option: 'Quoted',
    title: 'Value quoted',
    other: 'received',
    emptyTitle: 'No quotes sent in the last 30 days',
    emptyHint: 'Quotes you send appear here by the date they were issued.',
  },
};

function comparison(total: number, previous: number): { text: string; tone: string } | null {
  const change = percentChange(total, previous);
  if (change === null) return null;
  if (change === 0)
    return { text: `Same as the previous ${DASHBOARD_ACTIVITY_DAYS} days`, tone: 'text-stone-500' };
  return {
    text: `${change > 0 ? '+' : '−'}${Math.abs(change)}% vs the previous ${DASHBOARD_ACTIVITY_DAYS} days`,
    tone: change > 0 ? 'text-emerald-700' : 'text-red-700',
  };
}

function SeriesPicker({ value, onChange }: { value: Series; onChange: (series: Series) => void }) {
  return (
    <div
      role="group"
      aria-label="Show"
      className="inline-flex shrink-0 rounded-lg bg-stone-100 p-1"
    >
      {(Object.keys(SERIES) as Series[]).map((series) => (
        <button
          key={series}
          type="button"
          aria-pressed={value === series}
          onClick={() => onChange(series)}
          className={cn(
            'h-7 rounded-md px-2.5 text-xs font-medium transition-colors',
            value === series
              ? 'bg-surface text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900',
          )}
        >
          {SERIES[series].option}
        </button>
      ))}
    </div>
  );
}

/** Money received or value quoted per day over the last 30 days, ServiceBook's revenue card. */
export function ActivityCard({
  activity,
  currency,
}: {
  activity: DashboardDto['activity'];
  currency: CurrencyCode;
}) {
  const [series, setSeries] = useState<Series>('paid');
  const titleId = useId();
  const { title, other, emptyTitle, emptyHint } = SERIES[series];
  const otherSeries: Series = series === 'paid' ? 'quoted' : 'paid';
  const money = (minor: number) => formatMoney(minor, currency);

  const total = activity.days.reduce((sum, day) => sum + day[series], 0);
  const best = activity.days.reduce((top, day) => (day[series] > top[series] ? day : top));
  const compared = comparison(total, activity.previous[series]);
  const days: ChartDay[] = activity.days.map((day) => ({
    value: day[series],
    valueLabel: money(day[series]),
    detail: `${formatShortDate(day.date)} · ${money(day[otherSeries])} ${other}`,
  }));
  const firstDay = activity.days[0];

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-2xl border border-stone-200 bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="font-sans text-sm font-normal tracking-normal text-stone-500">
            {title} · last {DASHBOARD_ACTIVITY_DAYS} days
          </h2>
          <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-stone-900 tabular-nums">
            {money(total)}
          </p>
          {total > 0 && (
            <p className="mt-1 text-xs text-stone-500">
              {compared && <span className={compared.tone}>{compared.text} · </span>}
              Best day {money(best[series])}, {formatShortDate(best.date)}
            </p>
          )}
        </div>
        <SeriesPicker value={series} onChange={setSeries} />
      </div>
      <AreaChart
        key={series}
        days={days}
        label={`${title} per day`}
        emptyMessage={total === 0 ? { title: emptyTitle, hint: emptyHint } : undefined}
      />
      {firstDay && (
        <div aria-hidden="true" className="mt-2 flex justify-between text-[11px] text-stone-500">
          <span>{formatShortDate(firstDay.date)}</span>
          <span>Today</span>
        </div>
      )}
    </section>
  );
}
