import { Receipt } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InvoiceDetailPage() {
  return (
    <>
      <DocumentTitle title="Invoice" />
      <PageHeader
        title="Invoice"
        description="Review this invoice and record payments against it."
        back={{ to: paths.invoices, label: 'Invoices' }}
      />
      <ModulePlaceholder
        icon={Receipt}
        description="Record cash, bank transfer, card or mobile money payments and keep track of the balance due."
      />
    </>
  );
}
