import { FileText, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { useDebouncedValue } from '@/features/quotes/editor/use-debounced-value';
import {
  QUOTE_STATUS_TABS,
  readQuoteListParams,
  toQuoteListQuery,
  writeQuoteListParams,
} from '@/features/quotes/quote-list-params';
import { LoadError } from '@/features/quotes/ui/LoadError';
import { QuoteListResults, QuoteListSkeleton } from '@/features/quotes/ui/QuoteListResults';
import { StatusTabs } from '@/features/quotes/ui/StatusTabs';
import { useQuotesQuery } from '@/features/quotes/use-quotes';

export default function QuotesPage() {
  const [params, setParams] = useSearchParams();
  const listParams = readQuoteListParams(params);
  const [searchText, setSearchText] = useState(listParams.search);
  const debouncedSearch = useDebouncedValue(searchText.trim(), 300);
  const quotes = useQuotesQuery(toQuoteListQuery(listParams));

  // Typing updates the URL once the user pauses; history is replaced, not pushed per keystroke.
  useEffect(() => {
    if (debouncedSearch === readQuoteListParams(params).search) return;
    setParams(writeQuoteListParams(params, { search: debouncedSearch }), { replace: true });
  }, [debouncedSearch, params, setParams]);

  const filtered = listParams.status !== 'all' || listParams.search !== '';
  const statusLabel = QUOTE_STATUS_TABS.find((tab) => tab.value === listParams.status)?.label;

  function clearFilters() {
    setSearchText('');
    setParams(writeQuoteListParams(params, { status: 'all', search: '' }));
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
        <div className="flex flex-col gap-4">
          <StatusTabs current={listParams.status} />
          <div className="relative max-w-md">
            <label htmlFor="quote-search" className="sr-only">
              Search quotes
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              id="quote-search"
              type="search"
              placeholder="Search by quote number or customer"
              className="pl-9"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
        </div>

        {quotes.isPending ? (
          <QuoteListSkeleton />
        ) : quotes.isError ? (
          <LoadError
            title="We couldn’t load your quotes"
            error={quotes.error}
            retrying={quotes.isFetching}
            onRetry={() => void quotes.refetch()}
          />
        ) : quotes.data.meta.total === 0 ? (
          filtered ? (
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
              className="rounded-xl border border-zinc-200 bg-white"
            />
          ) : (
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
              className="rounded-xl border border-dashed border-zinc-300 bg-white"
            />
          )
        ) : (
          <div className={quotes.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <QuoteListResults quotes={quotes.data.data} />
            <div className="mt-4">
              <Pagination
                meta={quotes.data.meta}
                label="quotes"
                onPageChange={(page) => setParams(writeQuoteListParams(params, { page }))}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
