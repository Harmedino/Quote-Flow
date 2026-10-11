import type { DashboardDto } from '@quoteflow/shared';
import { ArrowRight, FileCheck, HandCoins, Send, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { StatCard, StatStrip } from '@/components/ui/StatStrip';
import { TapeMeasure } from '@/components/ui/TapeMeasure';
import { TextLink } from '@/components/ui/TextLink';
import { formatMoneyShort, plural } from '@/features/dashboard/dashboard-format';
import { DESKTOP_QUERY, useMediaQuery } from '@/features/dashboard/use-media-query';
import { useCountUp } from '@/features/dashboard/use-count-up';
import { formatMoney } from '@/lib/format';

const ACCEPTED_TO_INVOICE = `${paths.quotes}?status=accepted`;

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

/** The amounts and counts the figures show, worked out once for both layouts. */
function figuresOf({ quotes, invoices, currency }: DashboardDto) {
  const money = (minor: number) => formatMoney(minor, currency);
  const short = (minor: number) => formatMoneyShort(minor, currency);
  const count = (n: number) => n.toLocaleString();
  const collected = invoices.totalInvoiced > 0 ? invoices.amountPaid / invoices.totalInvoiced : 0;
  return {
    money,
    short,
    collectedPercent: `${Math.round(collected * 100)}%`,
    collected,
    outstanding: (
      <Figure value={invoices.outstanding} format={short} exact={money(invoices.outstanding)} />
    ),
    paid: <Figure value={invoices.amountPaid} format={short} exact={money(invoices.amountPaid)} />,
    pending: <Figure value={quotes.pending} format={count} exact={count(quotes.pending)} />,
    accepted: <Figure value={quotes.accepted} format={count} exact={count(quotes.accepted)} />,
    overdue: invoices.overdueAmount > 0 ? `${money(invoices.overdueAmount)} overdue` : null,
  };
}

/** "■ ₦130,612.50 overdue": the bad news in bold red behind a small red square. */
function OverdueNote({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-overdue">
      <span aria-hidden="true" className="size-[7px] shrink-0 rounded-[2px] bg-overdue" />
      {children}
    </span>
  );
}

function CollectedTape({
  value,
  percent,
  label,
}: {
  value: number;
  percent: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <TapeMeasure value={value} label={label} className="min-w-0 flex-1" />
      <span aria-hidden="true" className="money text-xs text-ink">
        {percent}
      </span>
    </span>
  );
}

function awaitingCaption({ pending, viewed }: DashboardDto['quotes']): string {
  if (pending === 0) return 'None waiting right now';
  const sent = pending - viewed;
  if (viewed === 0) return `${sent} sent, not opened yet`;
  return `${sent} sent · ${viewed} viewed by the customer`;
}

function acceptedCaption(quotes: DashboardDto['quotes'], text: string) {
  if (quotes.acceptedNotInvoiced > 0) {
    return (
      <TextLink to={ACCEPTED_TO_INVOICE} className="max-lg:[&_svg]:ml-0.5 max-lg:[&_svg]:size-3.5">
        {text}
        <ArrowRight aria-hidden="true" />
      </TextLink>
    );
  }
  return quotes.accepted > 0 ? 'All invoiced' : 'None yet';
}

/** The concept's desktop strip: four figures in one perforated ticket. */
function DesktopFigures({ dashboard }: { dashboard: DashboardDto }) {
  const { quotes, invoices } = dashboard;
  const figures = figuresOf(dashboard);
  const invoiceCount = plural(invoices.outstandingCount, 'invoice');
  return (
    <StatStrip label="Key figures">
      <StatCard
        label="Outstanding"
        icon={Wallet}
        value={figures.outstanding}
        valueTitle={figures.money(invoices.outstanding)}
        caption={
          figures.overdue ? (
            <span className="flex flex-wrap items-center gap-x-1.5">
              <OverdueNote>{figures.overdue}</OverdueNote>· {invoiceCount}
            </span>
          ) : (
            `${invoiceCount} · nothing overdue`
          )
        }
      />
      <StatCard
        label="Collected"
        icon={HandCoins}
        value={figures.paid}
        valueTitle={figures.money(invoices.amountPaid)}
        unit={invoices.totalInvoiced > 0 && `of ${figures.short(invoices.totalInvoiced)}`}
        caption={
          invoices.totalInvoiced > 0 ? (
            <CollectedTape
              value={figures.collected}
              percent={figures.collectedPercent}
              label={`${figures.collectedPercent} of ${figures.short(invoices.totalInvoiced)} invoiced is collected`}
            />
          ) : (
            'Nothing invoiced yet'
          )
        }
      />
      <StatCard
        label="Awaiting an answer"
        icon={Send}
        value={figures.pending}
        unit={quotes.pending === 1 ? 'quote' : 'quotes'}
        caption={awaitingCaption(quotes)}
      />
      <StatCard
        label="Accepted"
        icon={FileCheck}
        value={figures.accepted}
        unit={quotes.accepted === 1 ? 'quote' : 'quotes'}
        caption={acceptedCaption(quotes, `${quotes.acceptedNotInvoiced} ready to invoice`)}
      />
    </StatStrip>
  );
}

/**
 * The concept's phone layout: the money owed as a ticket with a stub that opens the invoices,
 * then the other three figures side by side.
 */
function PhoneFigures({ dashboard }: { dashboard: DashboardDto }) {
  const { quotes, invoices } = dashboard;
  const figures = figuresOf(dashboard);
  return (
    <div className="space-y-3.5">
      <div className="lift animate-fade-in-up ticket-row [--notch:8px]">
        <dl className="px-4 pt-4 pb-3.5">
          <dt className="label-mono text-muted">Outstanding</dt>
          <dd
            title={figures.money(invoices.outstanding)}
            className="mt-2 truncate figure text-[34px] font-[820] text-ink"
          >
            {figures.outstanding}
          </dd>
          <dd className="mt-2.5 text-[13.5px] text-muted">
            {figures.overdue ? <OverdueNote>{figures.overdue}</OverdueNote> : 'Nothing overdue'}
          </dd>
        </dl>
        {invoices.outstandingCount > 0 && (
          <Link
            to={paths.invoices}
            className="flex w-24 flex-none flex-col items-center justify-center gap-0.5 bg-primary-tint px-2.5 py-3.5 text-center focus-visible:outline-offset-[-3px]"
          >
            <span className="figure text-[30px] font-[820] font-stretch-115% text-ink">
              {invoices.outstandingCount}
            </span>
            <span className="text-xs leading-snug font-semibold text-ink-2">
              {invoices.outstandingCount === 1 ? 'invoice' : 'invoices'} to collect
            </span>
            <ArrowRight aria-hidden="true" className="mt-1 size-4 text-primary-ink" />
          </Link>
        )}
      </div>

      <StatStrip columns={3} label="Key figures">
        <StatCard
          label="Collected"
          value={figures.paid}
          valueTitle={figures.money(invoices.amountPaid)}
          className="grow-[1.35]"
          caption={
            invoices.totalInvoiced > 0 ? (
              <>
                <TapeMeasure
                  size="sm"
                  value={figures.collected}
                  label={`${figures.collectedPercent} of ${figures.short(invoices.totalInvoiced)} invoiced is collected`}
                />
                <span className="mt-2 block" aria-hidden="true">
                  {figures.collectedPercent} of {figures.short(invoices.totalInvoiced)}
                </span>
              </>
            ) : (
              'Nothing invoiced yet'
            )
          }
        />
        <StatCard
          label="Awaiting"
          value={figures.pending}
          caption={`${quotes.pending === 1 ? 'quote' : 'quotes'} sent or viewed`}
        />
        <StatCard
          label="Accepted"
          value={figures.accepted}
          caption={acceptedCaption(quotes, `${quotes.acceptedNotInvoiced} to invoice`)}
        />
      </StatStrip>
    </div>
  );
}

/** Where the business stands: what it is owed, has collected, and what customers have to answer. */
export function KeyFigures({ dashboard }: { dashboard: DashboardDto }) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  return desktop ? (
    <DesktopFigures dashboard={dashboard} />
  ) : (
    <PhoneFigures dashboard={dashboard} />
  );
}
