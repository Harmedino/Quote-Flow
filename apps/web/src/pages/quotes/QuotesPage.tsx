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
    if (quotes.isPending) {
      return (
        <Card className="overflow-hidden">
          <QuoteListSkeleton />
        </Card>
      );
    }
    if (quotes.isError) {
      return (
        <QueryError
          title="We couldn’t load your quotes"
          error={quotes.error}
          retrying={quotes.isFetching}
          onRetry={() => void quotes.refetch()}
        />
      );
    }
    const { data, meta } = quotes.data;
    if (meta.total === 0 && filtered) {
      return (
        <EmptyState
          variant="dashed"
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
          variant="dashed"
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
      <div
        aria-busy={quotes.isPlaceholderData || undefined}
        className={cn('transition-opacity', quotes.isPlaceholderData && 'opacity-60')}
      >
        <Card className="overflow-hidden">
          <QuoteListResults quotes={data} />
        </Card>
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

      <div className="space-y-4">
        <StatusTabs current={listParams.status} />
        <ListToolbar>
          <ListSearch
            value={listParams.search}
            onSearch={(search) =>
              setParams(writeQuoteListParams(params, { search }), { replace: true })
            }
            label="Search quotes"
            placeholder="Search number or customer"
            className="w-full sm:max-w-xs"
          />
        </ListToolbar>
        {renderContent()}
      </div>
    </>
  );
}
