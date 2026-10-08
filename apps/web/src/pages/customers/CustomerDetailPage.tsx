import type { CustomerDto } from '@quoteflow/shared';
import { Archive, ArchiveRestore, FilePlus2, Pencil, UserRoundX } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { QueryError } from '@/components/QueryError';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog';
import {
  useArchiveCustomer,
  useCustomerQuery,
  useRestoreCustomer,
} from '@/features/customers/use-customers';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { CustomerContactCard, CustomerNotesCard } from './CustomerContactCard';
import { CustomerInvoicesCard, CustomerQuotesCard } from './CustomerDocumentsCards';

export default function CustomerDetailPage() {
  const { customerId = '' } = useParams();
  const customer = useCustomerQuery(customerId);

  if (customer.isPending) return <CustomerDetailSkeleton />;
  if (customer.isError) {
    const missing =
      isApiError(customer.error) &&
      (customer.error.code === 'NOT_FOUND' || customer.error.code === 'VALIDATION_ERROR');
    return (
      <>
        <DocumentTitle title="Customer" />
        <PageHeader title="Customer" back={{ to: paths.customers, label: 'Customers' }} />
        {missing ? (
          <EmptyState
            icon={UserRoundX}
            title="Customer not found"
            description="This customer doesn’t exist or belongs to another business."
            action={<ButtonLink to={paths.customers}>Back to customers</ButtonLink>}
          />
        ) : (
          <QueryError
            title="Couldn’t load this customer"
            error={customer.error}
            onRetry={() => void customer.refetch()}
            retrying={customer.isRefetching}
          />
        )}
      </>
    );
  }
  return <CustomerDetail customer={customer.data} />;
}

function CustomerDetail({ customer }: { customer: CustomerDto }) {
  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const archive = useArchiveCustomer();
  const restore = useRestoreCustomer();
  const archived = customer.archivedAt !== null;

  return (
    <>
      <DocumentTitle title={customer.name} />
      <PageHeader
        title={customer.name}
        back={{ to: paths.customers, label: 'Customers' }}
        description={
          (customer.company || archived) && (
            <span className="flex flex-wrap items-center gap-2">
              {customer.company}
              {archived && <Badge tone="neutral">Archived</Badge>}
            </span>
          )
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            {archived ? (
              <Button
                variant="secondary"
                loading={restore.isPending}
                onClick={() => restore.mutate(customer.id)}
              >
                <ArchiveRestore aria-hidden="true" />
                Restore
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    archive.reset();
                    setConfirmingArchive(true);
                  }}
                >
                  <Archive aria-hidden="true" />
                  Archive
                </Button>
                <ButtonLink to={`${paths.newQuote}?customerId=${encodeURIComponent(customer.id)}`}>
                  <FilePlus2 aria-hidden="true" />
                  New quote
                </ButtonLink>
              </>
            )}
          </>
        }
      />

      {restore.isError && (
        <Alert tone="danger" className="mb-6">
          {getErrorMessage(restore.error)}
        </Alert>
      )}
      {archived && (
        <Alert tone="warning" title="This customer is archived" className="mb-6">
          They’re hidden from your customer list and can’t be picked for new quotes. Their existing
          quotes and invoices are unchanged. Restore them to work with them again.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <CustomerContactCard customer={customer} />
          <CustomerNotesCard customer={customer} onEdit={() => setEditing(true)} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <CustomerQuotesCard customer={customer} />
          <CustomerInvoicesCard customer={customer} />
        </div>
      </div>

      <CustomerFormDialog
        open={editing}
        customer={customer}
        onClose={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
      <ConfirmDialog
        open={confirmingArchive}
        title={`Archive ${customer.name}?`}
        description="They’ll be hidden from your customer list and from new quotes. Existing quotes and invoices stay as they are, and you can restore them at any time."
        confirmLabel="Archive customer"
        pending={archive.isPending}
        error={archive.isError ? getErrorMessage(archive.error) : null}
        onCancel={() => setConfirmingArchive(false)}
        onConfirm={() =>
          archive.mutate(customer.id, { onSuccess: () => setConfirmingArchive(false) })
        }
      />
    </>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading customer">
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 mb-8 h-4 w-40" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
