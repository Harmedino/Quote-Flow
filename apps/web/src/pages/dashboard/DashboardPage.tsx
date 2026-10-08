import { LayoutDashboard } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DashboardPage() {
  return (
    <>
      <DocumentTitle title="Dashboard" />
      <PageHeader
        title="Dashboard"
        description="An overview of your quotes, invoices and payments."
      />
      <ModulePlaceholder
        icon={LayoutDashboard}
        description="See open quotes, recent customer responses and money owed to you at a glance."
      />
    </>
  );
}
