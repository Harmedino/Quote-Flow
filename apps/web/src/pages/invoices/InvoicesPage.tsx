import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@quoteflow/shared';
import { Plus, Receipt, Search, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Pagination } from '@/components/Pagination';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
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
import { getErrorMessage } from '@/lib/api-client';
import { useDebouncedValue } from '@/lib/use-debounced-value';

function NoInvoices() {
  return (
    <EmptyState
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
  const [searchText, setSearchText] = useState(params.search);
  const debouncedSearch = useDebouncedValue(searchText.trim());

  const update = (changes: Partial<InvoiceListParams>) => {
    setSearchParams(toInvoiceListSearchParams({ ...params, page: 1, ...changes }), {
      replace: true,
    });
  };

  // The URL follows the search box once typing pauses.
  useEffect(() => {
    if (debouncedSearch !== params.search) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a settled search should write the URL
  }, [debouncedSearch]);

  const query = useInvoicesQuery(toInvoiceListQuery(params));
  const filtered = params.status !== null || params.search !== '';

  function clearFilters() {
    setSearchText('');
    update({ status: null, search: '' });
  }

  let content;
  if (query.isPending) {
    content = <InvoiceListSkeleton />;
  } else if (query.isError) {
    content = (
      <div className="p-5 sm:p-6">
        <Alert tone="danger" title="We couldn’t load your invoices">
          <p>{getErrorMessage(query.error)}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void query.refetch()}
            loading={query.isFetching}
          >
            Try again
          </Button>
        </Alert>
      </div>
    );
  } else if (query.data.data.length === 0) {
    content = filtered ? (
      <NoMatches status={params.status} onClear={clearFilters} />
    ) : (
      <NoInvoices />
    );
  } else {
    content = (
      <div aria-busy={query.isPlaceholderData || undefined}>
        <InvoiceList invoices={query.data.data} />
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

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <InvoiceStatusTabs value={params.status} onChange={(status) => update({ status })} />
        <div className="relative lg:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-zinc-400"
          />
          <Input
            type="search"
            aria-label="Search invoices"
            placeholder="Search number or customer"
            className="pl-9"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">{content}</Card>

      {query.data && query.data.data.length > 0 && (
        <div className="mt-4">
          <Pagination
            meta={query.data.meta}
            label="invoices"
            onPageChange={(page) => update({ page })}
          />
        </div>
      )}
    </>
  );
}
