import { type PublicQuoteDto, canRespondToQuote } from '@quoteflow/shared';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { Badge } from '@/components/ui/Badge';
import { BrandedPage } from '@/features/public-documents/BrandedPage';
import { PublicDocumentHeader } from '@/features/public-documents/PublicDocumentHeader';
import {
  PublicDocumentError,
  PublicDocumentSkeleton,
  PublicLinkUnavailable,
} from '@/features/public-documents/PublicDocumentStates';
import { QuoteActionBar } from '@/features/public-documents/QuoteActionBar';
import { QuoteSummary } from '@/features/public-documents/QuoteSummary';
import {
  type QuoteDialog,
  QuoteAnswerDialogs,
} from '@/features/public-documents/QuoteAnswerDialogs';
import { StatusBanner } from '@/features/public-documents/StatusBanner';
import { PREVIEW_STATE, readPreviewFlag } from '@/features/public-documents/preview-flag';
import { publicPdfUrl } from '@/features/public-documents/public-api';
import {
  CUSTOMER_QUOTE_STATUS,
  QUOTE_REVISED_BANNER,
  quoteStatusBanner,
} from '@/features/public-documents/public-status';
import {
  type QuoteAnswer,
  useAnswerQuote,
  usePublicQuote,
} from '@/features/public-documents/use-public-documents';
import { getErrorMessage, isApiError } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Whether this tab is the business's own preview; see PREVIEW_STATE. */
function usePreviewFlag(): boolean {
  const location = useLocation();
  const navigate = useNavigate();
  const { preview, searchWithoutFlag } = readPreviewFlag(location);

  useEffect(() => {
    if (searchWithoutFlag === null) return;
    void navigate(
      { search: searchWithoutFlag, hash: location.hash },
      { replace: true, preventScrollReset: true, state: PREVIEW_STATE },
    );
  }, [searchWithoutFlag, location.hash, navigate]);

  return preview;
}

function PublicQuoteView({ token, data }: { token: string; data: PublicQuoteDto }) {
  const { business, quote } = data;
  const answer = useAnswerQuote(token);
  const [dialog, setDialog] = useState<QuoteDialog>(null);
  // The revision on screen when the dialog opened, which a refetch meanwhile must not change.
  const [dialogRevision, setDialogRevision] = useState(quote.revision);
  const [reason, setReason] = useState('');
  const [justAnswered, setJustAnswered] = useState(false);
  const [revised, setRevised] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);

  const live = canRespondToQuote(quote.status);
  const banner = quoteStatusBanner(data, justAnswered) ?? (revised ? QUOTE_REVISED_BANNER : null);
  const total = formatMoney(quote.totals.total, quote.currency);
  const documentLabel = `Quote ${quote.quoteNumber}`;
  const status = CUSTOMER_QUOTE_STATUS[quote.status];
  const validUntil = formatCalendarDate(quote.expiryDate);
  const pdfUrl = publicPdfUrl('quote', token);
  const pdfFileName = `${quote.quoteNumber}.pdf`;

  // After an answer, or a refused one, move to the banner so it is seen and announced.
  const announce = justAnswered || revised;
  useEffect(() => {
    if (!announce) return;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    bannerRef.current?.focus({ preventScroll: true });
  }, [announce]);

  function openDialog(next: Exclude<QuoteDialog, null>) {
    answer.reset();
    setDialogRevision(quote.revision);
    setRevised(false);
    // A reason typed before the quote was revised is kept for the second attempt.
    if (next === 'decline' && !revised) setReason('');
    setDialog(next);
  }

  function submit(response: QuoteAnswer) {
    answer.mutate(
      { answer: response, revision: dialogRevision },
      {
        onSuccess: () => {
          setDialog(null);
          setJustAnswered(true);
        },
        onError: (error) => {
          // The quote changed since the dialog opened and is being refetched: the customer
          // reviews the new version and opens the dialog again to answer it.
          if (isApiError(error) && error.code === 'CONFLICT') {
            setDialog(null);
            setRevised(true);
          }
        },
      },
    );
  }

  return (
    <BrandedPage brandColor={business.brandColor}>
      <title>{`${documentLabel} from ${business.name}`}</title>
      {/* The token in the URL is the capability: never send it to other sites. */}
      <meta name="referrer" content="no-referrer" />

      <PublicDocumentHeader
        business={business}
        eyebrow="Quote from"
        summary={`${documentLabel} · Valid until ${validUntil}`}
        documentLabel={documentLabel}
        pdfUrl={pdfUrl}
        pdfFileName={pdfFileName}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
          {banner && (
            <StatusBanner ref={bannerRef} banner={banner}>
              {quote.status === 'rejected' && quote.rejectionReason && (
                <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
                  <span className="font-medium text-stone-900">Your note:</span>{' '}
                  {quote.rejectionReason}
                </p>
              )}
            </StatusBanner>
          )}

          <SalesDocument
            kind="quote"
            number={quote.quoteNumber}
            business={business}
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
            status={<Badge tone={status.tone}>{status.label}</Badge>}
          />
        </div>

        <QuoteSummary
          total={total}
          validUntil={validUntil}
          live={live}
          pdfUrl={pdfUrl}
          pdfFileName={pdfFileName}
          onAccept={() => openDialog('accept')}
          onDecline={() => openDialog('decline')}
        />
      </div>

      {live && (
        <>
          <QuoteActionBar
            total={total}
            validUntil={validUntil}
            onAccept={() => openDialog('accept')}
            onDecline={() => openDialog('decline')}
          />
          <QuoteAnswerDialogs
            open={dialog}
            quoteNumber={quote.quoteNumber}
            total={total}
            businessName={business.name}
            reason={reason}
            onReasonChange={setReason}
            pending={answer.isPending}
            error={answer.isError ? getErrorMessage(answer.error) : null}
            onAccept={() => submit({ action: 'accept' })}
            onDecline={() => submit({ action: 'reject', reason: reason.trim() || undefined })}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </BrandedPage>
  );
}

export default function PublicQuotePage() {
  const { token = '' } = useParams();
  const preview = usePreviewFlag();
  const query = usePublicQuote(token, preview);

  // A failed background refetch keeps showing the quote it already has.
  if (query.data) return <PublicQuoteView token={token} data={query.data} />;
  if (!query.isError) return <PublicDocumentSkeleton />;
  return isApiError(query.error) && query.error.status === 404 ? (
    <PublicLinkUnavailable kind="quote" />
  ) : (
    <PublicDocumentError
      error={query.error}
      onRetry={() => void query.refetch()}
      retrying={query.isFetching}
    />
  );
}
