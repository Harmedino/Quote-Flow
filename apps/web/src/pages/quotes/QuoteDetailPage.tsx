import type { BusinessDto, PublicBusinessDto } from '@quoteflow/shared';
import type { ReactNode } from 'react';
import { useLocation, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBusinessQuery } from '@/features/business/use-business';
import { readQuoteFlash } from '@/features/quotes/quote-flash';
import { LoadError } from '@/features/quotes/ui/LoadError';
import { QuoteActionsPanel } from '@/features/quotes/ui/QuoteActionsPanel';
import { QuoteFlashBanner } from '@/features/quotes/ui/QuoteFlashBanner';
import { QuoteSharePanel } from '@/features/quotes/ui/QuoteSharePanel';
import { QuoteTimeline } from '@/features/quotes/ui/QuoteTimeline';
import { useQuoteQuery } from '@/features/quotes/use-quotes';
import { formatMoney } from '@/lib/format';

function toPublicBusiness(business: BusinessDto): PublicBusinessDto {
  const { name, logoUrl, email, phone, website, address, brandColor } = business;
  return { name, logoUrl, email, phone, website, address, brandColor };
}

function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-950">{title}</h2>
      {children}
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading quote"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <Skeleton className="h-[36rem] rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}

export default function QuoteDetailPage() {
  const { quoteId = '' } = useParams<'quoteId'>();
  const location = useLocation();
  const { data: business } = useBusinessQuery();
  const query = useQuoteQuery(quoteId);
  const quote = query.data;
  const flash = readQuoteFlash(location.state);

  return (
    <>
      <DocumentTitle title={quote ? `Quote ${quote.quoteNumber}` : 'Quote'} />
      <PageHeader
        title={quote ? `Quote ${quote.quoteNumber}` : 'Quote'}
        description={
          quote
            ? `${quote.customer.name} · ${formatMoney(quote.totals.total, quote.currency)}`
            : undefined
        }
        back={{ to: paths.quotes, label: 'Quotes' }}
        actions={quote && <QuoteStatusBadge status={quote.status} />}
      />
      {query.isPending ? (
        <DetailSkeleton />
      ) : query.isError || !quote ? (
        <LoadError
          title="We couldn’t load this quote"
          error={query.error}
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {flash && <QuoteFlashBanner flash={flash} quote={quote} />}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <aside
              aria-label="Quote actions"
              className="space-y-4 lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1"
            >
              <PanelCard title="Share with customer">
                <QuoteSharePanel quote={quote} businessName={business.name} />
              </PanelCard>
              <PanelCard title="Actions">
                <QuoteActionsPanel quote={quote} />
              </PanelCard>
              <PanelCard title="Activity">
                <QuoteTimeline quote={quote} timeZone={business.timezone} />
              </PanelCard>
            </aside>
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <SalesDocument
                kind="quote"
                number={quote.quoteNumber}
                business={toPublicBusiness(business)}
                customer={quote.customer}
                currency={quote.currency}
                issueDate={quote.issueDate}
                secondaryDate={{ label: 'Valid until', value: quote.expiryDate }}
                items={quote.items}
                discount={quote.discount}
                taxRate={quote.taxRate}
                totals={quote.totals}
                notes={quote.notes}
                terms={quote.terms}
                status={<QuoteStatusBadge status={quote.status} />}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
