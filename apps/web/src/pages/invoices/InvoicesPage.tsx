import { Receipt } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function InvoicesPage() {
  return (
    <>
      <DocumentTitle title="Invoices" />
      <PageHeader
        title="Invoices"
        description="Track what you’re owed and record payments as they come in."
      />
      <ModulePlaceholder
        icon={Receipt}
        description="See unpaid, overdue and paid invoices in one place, created straight from accepted quotes."
      />
    </>
  );
}
