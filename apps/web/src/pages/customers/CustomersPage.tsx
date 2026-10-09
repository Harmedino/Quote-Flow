import { Plus, SearchX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { NEW_PARAM, paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ListSearch } from '@/components/ListSearch';
import { ListToolbar } from '@/components/ListToolbar';
import { Pagination } from '@/components/Pagination';
import { QueryError } from '@/components/QueryError';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog';
import type { CustomerListOptions } from '@/features/customers/customers-api';
import {
  type CustomerListParams,
  readCustomerListParams,
  toCustomerListSearchParams,
} from '@/features/customers/customer-list-params';
import { useCustomersQuery } from '@/features/customers/use-customers';
import { cn } from '@/lib/cn';
import { useSearchFlag } from '@/lib/use-search-flag';
import { CustomerList, CustomerListSkeleton } from './CustomerList';

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readCustomerListParams(searchParams);
  const [dialogOpen, setDialogOpen] = useState(false);
  useSearchFlag(NEW_PARAM, () => setDialogOpen(true));

  const query: CustomerListOptions = {
    page: params.page,
    pageSize: PAGE_SIZE,
    ...(params.search && { search: params.search }),
    ...(params.archived && { archived: true }),
  };
  const customers = useCustomersQuery(query);

  function update(changes: Partial<CustomerListParams>, replace = false) {
    setSearchParams(toCustomerListSearchParams({ ...params, page: 1, ...changes }), { replace });
  }

  // A page past the end (e.g. after archiving its last customer) moves to the last page.
  const totalPages = customers.data?.meta.totalPages ?? 0;
  const pastLastPage = totalPages > 0 && params.page > totalPages;
  useEffect(() => {
    if (pastLastPage) {
      setSearchParams(toCustomerListSearchParams({ ...params, page: totalPages }), {
        replace: true,
      });
    }
  });

  const filtered = Boolean(params.search) || params.archived;
  const addButton = (
    <Button onClick={() => setDialogOpen(true)}>
      <Plus aria-hidden="true" />
      Add customer
    </Button>
  );

  function renderContent() {
    if (customers.isPending) {
      return (
        <Card className="overflow-hidden">
          <CustomerListSkeleton />
        </Card>
      );
    }
    if (customers.isError) {
      return (
        <QueryError
          title="Couldn’t load customers"
          error={customers.error}
          onRetry={() => void customers.refetch()}
          retrying={customers.isRefetching}
        />
      );
    }
    const { data, meta } = customers.data;
    if (meta.total === 0 && !filtered) {
      return (
        <EmptyState
          variant="dashed"
          icon={Users}
          title="Add your first customer"
          description="Save a customer once and reuse their details on every quote and invoice."
          action={addButton}
        />
      );
    }
    if (meta.total === 0) {
      return (
        <EmptyState
          variant="dashed"
          icon={SearchX}
          title="No customers found"
          description={
            params.search
              ? `Nothing matches “${params.search}”. Check the spelling or try a phone number or company.`
              : 'There are no customers to show.'
          }
          action={
            <Button variant="secondary" onClick={() => update({ search: '' })}>
              Clear search
            </Button>
          }
        />
      );
    }
    return (
      <div
        aria-busy={customers.isPlaceholderData || undefined}
        className={cn('transition-opacity', customers.isPlaceholderData && 'opacity-60')}
      >
        <Card className="overflow-hidden">
          <CustomerList customers={data} />
        </Card>
        <Pagination meta={meta} label="customers" onPageChange={(page) => update({ page })} />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Customers" />
      <PageHeader
        title="Customers"
        description="Keep your customers’ contact details and history in one place."
        actions={addButton}
      />

      <div className="space-y-4">
        <ListToolbar>
          <ListSearch
            value={params.search}
            onSearch={(search) => update({ search }, true)}
            label="Search customers"
            placeholder="Search name, phone or company"
            className="w-full sm:max-w-xs"
          />
          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-700 select-none">
            <input
              type="checkbox"
              checked={params.archived}
              onChange={(event) => update({ archived: event.target.checked })}
              className="size-4 rounded border-stone-400 accent-brand-600"
            />
            Show archived
          </label>
        </ListToolbar>
        <p className="sr-only" aria-live="polite">
          {customers.data && !customers.isPlaceholderData
            ? `${customers.data.meta.total} ${customers.data.meta.total === 1 ? 'customer' : 'customers'}`
            : ''}
        </p>
        {renderContent()}
      </div>

      <CustomerFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={(customer) => {
          setDialogOpen(false);
          void navigate(paths.customer(customer.id));
        }}
      />
    </>
  );
}
