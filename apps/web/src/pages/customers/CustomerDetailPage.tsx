import { UserRound } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomerDetailPage() {
  return (
    <>
      <DocumentTitle title="Customer" />
      <PageHeader
        title="Customer"
        description="Contact details, quotes and invoices for this customer."
        back={{ to: paths.customers, label: 'Customers' }}
      />
      <ModulePlaceholder
        icon={UserRound}
        description="See every quote and invoice for this customer and start a new quote for them."
      />
    </>
  );
}
