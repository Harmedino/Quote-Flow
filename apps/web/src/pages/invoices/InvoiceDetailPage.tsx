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
import { DESKTOP_QUERY, useMediaQuery } from '@/features/dashboard/use-media-query';
import { DETAIL_ASIDE, DETAIL_GRID } from '@/features/documents/detail-layout';
import { DocumentCustomerCard } from '@/features/documents/DocumentCustomerCard';
import { toPublicBusiness } from '@/features/documents/public-business';
import { InvoiceActionsCard } from '@/features/invoices/InvoiceActionsCard';
import { InvoiceHero } from '@/features/invoices/InvoiceHero';
import { InvoicePaymentsCard } from '@/features/invoices/InvoicePaymentsCard';
import { InvoiceSharePanel } from '@/features/invoices/InvoiceSharePanel';
import { getInvoiceActions, invoiceStamp } from '@/features/invoices/invoice-view';
import { RecordPaymentDialog } from '@/features/invoices/RecordPaymentDialog';
import { useInvoiceQuery } from '@/features/invoices/use-invoices';
import { isMissingRecordError } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const BACK = { to: paths.invoices, label: 'Invoices' };

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className={DETAIL_GRID}>
      <div className="space-y-5">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-[32rem] rounded-xl" />
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
  // The stamp thumps down only when the status changes while the page is open (e.g. paid in full).
  const [statusOnArrival] = useState(invoice.status);
  const today = todayInTimeZone(business.timezone);
  const actions = getInvoiceActions(invoice);
  const cancelled = invoice.status === 'cancelled';
  const title = `Invoice ${invoice.invoiceNumber}`;
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const stamp = invoiceStamp(invoice, today, business.timezone);
  // Phones show the ticket straight after sharing, before the side cards; desktop keeps sharing
  // at the top of the side column.
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const share = actions.share && (
    <InvoiceSharePanel invoice={invoice} businessName={business.name} />
  );

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
        <Alert tone="success" className="mb-5">
          {recorded}
        </Alert>
      )}

      <div className={DETAIL_GRID}>
        <InvoiceHero
          invoice={invoice}
          today={today}
          timeZone={business.timezone}
          className="lg:col-start-1 lg:row-start-1"
        />
        {!desktop && share}
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
            // A stamp says it when there is one; otherwise the tag does.
            status={stamp ? undefined : <InvoiceStatusBadge status={invoice.status} />}
            stamp={stamp && { ...stamp, animate: invoice.status !== statusOnArrival }}
          />
        </div>
        <aside aria-label="Invoice actions" className={DETAIL_ASIDE}>
          {desktop && share}
          <DocumentCustomerCard customerId={invoice.customerId} customer={invoice.customer} />
          {(invoice.payments.length > 0 || (invoice.status !== 'draft' && !cancelled)) && (
            <InvoicePaymentsCard invoice={invoice} />
          )}
          <InvoiceActionsCard invoice={invoice} />
        </aside>
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
