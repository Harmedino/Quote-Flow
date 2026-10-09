import type { CustomerDto, InvoiceListItemDto, QuoteListItemDto } from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { InvoiceStatusBadge, QuoteStatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { TextLink } from '@/components/ui/TextLink';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatDate, formatMoney } from '@/lib/format';

interface ListCardProps<T> {
  title: string;
  viewAll: { to: string; label: string };
  items: readonly T[];
  empty: string;
  children: (item: T) => ReactNode;
}

function ListCard<T>({ title, viewAll, items, empty, children }: ListCardProps<T>) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        className="items-center py-3.5"
        actions={
          <TextLink to={viewAll.to} className="text-sm">
            {viewAll.label}
          </TextLink>
        }
      />
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-zinc-500 sm:px-6">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">{items.map(children)}</ul>
      )}
    </Card>
  );
}

interface RowProps {
  to: string;
  primary: ReactNode;
  secondary: ReactNode;
  amount: ReactNode;
  badge?: ReactNode;
  leading?: ReactNode;
}

function Row({ to, primary, secondary, amount, badge, leading }: RowProps) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 sm:px-6"
      >
        {leading}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-950">{primary}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{secondary}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-medium text-zinc-950 tabular-nums">{amount}</span>
          {badge}
        </div>
      </Link>
    </li>
  );
}

export function RecentQuotesCard({ quotes }: { quotes: readonly QuoteListItemDto[] }) {
  return (
    <ListCard
      title="Recent quotes"
      viewAll={{ to: paths.quotes, label: 'View all' }}
      items={quotes}
      empty="No quotes yet."
    >
      {(quote) => (
        <Row
          key={quote.id}
          to={paths.quote(quote.id)}
          primary={quote.customerName}
          secondary={`${quote.quoteNumber} · ${formatCalendarDate(quote.issueDate)}`}
          amount={formatMoney(quote.total, quote.currency)}
          badge={<QuoteStatusBadge status={quote.status} />}
        />
      )}
    </ListCard>
  );
}

export function RecentInvoicesCard({ invoices }: { invoices: readonly InvoiceListItemDto[] }) {
  return (
    <ListCard
      title="Recent invoices"
      viewAll={{ to: paths.invoices, label: 'View all' }}
      items={invoices}
      empty="No invoices yet. Convert an accepted quote to create one."
    >
      {(invoice) => (
        <Row
          key={invoice.id}
          to={paths.invoice(invoice.id)}
          primary={invoice.customerName}
          secondary={`${invoice.invoiceNumber} · ${formatCalendarDate(invoice.issueDate)}`}
          amount={formatMoney(invoice.total, invoice.currency)}
          badge={<InvoiceStatusBadge status={invoice.status} />}
        />
      )}
    </ListCard>
  );
}

export function UpcomingInvoicesCard({ invoices }: { invoices: readonly InvoiceListItemDto[] }) {
  return (
    <ListCard
      title="Upcoming due invoices"
      viewAll={{ to: paths.invoices, label: 'All invoices' }}
      items={invoices}
      empty="Nothing waiting to be paid."
    >
      {(invoice) => {
        const overdue = invoice.status === 'overdue';
        return (
          <Row
            key={invoice.id}
            to={paths.invoice(invoice.id)}
            primary={invoice.customerName}
            secondary={
              <span className={cn(overdue && 'font-medium text-red-700')}>
                {overdue ? 'Overdue since' : 'Due'} {formatCalendarDate(invoice.dueDate)} ·{' '}
                {invoice.invoiceNumber}
              </span>
            }
            amount={
              <span className={cn(overdue && 'text-red-700')}>
                {formatMoney(invoice.balanceDue, invoice.currency)}
              </span>
            }
            badge={<InvoiceStatusBadge status={invoice.status} />}
          />
        );
      }}
    </ListCard>
  );
}

export function RecentCustomersCard({ customers }: { customers: readonly CustomerDto[] }) {
  return (
    <ListCard
      title="Recent customers"
      viewAll={{ to: paths.customers, label: 'View all' }}
      items={customers}
      empty="No customers yet."
    >
      {(customer) => (
        <Row
          key={customer.id}
          to={paths.customer(customer.id)}
          leading={<Avatar name={customer.name} size="sm" />}
          primary={customer.name}
          secondary={customer.company ?? customer.email ?? customer.phone ?? 'No contact details'}
          amount={
            <span className="text-xs font-normal text-zinc-500">
              Added {formatDate(customer.createdAt)}
            </span>
          }
        />
      )}
    </ListCard>
  );
}
