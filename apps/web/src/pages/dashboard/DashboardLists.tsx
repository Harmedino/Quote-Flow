import type { InvoiceListItemDto, QuoteListItemDto } from '@quoteflow/shared';
import { Plus } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import {
  InvoiceStatusAccent,
  InvoiceStatusBadge,
  QuoteStatusBadge,
} from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { TextLink } from '@/components/ui/TextLink';
import { dueLabel } from '@/features/dashboard/dashboard-format';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatMoney } from '@/lib/format';

interface SectionProps {
  title: string;
  /** "View all" target and what it lists, e.g. "quotes" (completes the link's name). */
  viewAll?: { to: string; noun: string };
  children: ReactNode;
}

/** A titled group on the dashboard: the heading and "View all" above, the content below. */
export function DashboardSection({ title, viewAll, children }: SectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="text-lg font-semibold text-stone-900">
          {title}
        </h2>
        {viewAll && (
          <TextLink to={viewAll.to} className="text-sm">
            View all<span className="sr-only"> {viewAll.noun}</span>
          </TextLink>
        )}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** A dashed box saying what will appear in an empty section and how to get it there. */
export function InlineEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-pretty text-stone-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const LIST_PANEL_CLASSES =
  'divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-surface';

interface RowProps {
  to: string;
  name: string;
  meta: ReactNode;
  amount: string;
  badge: ReactNode;
  /** A status colour bar at the start of the row. */
  accent?: ReactNode;
}

function DocumentRow({ to, name, meta, amount, badge, accent }: RowProps) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 focus-visible:outline-offset-[-2px] sm:px-4"
      >
        {accent}
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-900">{name}</p>
          <p className="mt-0.5 text-xs text-stone-500">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-semibold text-stone-900 tabular-nums">{amount}</span>
          {badge}
        </div>
      </Link>
    </li>
  );
}

/** Unpaid invoices, soonest due first, with how long until (or since) each is due. */
export function MoneyToCollect({
  invoices,
  today,
}: {
  invoices: readonly InvoiceListItemDto[];
  today: string;
}) {
  return (
    <DashboardSection title="Money to collect" viewAll={{ to: paths.invoices, noun: 'invoices' }}>
      {invoices.length === 0 ? (
        <InlineEmpty
          title="Nothing waiting to be paid"
          description="Invoices you send show here until they are paid in full, the oldest due first."
        />
      ) : (
        <ul className={LIST_PANEL_CLASSES}>
          {invoices.map((invoice) => {
            const overdue = invoice.status === 'overdue';
            return (
              <DocumentRow
                key={invoice.id}
                to={paths.invoice(invoice.id)}
                name={invoice.customerName}
                accent={<InvoiceStatusAccent status={invoice.status} />}
                meta={
                  <>
                    {invoice.invoiceNumber} ·{' '}
                    <span className={cn(overdue && 'font-medium text-red-700')}>
                      {dueLabel(invoice.dueDate, today)}
                    </span>
                  </>
                }
                amount={formatMoney(invoice.balanceDue, invoice.currency)}
                badge={<InvoiceStatusBadge status={invoice.status} />}
              />
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}

export function RecentQuotes({ quotes }: { quotes: readonly QuoteListItemDto[] }) {
  return (
    <DashboardSection title="Latest quotes" viewAll={{ to: paths.quotes, noun: 'quotes' }}>
      {quotes.length === 0 ? (
        <InlineEmpty
          title="No quotes yet"
          description="Price a job in a minute, then share it on WhatsApp or by link."
          action={
            <ButtonLink to={paths.newQuote} size="sm">
              <Plus aria-hidden="true" />
              New quote
            </ButtonLink>
          }
        />
      ) : (
        <ul className={LIST_PANEL_CLASSES}>
          {quotes.map((quote) => (
            <DocumentRow
              key={quote.id}
              to={paths.quote(quote.id)}
              name={quote.customerName}
              meta={`${quote.quoteNumber} · ${formatCalendarDate(quote.issueDate)}`}
              amount={formatMoney(quote.total, quote.currency)}
              badge={<QuoteStatusBadge status={quote.status} />}
            />
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}

export function RecentInvoices({ invoices }: { invoices: readonly InvoiceListItemDto[] }) {
  return (
    <DashboardSection title="Latest invoices" viewAll={{ to: paths.invoices, noun: 'invoices' }}>
      {invoices.length === 0 ? (
        <InlineEmpty
          title="No invoices yet"
          description="Turn an accepted quote into an invoice in one click, or bill a customer directly."
          action={
            <ButtonLink to={paths.newInvoice} size="sm" variant="secondary">
              <Plus aria-hidden="true" />
              New invoice
            </ButtonLink>
          }
        />
      ) : (
        <ul className={LIST_PANEL_CLASSES}>
          {invoices.map((invoice) => (
            <DocumentRow
              key={invoice.id}
              to={paths.invoice(invoice.id)}
              name={invoice.customerName}
              meta={`${invoice.invoiceNumber} · ${formatCalendarDate(invoice.issueDate)}`}
              amount={formatMoney(invoice.total, invoice.currency)}
              badge={<InvoiceStatusBadge status={invoice.status} />}
            />
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
