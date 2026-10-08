import { Plus, SearchX, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ListSearch } from '@/components/ListSearch';
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
import { CustomerList, CustomerListSkeleton } from './CustomerList';

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readCustomerListParams(searchParams);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (customers.isPending) return <CustomerListSkeleton />;
    if (customers.isError) {
      return (
        <div className="p-5 sm:p-6">
          <QueryError
            title="Couldn’t load customers"
            error={customers.error}
            onRetry={() => void customers.refetch()}
            retrying={customers.isRefetching}
          />
        </div>
      );
    }
    const { data, meta } = customers.data;
    if (meta.total === 0 && !filtered) {
      return (
        <EmptyState
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
      <div className={cn('transition-opacity', customers.isPlaceholderData && 'opacity-60')}>
        <CustomerList customers={data} />
        <div className="px-5 pb-4 sm:px-6">
          <Pagination meta={meta} label="customers" onPageChange={(page) => update({ page })} />
        </div>
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

      <Card>
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <ListSearch
            value={params.search}
            onSearch={(search) => update({ search }, true)}
            label="Search customers"
            placeholder="Search customers"
            className="w-full sm:max-w-sm"
          />
          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-zinc-700 select-none">
            <input
              type="checkbox"
              checked={params.archived}
              onChange={(event) => update({ archived: event.target.checked })}
              className="size-4 rounded border-zinc-400 accent-brand-600"
            />
            Show archived
          </label>
        </div>
        <p className="sr-only" aria-live="polite">
          {customers.data && !customers.isPlaceholderData
            ? `${customers.data.meta.total} ${customers.data.meta.total === 1 ? 'customer' : 'customers'}`
            : ''}
        </p>
        {renderContent()}
      </Card>

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
