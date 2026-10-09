import { Lock, Receipt } from 'lucide-react';
import { useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { PageLoader } from '@/components/PageLoader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { invoiceFormValuesFromInvoice } from '@/features/invoices/invoice-form';
import { InvoiceEditor } from '@/features/invoices/InvoiceEditor';
import { useInvoiceQuery } from '@/features/invoices/use-invoices';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { canEditInvoice } from '@quoteflow/shared';

export default function EditInvoicePage() {
  const { invoiceId = '' } = useParams();
  const { business } = useAuthenticatedSession();
  const query = useInvoiceQuery(invoiceId);
  const back = { to: paths.invoice(invoiceId), label: 'Invoice' };

  if (query.isPending) return <PageLoader />;

  if (query.isError) {
    const missing = isApiError(query.error) && query.error.status === 404;
    return (
      <>
        <DocumentTitle title="Edit invoice" />
        <PageHeader title="Edit invoice" back={{ to: paths.invoices, label: 'Invoices' }} />
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
  const title = `Edit ${invoice.invoiceNumber}`;

  if (!canEditInvoice(invoice.status)) {
    return (
      <>
        <DocumentTitle title={title} />
        <PageHeader title={title} back={back} />
        <Card>
          <EmptyState
            icon={Lock}
            title="This invoice can no longer be edited"
            description="Only drafts can be changed. Once an invoice is sent, record payments against it or cancel it instead."
            action={<ButtonLink to={paths.invoice(invoice.id)}>View invoice</ButtonLink>}
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader title={title} description={`Draft for ${invoice.customer.name}`} back={back} />
      <InvoiceEditor
        key={invoice.id}
        business={business}
        invoice={invoice}
        initialValues={invoiceFormValuesFromInvoice(invoice)}
        initialCustomer={{ id: invoice.customerId, ...invoice.customer }}
      />
    </>
  );
}
