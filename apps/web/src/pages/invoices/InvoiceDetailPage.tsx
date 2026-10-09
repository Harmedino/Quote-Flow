import { type InvoiceDto, todayInTimeZone } from '@quoteflow/shared';
import { Banknote, Pencil, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { QueryError } from '@/components/QueryError';
import { InvoiceStatusBadge } from '@/components/StatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { DocumentCustomerCard } from '@/features/documents/DocumentCustomerCard';
import { toPublicBusiness } from '@/features/documents/public-business';
import { InvoiceActionsCard } from '@/features/invoices/InvoiceActionsCard';
import { InvoiceHero } from '@/features/invoices/InvoiceHero';
import { InvoicePaymentsCard } from '@/features/invoices/InvoicePaymentsCard';
import { InvoiceSharePanel } from '@/features/invoices/InvoiceSharePanel';
import { getInvoiceActions } from '@/features/invoices/invoice-view';
import { RecordPaymentDialog } from '@/features/invoices/RecordPaymentDialog';
import { useInvoiceQuery } from '@/features/invoices/use-invoices';
import { isMissingRecordError } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const BACK = { to: paths.invoices, label: 'Invoices' };

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-[32rem] rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { invoiceId = '' } = useParams();
  const query = useInvoiceQuery(invoiceId);

  if (query.data) return <InvoiceView key={query.data.id} invoice={query.data} />;
  return (
    <>
      <DocumentTitle title="Invoice" />
      <PageHeader title="Invoice" back={BACK} />
      {query.isPending ? (
        <>
          <p role="status" className="sr-only">
            Loading invoice…
          </p>
          <DetailSkeleton />
        </>
      ) : isMissingRecordError(query.error) ? (
        <Card>
          <EmptyState
            icon={Receipt}
            title="Invoice not found"
            description="It may have been deleted, or the link is incorrect."
            action={<ButtonLink to={paths.invoices}>Back to invoices</ButtonLink>}
          />
        </Card>
      ) : (
        <QueryError
          title="We couldn’t load this invoice"
          error={query.error}
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      )}
    </>
  );
}

function InvoiceView({ invoice }: { invoice: InvoiceDto }) {
  const { business } = useAuthenticatedSession();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [recorded, setRecorded] = useState<string | null>(null);
  const today = todayInTimeZone(business.timezone);
  const actions = getInvoiceActions(invoice);
  const cancelled = invoice.status === 'cancelled';
  const title = `Invoice ${invoice.invoiceNumber}`;
  const money = (amount: number) => formatMoney(amount, invoice.currency);

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        description={`For ${invoice.customer.name} · Issued ${formatCalendarDate(invoice.issueDate)}`}
        badge={<InvoiceStatusBadge status={invoice.status} />}
        back={BACK}
        actions={
          <>
            {actions.edit && (
              <ButtonLink to={paths.editInvoice(invoice.id)} variant="secondary">
                <Pencil aria-hidden="true" />
                Edit draft
              </ButtonLink>
            )}
            {actions.recordPayment && (
              <Button
                onClick={() => {
                  setRecorded(null);
                  setPaymentOpen(true);
                }}
              >
                <Banknote aria-hidden="true" />
                Record payment
              </Button>
            )}
          </>
        }
      />
      {recorded && (
        <Alert tone="success" className="mb-6">
          {recorded}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:items-start">
        <InvoiceHero
          invoice={invoice}
          today={today}
          timeZone={business.timezone}
          className="lg:col-start-1 lg:row-start-1"
        />
        <aside
          aria-label="Invoice actions"
          className="space-y-4 lg:sticky lg:top-8 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          {actions.share && <InvoiceSharePanel invoice={invoice} businessName={business.name} />}
          <DocumentCustomerCard customerId={invoice.customerId} customer={invoice.customer} />
          {(invoice.payments.length > 0 || (invoice.status !== 'draft' && !cancelled)) && (
            <InvoicePaymentsCard invoice={invoice} />
          )}
          <InvoiceActionsCard invoice={invoice} />
        </aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
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
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        invoice={invoice}
        today={today}
        onClose={() => setPaymentOpen(false)}
        onRecorded={(updated) => {
          setPaymentOpen(false);
          const paid = updated.amountPaid - invoice.amountPaid;
          setRecorded(
            updated.balanceDue > 0
              ? `${money(paid)} recorded. ${money(updated.balanceDue)} is still due.`
              : `${money(paid)} recorded. ${invoice.invoiceNumber} is paid in full.`,
          );
        }}
      />
    </>
  );
}
