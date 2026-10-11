import {
  type QuoteDto,
  type QuoteStatus,
  canConvertQuote,
  canEditQuote,
  todayInTimeZone,
} from '@quoteflow/shared';
import { Pencil, Receipt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { QueryError } from '@/components/QueryError';
import { QuoteStatusBadge } from '@/components/StatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { PanelCard } from '@/components/ui/PanelCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBusinessQuery } from '@/features/business/use-business';
import { DESKTOP_QUERY, useMediaQuery } from '@/features/dashboard/use-media-query';
import { DocumentCustomerCard } from '@/features/documents/DocumentCustomerCard';
import { DETAIL_ASIDE, DETAIL_GRID } from '@/features/documents/detail-layout';
import { DocumentHero, type DocumentHeroTone } from '@/features/documents/DocumentHero';
import { toPublicBusiness } from '@/features/documents/public-business';
import { readQuoteFlash } from '@/features/quotes/quote-flash';
import { quoteOutlook, quoteStamp } from '@/features/quotes/quote-outlook';
import { QuoteActionsPanel } from '@/features/quotes/ui/QuoteActionsPanel';
import { QuoteFlashBanner } from '@/features/quotes/ui/QuoteFlashBanner';
import { QuoteNotFound } from '@/features/quotes/ui/QuoteNotFound';
import { QuoteProgress } from '@/features/quotes/ui/QuoteProgress';
import { QuoteSharePanel } from '@/features/quotes/ui/QuoteSharePanel';
import { QuoteTimeline } from '@/features/quotes/ui/QuoteTimeline';
import { useConvertQuote, useQuoteQuery } from '@/features/quotes/use-quotes';
import { getErrorMessage, isMissingRecordError } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

const HERO_TONES: Record<QuoteStatus, DocumentHeroTone> = {
  draft: 'open',
  sent: 'open',
  viewed: 'open',
  accepted: 'settled',
  rejected: 'ended',
  expired: 'ended',
};

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading quote" className={DETAIL_GRID}>
      <div className="space-y-5">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-[32rem] rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

export default function QuoteDetailPage() {
  const { quoteId = '' } = useParams<'quoteId'>();
  const query = useQuoteQuery(quoteId);

  if (query.data) return <QuoteView key={query.data.id} quote={query.data} />;
  return (
    <>
      <DocumentTitle title="Quote" />
      <PageHeader title="Quote" back={{ to: paths.quotes, label: 'Quotes' }} />
      {query.isPending ? (
        <DetailSkeleton />
      ) : isMissingRecordError(query.error) ? (
        <QuoteNotFound />
      ) : (
        <QueryError
          title="We couldn’t load this quote"
          error={query.error}
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      )}
    </>
  );
}

function QuoteView({ quote }: { quote: QuoteDto }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: business } = useBusinessQuery();
  const convert = useConvertQuote();
  const [flash] = useState(() => readQuoteFlash(location.state));
  // The stamp thumps down only when the answer arrives while the page is open.
  const [statusOnArrival] = useState(quote.status);

  // The flash is for this visit only: drop it from history so a reload doesn't show it again.
  useEffect(() => {
    if (flash) void navigate(location.pathname, { replace: true, state: null });
  }, [flash, location.pathname, navigate]);
  const title = `Quote ${quote.quoteNumber}`;
  const stamp = quoteStamp(quote, business.timezone);
  // Phones show the ticket straight after sharing, before the side cards; desktop keeps sharing
  // at the top of the side column.
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const share = <QuoteSharePanel quote={quote} businessName={business.name} />;

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        description={`For ${quote.customer.name} · Issued ${formatCalendarDate(quote.issueDate)}`}
        back={{ to: paths.quotes, label: 'Quotes' }}
        badge={<QuoteStatusBadge status={quote.status} />}
        actions={
          <>
            {canEditQuote(quote.status) && (
              <ButtonLink to={paths.editQuote(quote.id)} variant="secondary">
                <Pencil aria-hidden="true" />
                Edit quote
              </ButtonLink>
            )}
            {canConvertQuote(quote.status, quote.invoiceId) && (
              <Button
                loading={convert.isPending}
                onClick={() =>
                  convert.mutate(quote.id, {
                    onSuccess: (invoice) => void navigate(paths.invoice(invoice.id)),
                  })
                }
              >
                <Receipt aria-hidden="true" />
                Convert to invoice
              </Button>
            )}
            {quote.invoiceId && (
              <ButtonLink to={paths.invoice(quote.invoiceId)}>
                <Receipt aria-hidden="true" />
                View invoice
              </ButtonLink>
            )}
          </>
        }
      />
      {flash && <QuoteFlashBanner flash={flash} quote={quote} />}
      {convert.isError && (
        <Alert tone="danger" title="The quote wasn’t converted" className="mb-5">
          {getErrorMessage(convert.error)}
        </Alert>
      )}

      <div className={DETAIL_GRID}>
        <DocumentHero
          label="Quote total"
          amount={formatMoney(quote.totals.total, quote.currency)}
          detail={quoteOutlook(quote, todayInTimeZone(business.timezone), business.timezone)}
          tone={HERO_TONES[quote.status]}
          className="lg:col-start-1 lg:row-start-1"
        >
          <QuoteProgress quote={quote} />
        </DocumentHero>
        {!desktop && share}
        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
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
            // A stamp says it once the quote is settled; until then the tag does.
            status={stamp ? undefined : <QuoteStatusBadge status={quote.status} />}
            stamp={stamp && { ...stamp, animate: quote.status !== statusOnArrival }}
          />
        </div>
        <aside aria-label="Quote actions" className={DETAIL_ASIDE}>
          {desktop && share}
          <DocumentCustomerCard customerId={quote.customerId} customer={quote.customer} />
          <QuoteActionsPanel quote={quote} />
          <PanelCard title="Activity">
            <QuoteTimeline quote={quote} timeZone={business.timezone} />
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
