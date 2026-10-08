import type { DashboardDto } from '@quoteflow/shared';
import { FilePlus2 } from 'lucide-react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { QueryError } from '@/components/QueryError';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextLink } from '@/components/ui/TextLink';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { firstName } from '@/features/auth/user-display';
import { useBusinessQuery } from '@/features/business/use-business';
import { gettingStartedChecklist } from '@/features/dashboard/getting-started';
import { useDashboardQuery } from '@/features/dashboard/use-dashboard';
import { useServicesQuery } from '@/features/services/use-services';
import { formatMoney } from '@/lib/format';
import { DashboardSkeleton } from './DashboardSkeleton';
import {
  RecentCustomersCard,
  RecentInvoicesCard,
  RecentQuotesCard,
  UpcomingInvoicesCard,
} from './DashboardLists';
import { GettingStarted } from './GettingStarted';
import { StatTiles } from './StatTiles';

function OverdueCallout({ dashboard }: { dashboard: DashboardDto }) {
  const { overdueCount, overdueAmount } = dashboard.invoices;
  if (overdueAmount <= 0) return null;
  const invoices = overdueCount === 1 ? '1 invoice is' : `${overdueCount} invoices are`;
  return (
    <Alert tone="danger" title={`${invoices} overdue`}>
      <p>
        {formatMoney(overdueAmount, dashboard.currency)} is past its due date.{' '}
        <TextLink to={`${paths.invoices}?status=overdue`} className="text-red-800">
          Review overdue invoices
        </TextLink>
      </p>
    </Alert>
  );
}

function DashboardContent({ dashboard }: { dashboard: DashboardDto }) {
  const business = useBusinessQuery().data;
  const services = useServicesQuery({ pageSize: 1 });
  const checklist = gettingStartedChecklist(business, dashboard, services.data?.meta.total ?? 0);
  // A business that has not issued anything yet sees the setup steps instead of empty figures.
  const isNew = dashboard.quotes.total === 0 && dashboard.recentInvoices.length === 0;

  if (isNew) {
    return <GettingStarted items={checklist} />;
  }
  return (
    <div className="space-y-8">
      <OverdueCallout dashboard={dashboard} />
      <StatTiles dashboard={dashboard} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentQuotesCard quotes={dashboard.recentQuotes} />
        <UpcomingInvoicesCard invoices={dashboard.upcomingInvoices} />
        <RecentInvoicesCard invoices={dashboard.recentInvoices} />
        <RecentCustomersCard customers={dashboard.recentCustomers} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const name = firstName(user.name);
  const dashboard = useDashboardQuery();

  return (
    <>
      <DocumentTitle title="Dashboard" />
      <PageHeader
        title={name ? `Welcome, ${name}` : 'Welcome'}
        description="An overview of your quotes, invoices and payments."
        actions={
          <ButtonLink to={paths.newQuote}>
            <FilePlus2 aria-hidden="true" />
            New quote
          </ButtonLink>
        }
      />
      {dashboard.isPending ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <QueryError
          title="Couldn’t load your dashboard"
          error={dashboard.error}
          onRetry={() => void dashboard.refetch()}
          retrying={dashboard.isFetching}
        />
      ) : (
        <DashboardContent dashboard={dashboard.data} />
      )}
    </>
  );
}
