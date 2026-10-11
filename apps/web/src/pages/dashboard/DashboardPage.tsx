import { type DashboardDto, todayInTimeZone } from '@quoteflow/shared';
import { Plus, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { QueryError } from '@/components/QueryError';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { firstName } from '@/features/auth/user-display';
import { useBusinessQuery } from '@/features/business/use-business';
import { formatPlace, formatToday, greeting } from '@/features/dashboard/dashboard-format';
import { gettingStartedChecklist } from '@/features/dashboard/getting-started';
import { clauseJoiner, summaryClauses } from '@/features/dashboard/summary';
import { useDashboardQuery } from '@/features/dashboard/use-dashboard';
import { DESKTOP_QUERY, useMediaQuery } from '@/features/dashboard/use-media-query';
import { useServicesQuery } from '@/features/services/use-services';
import { ActivityCard } from './ActivityCard';
import { DashboardSkeleton } from './DashboardSkeleton';
import { MoneyToCollect, WaitingForAnswer } from './DashboardLists';
import { GettingStarted } from './GettingStarted';
import { KeyFigures } from './KeyFigures';
import { NeedsAttention } from './NeedsAttention';

/** A business that has not issued anything yet sees the setup steps instead of empty figures. */
function isNewBusiness(dashboard: DashboardDto): boolean {
  return dashboard.quotes.total === 0 && dashboard.invoices.total === 0;
}

/** The line under the greeting: what is waiting on customers, overdue money last, in red. */
function Summary({ dashboard }: { dashboard: DashboardDto }) {
  if (isNewBusiness(dashboard)) return <>Let’s get you ready to send your first quote.</>;
  const clauses = summaryClauses(dashboard);
  if (clauses.length === 0) return <>Nothing is waiting on your customers right now.</>;
  return clauses.map((clause, index) => (
    <span key={clause.strong}>
      {clause.overdue ? (
        <span className="font-semibold text-overdue">{clause.strong}</span>
      ) : (
        <b className="font-semibold text-ink">{clause.strong}</b>
      )}
      {clause.rest}
      {clauseJoiner(index, clauses.length)}
    </span>
  ));
}

function DashboardContent({ dashboard, today }: { dashboard: DashboardDto; today: string }) {
  const business = useBusinessQuery().data;
  const services = useServicesQuery({ pageSize: 1 });
  // Until the service count arrives the checklist is left out, so it never flashes a done step.
  const checklist = services.data
    ? gettingStartedChecklist(business, dashboard, services.data.meta.total)
    : [];

  if (isNewBusiness(dashboard)) {
    return <GettingStarted items={checklist} />;
  }
  // Phones read the jobs first, then the chart and the lists; from `lg` the chart and the money
  // to collect fill the wide column, the jobs and waiting quotes the narrow one.
  return (
    <div className="space-y-5">
      <KeyFigures dashboard={dashboard} />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-5">
        <div className="contents lg:col-span-8 lg:flex lg:flex-col lg:gap-5">
          <ActivityCard
            activity={dashboard.activity}
            currency={dashboard.currency}
            className="order-2"
          />
          <MoneyToCollect dashboard={dashboard} today={today} className="order-3" />
        </div>
        <div className="contents lg:col-span-4 lg:grid lg:grid-rows-[1fr_auto] lg:gap-5">
          <NeedsAttention
            dashboard={dashboard}
            today={today}
            checklist={checklist}
            className="order-1"
          />
          <WaitingForAnswer dashboard={dashboard} className="order-4" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthenticatedSession();
  const { timezone, address } = useBusinessQuery().data;
  const dashboard = useDashboardQuery();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  // The greeting and date are fixed when the page opens, in the business's time zone.
  const [now] = useState(() => new Date());
  const name = firstName(user.name);
  const place = formatPlace(address);

  return (
    <>
      <DocumentTitle title="Dashboard" />
      <PageHeader
        eyebrow={
          <>
            {formatToday(now, timezone)}
            {place && <span className="max-sm:hidden"> · {place}</span>}
          </>
        }
        title={`${greeting(now, timezone)}${name ? `, ${name}` : ''}`}
        description={
          dashboard.data ? (
            <Summary dashboard={dashboard.data} />
          ) : dashboard.isPending ? (
            <span className="inline-block h-4 w-72 max-w-full animate-skeleton rounded-lg bg-line/80 align-middle" />
          ) : undefined
        }
        // Phones have the New key in the tab bar.
        actions={
          desktop && (
            <>
              <ButtonLink to={paths.newInvoice} variant="secondary">
                <ReceiptText aria-hidden="true" />
                New invoice
              </ButtonLink>
              <ButtonLink to={paths.newQuote}>
                <Plus aria-hidden="true" />
                New quote
              </ButtonLink>
            </>
          )
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
