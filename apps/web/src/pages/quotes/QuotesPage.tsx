import { FileText, Plus, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { ListSearch } from '@/components/ListSearch';
import { ListToolbar } from '@/components/ListToolbar';
import { Pagination } from '@/components/Pagination';
import { QueryError } from '@/components/QueryError';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  QUOTE_STATUS_TABS,
  readQuoteListParams,
  toQuoteListQuery,
  writeQuoteListParams,
} from '@/features/quotes/quote-list-params';
import { QuoteListResults, QuoteListSkeleton } from '@/features/quotes/ui/QuoteListResults';
import { StatusTabs } from '@/features/quotes/ui/StatusTabs';
import { useQuotesQuery } from '@/features/quotes/use-quotes';
import { cn } from '@/lib/cn';

export default function QuotesPage() {
  const [params, setParams] = useSearchParams();
  const listParams = readQuoteListParams(params);
  const quotes = useQuotesQuery(toQuoteListQuery(listParams));

  const filtered = listParams.status !== 'all' || listParams.search !== '';
  const statusLabel = QUOTE_STATUS_TABS.find((tab) => tab.value === listParams.status)?.label;

  function clearFilters() {
    setParams(writeQuoteListParams(params, { status: 'all', search: '' }));
  }

  function renderContent() {
    if (quotes.isPending) return <QuoteListSkeleton />;
    if (quotes.isError) {
      return (
        <div className="p-5 sm:p-6">
          <QueryError
            title="We couldn’t load your quotes"
            error={quotes.error}
            retrying={quotes.isFetching}
            onRetry={() => void quotes.refetch()}
          />
        </div>
      );
    }
    const { data, meta } = quotes.data;
    if (meta.total === 0 && filtered) {
      return (
        <EmptyState
          icon={Search}
          title="No quotes found"
          description={
            listParams.search
              ? `No ${statusLabel === 'All' ? '' : `${statusLabel?.toLowerCase()} `}quotes match “${listParams.search}”.`
              : `You have no ${statusLabel?.toLowerCase()} quotes.`
          }
          action={
            <Button variant="secondary" onClick={clearFilters}>
              <X aria-hidden="true" />
              Clear filters
            </Button>
          }
        />
      );
    }
    if (meta.total === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description="Build a professional quote from your services in under a minute, then share it by WhatsApp or link."
          action={
            <ButtonLink to={paths.newQuote}>
              <Plus aria-hidden="true" />
              Create your first quote
            </ButtonLink>
          }
        />
      );
    }
    return (
      <div className={cn('transition-opacity', quotes.isPlaceholderData && 'opacity-60')}>
        <QuoteListResults quotes={data} />
        <Pagination
          meta={meta}
          label="quotes"
          onPageChange={(page) => setParams(writeQuoteListParams(params, { page }))}
        />
      </div>
    );
  }

  return (
    <>
      <DocumentTitle title="Quotes" />
      <PageHeader
        title="Quotes"
        description="Create, send and track quotes for your customers."
        actions={
          <ButtonLink to={paths.newQuote}>
            <Plus aria-hidden="true" />
            New quote
          </ButtonLink>
        }
      />

      <div className="space-y-5">
        <StatusTabs current={listParams.status} />
        <Card>
          <ListToolbar>
            <ListSearch
              value={listParams.search}
              onSearch={(search) =>
                setParams(writeQuoteListParams(params, { search }), { replace: true })
              }
              label="Search quotes"
              placeholder="Search number or customer"
              className="w-full sm:max-w-sm"
            />
          </ListToolbar>
          {renderContent()}
        </Card>
      </div>
    </>
  );
}
