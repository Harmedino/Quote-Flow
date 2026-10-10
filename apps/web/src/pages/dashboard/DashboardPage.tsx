import { type DashboardDto, todayInTimeZone } from '@quoteflow/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { QueryError } from '@/components/QueryError';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { firstName } from '@/features/auth/user-display';
import { useBusinessQuery } from '@/features/business/use-business';
import { formatLongToday, greeting, plural } from '@/features/dashboard/dashboard-format';
import { gettingStartedChecklist } from '@/features/dashboard/getting-started';
import { useDashboardQuery } from '@/features/dashboard/use-dashboard';
import { useServicesQuery } from '@/features/services/use-services';
import { ActivityCard } from './ActivityCard';
import { AttentionBanners } from './AttentionBanners';
import { BusinessSnapshot } from './BusinessSnapshot';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MoneyToCollect, RecentInvoices, RecentQuotes } from './DashboardLists';
import { GettingStarted } from './GettingStarted';
import { KeyFigures } from './KeyFigures';

/** A business that has not issued anything yet sees the setup steps instead of empty figures. */
function isNewBusiness(dashboard: DashboardDto): boolean {
  return dashboard.quotes.total === 0 && dashboard.recentInvoices.length === 0;
}

/** The line under the greeting: what is waiting on customers, overdue money last. */
function Summary({ dashboard }: { dashboard: DashboardDto }) {
  const { quotes, invoices } = dashboard;
  if (isNewBusiness(dashboard)) return <>Let’s get you ready to send your first quote.</>;
  const parts: string[] = [];
  if (quotes.pending > 0) parts.push(`${plural(quotes.pending, 'quote')} waiting for an answer`);
  if (quotes.acceptedNotInvoiced > 0) parts.push(`${quotes.acceptedNotInvoiced} ready to invoice`);
  const overdue =
    invoices.overdueCount > 0 ? `${plural(invoices.overdueCount, 'invoice')} overdue` : null;
  if (parts.length === 0 && !overdue) return <>Nothing is waiting on your customers right now.</>;
  return (
    <>
      {parts.join(' · ')}
      {overdue && (
        <span className="text-amber-700">
          {parts.length > 0 && ' · '}
          {overdue}
        </span>
      )}
    </>
  );
}

function DashboardContent({ dashboard, today }: { dashboard: DashboardDto; today: string }) {
  const { user } = useAuthenticatedSession();
  const business = useBusinessQuery().data;
  const services = useServicesQuery({ pageSize: 1 });
  const checklist = gettingStartedChecklist(business, dashboard, services.data?.meta.total ?? 0);

  if (isNewBusiness(dashboard)) {
    return <GettingStarted items={checklist} />;
  }
  return (
    <div className="space-y-6">
      <KeyFigures dashboard={dashboard} />
      <ActivityCard activity={dashboard.activity} currency={dashboard.currency} />
      {/* The setup reminder waits for the service count, so it never flashes a done step. */}
      <AttentionBanners dashboard={dashboard} checklist={services.data ? checklist : []} />
      <div className="grid grid-cols-1 gap-8 pt-2 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <MoneyToCollect invoices={dashboard.upcomingInvoices} today={today} />
          <RecentQuotes quotes={dashboard.recentQuotes} />
          <RecentInvoices invoices={dashboard.recentInvoices} />
        </div>
        <div className="xl:sticky xl:top-8 xl:self-start">
          <BusinessSnapshot
            business={business}
            canEditBusiness={user.role === 'owner'}
            customers={dashboard.recentCustomers}
          />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const { timezone } = useBusinessQuery().data;
  const dashboard = useDashboardQuery();
  // The greeting and date are fixed when the page opens, in the business's time zone.
  const [now] = useState(() => new Date());
  const name = firstName(user.name);

  return (
    <>
      <DocumentTitle title="Dashboard" />
      <PageHeader
        eyebrow={formatLongToday(now, timezone)}
        title={`${greeting(now, timezone)}${name ? `, ${name}` : ''}`}
        description={
          dashboard.data ? (
            <Summary dashboard={dashboard.data} />
          ) : dashboard.isPending ? (
            <span className="inline-block h-4 w-64 max-w-full animate-skeleton rounded bg-stone-200/70 align-middle" />
          ) : undefined
        }
        actions={
          <ButtonLink to={paths.newQuote}>
            <Plus aria-hidden="true" />
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
        <DashboardContent dashboard={dashboard.data} today={todayInTimeZone(timezone, now)} />
      )}
    </>
  );
}
