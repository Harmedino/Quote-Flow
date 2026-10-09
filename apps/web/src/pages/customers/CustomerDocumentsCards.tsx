import type { CustomerDto, PaginationMeta } from '@quoteflow/shared';
import type { UseQueryResult } from '@tanstack/react-query';
import { FileText, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { QueryError } from '@/components/QueryError';
import { InvoiceStatusBadge, QuoteStatusBadge } from '@/components/StatusBadge';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CUSTOMER_DOCUMENTS_LIMIT,
  useCustomerInvoicesQuery,
  useCustomerQuotesQuery,
} from '@/features/customers/customer-documents-api';
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
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-2/3" />
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
    content = <div className="px-5 py-8 text-center text-sm text-zinc-500 sm:px-6">{empty}</div>;
  } else {
    content = <ul className="divide-y divide-zinc-100">{query.data.data.map(renderRow)}</ul>;
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
  number,
  badge,
  meta,
  amount,
  amountNote,
}: {
  to: string;
  number: string;
  badge: ReactNode;
  meta: string;
  amount: string;
  amountNote?: string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50 sm:px-6"
      >
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-950">{number}</span>
            {badge}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-zinc-950 tabular-nums">{amount}</p>
          {amountNote && <p className="mt-0.5 text-xs text-zinc-500">{amountNote}</p>}
        </div>
      </Link>
    </li>
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
          <FileText aria-hidden="true" className="mx-auto mb-2 size-5 text-zinc-400" />
          <p>No quotes for this customer yet.</p>
          {!customer.archivedAt && (
            <ButtonLink
              to={`${paths.newQuote}?customerId=${encodeURIComponent(customer.id)}`}
              variant="secondary"
              size="sm"
              className="mt-3"
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
          <Receipt aria-hidden="true" className="mx-auto mb-2 size-5 text-zinc-400" />
          <p>No invoices for this customer yet. Accepted quotes can be turned into invoices.</p>
        </>
      }
      renderRow={(invoice) => (
        <DocumentRow
          key={invoice.id}
          to={paths.invoice(invoice.id)}
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
