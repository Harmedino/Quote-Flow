import { type PublicQuoteDto, canRespondToQuote } from '@quoteflow/shared';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { brandColorVars } from '@/components/documents/brand-color';
import { Badge } from '@/components/ui/Badge';
import { ContactLinks } from '@/features/public-documents/ContactLinks';
import { PublicDocumentHeader } from '@/features/public-documents/PublicDocumentHeader';
import {
  PublicDocumentError,
  PublicDocumentSkeleton,
  PublicLinkUnavailable,
} from '@/features/public-documents/PublicDocumentStates';
import { QuoteActionBar } from '@/features/public-documents/QuoteActionBar';
import {
  type QuoteDialog,
  QuoteAnswerDialogs,
} from '@/features/public-documents/QuoteAnswerDialogs';
import { StatusBanner } from '@/features/public-documents/StatusBanner';
import { publicPdfUrl } from '@/features/public-documents/public-api';
import {
  CUSTOMER_QUOTE_STATUS,
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

function PublicQuoteView({ token, data }: { token: string; data: PublicQuoteDto }) {
  const { business, quote } = data;
  const answer = useAnswerQuote(token);
  const [dialog, setDialog] = useState<QuoteDialog>(null);
  const [reason, setReason] = useState('');
  const [justAnswered, setJustAnswered] = useState(false);
  const bannerRef = useRef<HTMLElement>(null);

  const live = canRespondToQuote(quote.status);
  const banner = quoteStatusBanner(data, justAnswered);
  const total = formatMoney(quote.totals.total, quote.currency);
  const documentLabel = `Quote ${quote.quoteNumber}`;
  const status = CUSTOMER_QUOTE_STATUS[quote.status];

  // After an answer, move to the outcome so it is seen and announced.
  useEffect(() => {
    if (!justAnswered) return;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    bannerRef.current?.focus({ preventScroll: true });
  }, [justAnswered]);

  function openDialog(next: Exclude<QuoteDialog, null>) {
    answer.reset();
    if (next === 'decline') setReason('');
    setDialog(next);
  }

  function submit(response: QuoteAnswer) {
    answer.mutate(response, {
      onSuccess: () => {
        setDialog(null);
        setJustAnswered(true);
      },
    });
  }

  return (
    <div style={brandColorVars(business.brandColor)} className="space-y-5">
      <title>{`${documentLabel} from ${business.name}`}</title>
      {/* The token in the URL is the capability: never send it to other sites. */}
      <meta name="referrer" content="no-referrer" />

      <PublicDocumentHeader
        eyebrow="Quote from"
        businessName={business.name}
        pdfUrl={publicPdfUrl('quote', token)}
        pdfFileName={`${quote.quoteNumber}.pdf`}
      />

      {banner && (
        <StatusBanner ref={bannerRef} banner={banner}>
          {quote.status === 'rejected' && quote.rejectionReason && (
            <p className="mb-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 ring-1 ring-zinc-900/5 ring-inset">
              <span className="font-medium">Your note:</span> {quote.rejectionReason}
            </p>
          )}
          {banner.showContact && <ContactLinks business={business} documentLabel={documentLabel} />}
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

      {live && (
        <>
          <QuoteActionBar
            total={total}
            validUntil={formatCalendarDate(quote.expiryDate)}
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
    </div>
  );
}

export default function PublicQuotePage() {
  const { token = '' } = useParams();
  const query = usePublicQuote(token);

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
