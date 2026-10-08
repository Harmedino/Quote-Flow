import { todayInTimeZone } from '@quoteflow/shared';
import { Receipt } from 'lucide-react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { InvoiceStatusBadge } from '@/components/StatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { InvoiceActionsCard } from '@/features/invoices/InvoiceActionsCard';
import { InvoicePaymentsCard } from '@/features/invoices/InvoicePaymentsCard';
import { InvoiceSummaryCard } from '@/features/invoices/InvoiceSummaryCard';
import { toPublicBusiness } from '@/features/invoices/invoice-view';
import { useInvoiceQuery } from '@/features/invoices/use-invoices';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Skeleton className="h-[36rem] rounded-xl" />
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams();
  const { business } = useAuthenticatedSession();
  const query = useInvoiceQuery(invoiceId);
  const back = { to: paths.invoices, label: 'Invoices' };

  if (query.isPending) {
    return (
      <>
        <DocumentTitle title="Invoice" />
        <PageHeader title="Invoice" back={back} />
        <p role="status" className="sr-only">
          Loading invoice…
        </p>
        <DetailSkeleton />
      </>
    );
  }

  if (query.isError) {
    const missing = isApiError(query.error) && query.error.status === 404;
    return (
      <>
        <DocumentTitle title="Invoice" />
        <PageHeader title="Invoice" back={back} />
        <Card>
          {missing ? (
            <EmptyState
              icon={Receipt}
              title="Invoice not found"
              description="It may have been deleted, or the link is incorrect."
              action={<ButtonLink to={paths.invoices}>Back to invoices</ButtonLink>}
            />
          ) : (
            <div className="p-5 sm:p-6">
              <Alert tone="danger" title="We couldn’t load this invoice">
                <p>{getErrorMessage(query.error)}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  loading={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            </div>
          )}
        </Card>
      </>
    );
  }

  const invoice = query.data;
  const today = todayInTimeZone(business.timezone);
  const cancelled = invoice.status === 'cancelled';

  return (
    <>
      <DocumentTitle title={invoice.invoiceNumber} />
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.customer.name} · ${formatMoney(invoice.totals.total, invoice.currency)}`}
        back={back}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="order-2 min-w-0 lg:order-1">
          <SalesDocument
            kind="invoice"
            number={invoice.invoiceNumber}
            business={toPublicBusiness(business)}
            customer={invoice.customer}
            currency={invoice.currency}
            issueDate={invoice.issueDate}
            secondaryDate={{ label: 'Due date', value: invoice.dueDate }}
            items={invoice.items}
            discount={invoice.discount}
            taxRate={invoice.taxRate}
            totals={invoice.totals}
            // A cancelled invoice is no longer owed, so it shows no balance.
            amountPaid={cancelled ? undefined : invoice.amountPaid}
            balanceDue={cancelled ? undefined : invoice.balanceDue}
            notes={invoice.notes}
            terms={invoice.terms}
            status={<InvoiceStatusBadge status={invoice.status} />}
          />
        </div>
        <aside
          aria-label="Invoice actions"
          className="order-1 space-y-6 lg:sticky lg:top-6 lg:order-2"
        >
          <InvoiceSummaryCard invoice={invoice} timeZone={business.timezone} />
          <InvoiceActionsCard invoice={invoice} businessName={business.name} today={today} />
          {(invoice.payments.length > 0 ||
            (invoice.status !== 'draft' && invoice.status !== 'cancelled')) && (
            <InvoicePaymentsCard invoice={invoice} />
          )}
        </aside>
      </div>
    </>
  );
}
