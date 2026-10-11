import type { DashboardDto } from '@quoteflow/shared';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { InvoiceStatusBadge, QuoteStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { MetaLine } from '@/components/ui/MetaLine';
import { TextLink } from '@/components/ui/TextLink';
import { dueLabel, formatShortDate, plural } from '@/features/dashboard/dashboard-format';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { DashboardPanel, PanelEmpty } from './DashboardPanel';

/** "All invoices", shortened to "All" beside the section heading on phones. */
function AllLink({ to, noun }: { to: string; noun: string }) {
  return (
    <TextLink to={to} className="shrink-0 text-[14px] lg:text-[15px]">
      All<span className="max-lg:sr-only"> {noun}</span>
      <ArrowRight aria-hidden="true" />
    </TextLink>
  );
}

const WAITING_ON_DESKTOP = 3;

const HEAD = 'px-3 py-2 text-left label-mono font-medium whitespace-nowrap text-muted';
const CELL = 'border-b border-line px-3 py-2 align-middle';

/** Unpaid invoices, soonest due first, with how long until (or since) each is due. */
export function MoneyToCollect({
  dashboard,
  today,
  className,
}: {
  dashboard: DashboardDto;
  today: string;
  className?: string;
}) {
  const invoices = dashboard.upcomingInvoices;
  const { outstanding, outstandingCount } = dashboard.invoices;
  const due = (invoice: (typeof invoices)[number]) => ({
    text: dueLabel(invoice.dueDate, today),
    overdue: invoice.status === 'overdue',
  });

  return (
    <DashboardPanel
      className={className}
      title="Money to collect"
      aside={<AllLink to={paths.invoices} noun="invoices" />}
    >
      {invoices.length === 0 ? (
        <PanelEmpty
          title="Nothing waiting to be paid"
          description="Invoices you send show here until they are paid in full, the oldest due first."
        />
      ) : (
        <>
          {/* Phones: one row per invoice, the whole row opens it. */}
          <ul className="divide-y divide-line md:hidden">
            {invoices.map((invoice) => {
              const when = due(invoice);
              return (
                <li key={invoice.id}>
                  <Link
                    to={paths.invoice(invoice.id)}
                    className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-offset-[-2px]"
                  >
                    <Avatar name={invoice.customerName} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14.5px] font-semibold text-ink">
                        {invoice.customerName}
                      </span>
                      {/* Breaks between the number and the due date, never inside either. */}
                      <MetaLine className="mt-px text-[12.5px] text-muted">
                        <span className="font-mono">{invoice.invoiceNumber}</span>
                        <span className={cn(when.overdue && 'font-semibold text-overdue')}>
                          {when.text}
                        </span>
                      </MetaLine>
                    </span>
                    <span className="flex flex-col items-end gap-1.5">
                      <span className="money text-[13.5px] text-ink">
                        {formatMoney(invoice.balanceDue, invoice.currency)}
                      </span>
                      <InvoiceStatusBadge status={invoice.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* From `md`: the concept's table. It scrolls inside the card if it must. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-muted">
                  <th scope="col" className={cn(HEAD, 'border-y border-line pl-6')}>
                    Customer
                  </th>
                  <th scope="col" className={cn(HEAD, 'border-y border-line')}>
                    Invoice
                  </th>
                  <th scope="col" className={cn(HEAD, 'border-y border-line')}>
                    Due
                  </th>
                  <th scope="col" className={cn(HEAD, 'border-y border-line')}>
                    Status
                  </th>
                  <th scope="col" className={cn(HEAD, 'border-y border-line pr-6 text-right')}>
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {invoices.map((invoice) => {
                  const when = due(invoice);
                  return (
                    <tr
                      key={invoice.id}
                      className="relative transition-colors focus-within:bg-surface-muted hover:bg-surface-muted"
                    >
                      <td className={cn(CELL, 'pl-6')}>
                        <span className="flex items-center gap-3">
                          <Avatar name={invoice.customerName} size="sm" />
                          <span className="max-w-56 truncate text-sm font-[650] text-ink">
                            {invoice.customerName}
                          </span>
                        </span>
                      </td>
                      <td className={cn(CELL, 'whitespace-nowrap')}>
                        {/* The link covers the whole row, so any part of it opens the invoice. */}
                        <Link
                          to={paths.invoice(invoice.id)}
                          className="rounded-sm font-mono text-[12.5px] text-ink-2 after:absolute after:inset-0 hover:text-primary-ink"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td
                        className={cn(
                          CELL,
                          'text-[13px] whitespace-nowrap',
                          when.overdue ? 'font-semibold text-overdue' : 'text-ink-2',
                        )}
                      >
                        {when.text}
                      </td>
                      <td className={CELL}>
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className={cn(CELL, 'pr-6 text-right')}>
                        <span className="money text-[14px] text-ink">
                          {formatMoney(invoice.balanceDue, invoice.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-b-xl border-t-[1.5px] border-dashed border-line-strong px-3.5 py-3 md:px-6">
            <span className="label-mono text-ink-2">
              Total<span className="max-sm:hidden"> to collect</span> ·{' '}
              {plural(outstandingCount, 'invoice')}
            </span>
            <span className="money text-[15px] text-ink">
              {formatMoney(outstanding, dashboard.currency)}
            </span>
          </div>
        </>
      )}
    </DashboardPanel>
  );
}

/** Quotes the customer has not answered yet, the latest first. */
export function WaitingForAnswer({
  dashboard,
  className,
}: {
  dashboard: DashboardDto;
  className?: string;
}) {
  const quotes = dashboard.awaitingQuotes;
  return (
    <DashboardPanel
      className={className}
      title="Waiting for an answer"
      headerClassName="lg:px-5"
      aside={<AllLink to={paths.quotes} noun="quotes" />}
    >
      {quotes.length === 0 ? (
        <PanelEmpty
          title="No quotes waiting"
          description="Quotes you share show here until the customer accepts or declines them."
        />
      ) : (
        <ul className="divide-y divide-line px-3.5 lg:px-5 lg:pb-1.5 lg:[&>li:nth-child(3)]:border-b-0">
          {quotes.map((quote, index) => (
            // Three rows on desktop keep the side column level with the main one.
            <li key={quote.id} className={cn(index >= WAITING_ON_DESKTOP && 'lg:hidden')}>
              <Link
                to={paths.quote(quote.id)}
                className="-mx-1.5 flex items-center gap-3 rounded-lg px-1.5 py-2.5 transition-colors hover:bg-surface-muted"
              >
                <Avatar name={quote.customerName} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-[650] text-ink">
                    {quote.customerName}
                  </span>
                  <span className="block truncate font-mono text-xs text-muted">
                    {quote.quoteNumber} · {formatShortDate(quote.issueDate)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 xl:flex-row-reverse xl:items-center xl:gap-2.5">
                  <span className="money text-[13.5px] text-ink">
                    {formatMoney(quote.total, quote.currency)}
                  </span>
                  <QuoteStatusBadge status={quote.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
