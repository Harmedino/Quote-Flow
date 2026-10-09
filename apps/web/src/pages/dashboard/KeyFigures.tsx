import type { DashboardDto } from '@quoteflow/shared';
import { StatCard, StatStrip, type StatTone } from '@/components/ui/StatStrip';
import { formatMoneyShort, plural } from '@/features/dashboard/dashboard-format';
import { useCountUp } from '@/features/dashboard/use-count-up';
import { formatMoney } from '@/lib/format';

/**
 * A figure that counts up into place. Assistive technology reads the exact value once instead
 * of every step (and the full amount where the visible one is shortened).
 */
function Figure({
  value,
  format,
  exact,
}: {
  value: number;
  format: (n: number) => string;
  exact: string;
}) {
  const shown = useCountUp(value);
  return (
    <>
      <span aria-hidden="true">{format(Math.round(shown))}</span>
      <span className="sr-only">{exact}</span>
    </>
  );
}

interface Stat {
  label: string;
  value: number;
  format: (n: number) => string;
  exact: string;
  caption: string;
  tone: StatTone;
}

function figures({ quotes, invoices, currency }: DashboardDto): Stat[] {
  const money = (minor: number) => formatMoney(minor, currency);
  const short = (minor: number) => formatMoneyShort(minor, currency);
  const count = (n: number) => n.toLocaleString();
  const overdue = invoices.overdueAmount > 0;
  return [
    {
      label: 'Outstanding',
      value: invoices.outstanding,
      format: short,
      exact: money(invoices.outstanding),
      caption: overdue ? `${money(invoices.overdueAmount)} overdue` : 'Nothing overdue',
      tone: overdue ? 'negative' : 'neutral',
    },
    {
      label: 'Collected',
      value: invoices.amountPaid,
      format: short,
      exact: money(invoices.amountPaid),
      caption: `of ${short(invoices.totalInvoiced)} invoiced`,
      tone: 'neutral',
    },
    {
      label: 'Awaiting an answer',
      value: quotes.pending,
      format: count,
      exact: count(quotes.pending),
      caption: 'Sent or viewed quotes',
      tone: 'neutral',
    },
    {
      label: 'Accepted quotes',
      value: quotes.accepted,
      format: count,
      exact: count(quotes.accepted),
      caption:
        quotes.acceptedNotInvoiced > 0
          ? `${plural(quotes.acceptedNotInvoiced, 'quote')} to invoice`
          : quotes.accepted > 0
            ? 'All invoiced'
            : 'None yet',
      tone: quotes.acceptedNotInvoiced > 0 ? 'warning' : 'neutral',
    },
  ];
}

/** The four figures that say where the business stands, joined into one strip. */
export function KeyFigures({ dashboard }: { dashboard: DashboardDto }) {
  return (
    <StatStrip label="Key figures">
      {figures(dashboard).map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={<Figure value={stat.value} format={stat.format} exact={stat.exact} />}
          valueTitle={stat.exact}
          caption={stat.caption}
          tone={stat.tone}
        />
      ))}
    </StatStrip>
  );
}
