import { todayInTimeZone } from '@quoteflow/shared';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { newInvoiceFormValues } from '@/features/invoices/invoice-form';
import { InvoiceEditor } from '@/features/invoices/InvoiceEditor';

export default function NewInvoicePage() {
  const { business } = useAuthenticatedSession();
  const [initialValues] = useState(() =>
    newInvoiceFormValues(business, todayInTimeZone(business.timezone)),
  );

  return (
    <>
      <DocumentTitle title="New invoice" />
      <PageHeader
        title="New invoice"
        description="Bill a customer directly. To invoice an accepted quote, convert it from the quote instead."
        back={{ to: paths.invoices, label: 'Invoices' }}
      />
      <InvoiceEditor business={business} initialValues={initialValues} initialCustomer={null} />
    </>
  );
}
