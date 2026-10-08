import { LayoutDashboard } from 'lucide-react';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { firstName } from '@/features/auth/user-display';

export default function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const name = firstName(user.name);

  return (
    <>
      <DocumentTitle title="Dashboard" />
      <PageHeader
        title={name ? `Welcome, ${name}` : 'Welcome'}
        description="An overview of your quotes, invoices and payments."
      />
      <ModulePlaceholder
        icon={LayoutDashboard}
        description="See open quotes, recent customer responses and money owed to you at a glance."
      />
    </>
  );
}
