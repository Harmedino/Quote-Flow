import type { CustomerDto, PaginationMeta } from '@quoteflow/shared';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { ChevronRight, FileText, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QueryError } from '@/components/QueryError';
import {
  InvoiceStatusAccent,
  InvoiceStatusBadge,
  QuoteStatusAccent,
  QuoteStatusBadge,
} from '@/components/StatusBadge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatCard, StatStrip } from '@/components/ui/StatStrip';
import {
  CUSTOMER_DOCUMENTS_LIMIT,
  useCustomerInvoicesQuery,
  useCustomerQuotesQuery,
} from '@/features/customers/customer-documents-api';
import { requestPaginated } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

interface DocumentsCardProps<T> {
  title: string;
  /** Plural noun, e.g. "quotes". */
  noun: string;
  query: UseQueryResult<{ data: T[]; meta: PaginationMeta }>;
  empty: ReactNode;
  renderRow: (item: T) => ReactNode;
}

function DocumentsCard<T>({ title, noun, query, empty, renderRow }: DocumentsCardProps<T>) {
  const total = query.data?.meta.total ?? 0;
  let content: ReactNode;
  if (query.isPending) {
    content = (
      <div role="status" aria-label={`Loading ${noun}`} className="space-y-3 px-5 py-5 sm:px-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-5/6" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  } else if (query.isError) {
    content = (
      <div className="px-5 py-5 sm:px-6">
        <QueryError
          title={`Couldn’t load ${noun}`}
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      </div>
    );
  } else if (query.data.data.length === 0) {
    content = <div className="px-5 py-10 text-center text-sm text-stone-500 sm:px-6">{empty}</div>;
  } else {
    content = <ul className="px-2 py-1.5 sm:px-3">{query.data.data.map(renderRow)}</ul>;
  }

  return (
    <Card>
      <CardHeader
        title={title}
        description={
          total > CUSTOMER_DOCUMENTS_LIMIT
            ? `Latest ${CUSTOMER_DOCUMENTS_LIMIT} of ${total}`
            : undefined
        }
      />
      {content}
    </Card>
  );
}

function DocumentRow({
  to,
  accent,
  number,
  badge,
  meta,
  amount,
  amountNote,
}: {
  to: string;
  accent: ReactNode;
  number: string;
  badge: ReactNode;
  meta: string;
  amount: string;
  amountNote?: string;
}) {
  return (
    <li className="flex gap-2.5 border-t border-stone-100 py-1 first:border-t-0">
      {accent}
      <Link
        to={to}
        className="group flex min-w-0 flex-1 items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-stone-50 focus-visible:outline-offset-[-2px]"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-stone-900">{number}</span>
            {badge}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">{meta}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900 tabular-nums">{amount}</p>
            {amountNote && <p className="mt-0.5 text-xs text-stone-500">{amountNote}</p>}
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-stone-400 transition-transform group-hover:translate-x-0.5"
          />
        </div>
      </Link>
    </li>
  );
}

function EmptyIcon({ icon: Icon }: { icon: typeof FileText }) {
  return (
    <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-500">
      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </span>
  );
}

export function CustomerQuotesCard({ customer }: { customer: CustomerDto }) {
  const quotes = useCustomerQuotesQuery(customer.id);
  return (
    <DocumentsCard
      title="Quotes"
      noun="quotes"
      query={quotes}
      empty={
        <>
          <EmptyIcon icon={FileText} />
          <p>No quotes for this customer yet.</p>
          {!customer.archivedAt && (
            <ButtonLink
              to={`${paths.newQuote}?customerId=${encodeURIComponent(customer.id)}`}
              variant="secondary"
              size="sm"
              className="mt-4"
            >
              Create a quote
            </ButtonLink>
          )}
        </>
      }
      renderRow={(quote) => (
        <DocumentRow
          key={quote.id}
          to={paths.quote(quote.id)}
          accent={<QuoteStatusAccent status={quote.status} />}
          number={quote.quoteNumber}
          badge={<QuoteStatusBadge status={quote.status} />}
          meta={`Issued ${formatCalendarDate(quote.issueDate)} · Valid until ${formatCalendarDate(quote.expiryDate)}`}
          amount={formatMoney(quote.total, quote.currency)}
        />
      )}
    />
  );
}

export function CustomerInvoicesCard({ customer }: { customer: CustomerDto }) {
  const invoices = useCustomerInvoicesQuery(customer.id);
  return (
    <DocumentsCard
      title="Invoices"
      noun="invoices"
      query={invoices}
      empty={
        <>
          <EmptyIcon icon={Receipt} />
          <p>No invoices for this customer yet. Accepted quotes can be turned into invoices.</p>
        </>
      }
      renderRow={(invoice) => (
        <DocumentRow
          key={invoice.id}
          to={paths.invoice(invoice.id)}
          accent={<InvoiceStatusAccent status={invoice.status} />}
          number={invoice.invoiceNumber}
          badge={<InvoiceStatusBadge status={invoice.status} />}
          meta={`Issued ${formatCalendarDate(invoice.issueDate)} · Due ${formatCalendarDate(invoice.dueDate)}`}
          amount={formatMoney(invoice.total, invoice.currency)}
          amountNote={
            invoice.balanceDue > 0 && invoice.status !== 'cancelled'
              ? `${formatMoney(invoice.balanceDue, invoice.currency)} due`
              : undefined
          }
        />
      )}
    />
  );
}

/**
 * How many of the customer's quotes or invoices have a status, read from the list's total.
 * Keyed under the quotes and invoices lists, so changes made there refresh it too.
 */
function useCustomerCount(kind: 'quotes' | 'invoices', customerId: string, status?: string) {
  const query = { customerId, pageSize: 1, ...(status && { status }) };
  return useQuery({
    queryKey: [kind, 'list', query],
    queryFn: ({ signal }) => requestPaginated<unknown>(`/${kind}`, { query, signal }),
    select: (page) => page.meta.total,
  }).data;
}

/** The customer's history at a glance: quotes and how many were accepted, invoices and overdue. */
export function CustomerStats({ customer }: { customer: CustomerDto }) {
  const quotes = useCustomerCount('quotes', customer.id);
  const accepted = useCustomerCount('quotes', customer.id, 'accepted');
  const invoices = useCustomerCount('invoices', customer.id);
  const overdue = useCustomerCount('invoices', customer.id, 'overdue');
  const count = (value: number | undefined) => value ?? '–';

  return (
    <StatStrip label={`${customer.name} at a glance`} className="mb-6">
      <StatCard label="Quotes" value={count(quotes)} caption="All time" />
      <StatCard
        label="Accepted"
        value={count(accepted)}
        caption={
          quotes && accepted !== undefined
            ? `${Math.round((accepted / quotes) * 100)}% of their quotes`
            : 'No quotes yet'
        }
        tone={accepted ? 'positive' : 'neutral'}
      />
      <StatCard label="Invoices" value={count(invoices)} caption="All time" />
      <StatCard
        label="Overdue"
        value={count(overdue)}
        caption={overdue ? 'Past their due date' : 'Nothing overdue'}
        tone={overdue ? 'negative' : 'neutral'}
      />
    </StatStrip>
  );
}
