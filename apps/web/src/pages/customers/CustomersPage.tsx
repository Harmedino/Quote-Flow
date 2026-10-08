import { Users } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function CustomersPage() {
  return (
    <>
      <DocumentTitle title="Customers" />
      <PageHeader
        title="Customers"
        description="Keep your customers’ contact details and history in one place."
      />
      <ModulePlaceholder
        icon={Users}
        description="Add a customer once and reuse their details on every quote and invoice."
      />
    </>
  );
}
