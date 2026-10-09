import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@quoteflow/shared';
import { Plus, Receipt, SearchX } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ListSearch } from '@/components/ListSearch';
import { ListToolbar } from '@/components/ListToolbar';
import { Pagination } from '@/components/Pagination';
import { QueryError } from '@/components/QueryError';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceList, InvoiceListSkeleton } from '@/features/invoices/InvoiceList';
import {
  type InvoiceListParams,
  readInvoiceListParams,
  toInvoiceListQuery,
  toInvoiceListSearchParams,
} from '@/features/invoices/invoice-list-params';
import { InvoiceStatusTabs } from '@/features/invoices/InvoiceStatusTabs';
import { useInvoicesQuery } from '@/features/invoices/use-invoices';
import { cn } from '@/lib/cn';

function NoInvoices() {
  return (
    <EmptyState
      variant="dashed"
      icon={Receipt}
      title="No invoices yet"
      description="Invoices are created from accepted quotes in one click, or you can bill a customer directly with a new invoice."
      action={
        <>
          <ButtonLink to={paths.quotes} variant="secondary">
            View quotes
          </ButtonLink>
          <ButtonLink to={paths.newInvoice}>
            <Plus aria-hidden="true" />
            New invoice
          </ButtonLink>
        </>
      }
    />
  );
}

function NoMatches({ status, onClear }: { status: InvoiceStatus | null; onClear: () => void }) {
  return (
    <EmptyState
      variant="dashed"
      icon={SearchX}
      title="No matching invoices"
      description={
        status
          ? `No ${INVOICE_STATUS_LABELS[status].toLowerCase()} invoices match these filters.`
          : 'Try a different invoice number or customer name.'
      }
      action={
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      }
    />
  );
}

export default function InvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readInvoiceListParams(searchParams);

  const update = (changes: Partial<InvoiceListParams>) => {
    setSearchParams(toInvoiceListSearchParams({ ...params, page: 1, ...changes }), {
      replace: true,
    });
  };

  const query = useInvoicesQuery(toInvoiceListQuery(params));
  const filtered = params.status !== null || params.search !== '';

  function clearFilters() {
    update({ status: null, search: '' });
  }

  let content;
  if (query.isPending) {
    content = (
      <Card className="overflow-hidden">
        <InvoiceListSkeleton />
      </Card>
    );
  } else if (query.isError) {
    content = (
      <QueryError
        title="We couldn’t load your invoices"
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  } else if (query.data.data.length === 0) {
    content = filtered ? (
      <NoMatches status={params.status} onClear={clearFilters} />
    ) : (
      <NoInvoices />
    );
  } else {
    content = (
      <div
        aria-busy={query.isPlaceholderData || undefined}
        className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}
      >
        <Card className="overflow-hidden">
          <InvoiceList invoices={query.data.data} />
        </Card>
        <Pagination
          meta={query.data.meta}
          label="invoices"
          onPageChange={(page) => update({ page })}
        />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Invoices" />
      <PageHeader
        title="Invoices"
        description="Track what you’re owed and record payments as they come in."
        actions={
          <ButtonLink to={paths.newInvoice}>
            <Plus aria-hidden="true" />
            New invoice
          </ButtonLink>
        }
      />

      <div className="space-y-4">
        <InvoiceStatusTabs value={params.status} onChange={(status) => update({ status })} />
        <ListToolbar>
          <ListSearch
            value={params.search}
            onSearch={(search) => update({ search })}
            label="Search invoices"
            placeholder="Search number or customer"
            className="w-full sm:max-w-xs"
          />
        </ListToolbar>
        {content}
      </div>
    </>
  );
}
