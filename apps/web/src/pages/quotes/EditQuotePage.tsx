import { canEditQuote, QUOTE_STATUS_LABELS } from '@quoteflow/shared';
import { useLocation, useParams } from 'react-router';
import { paths } from '@/app/paths';
import { DocumentTitle } from '@/components/DocumentTitle';
import { Alert } from '@/components/ui/Alert';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { PageHeader } from '@/components/ui/PageHeader';
import { useBusinessQuery } from '@/features/business/use-business';
import { QuoteEditor } from '@/features/quotes/editor/QuoteEditor';
import { readQuoteFlash } from '@/features/quotes/quote-flash';
import { quoteFormValuesFromQuote } from '@/features/quotes/quote-form';
import { EditorSkeleton } from '@/features/quotes/ui/EditorSkeleton';
import { LoadError } from '@/features/quotes/ui/LoadError';
import { useQuoteQuery } from '@/features/quotes/use-quotes';

export default function EditQuotePage() {
  const { quoteId = '' } = useParams<'quoteId'>();
  const location = useLocation();
  const { data: business } = useBusinessQuery();
  const query = useQuoteQuery(quoteId);
  const quote = query.data;
  const duplicated = readQuoteFlash(location.state) === 'duplicated';

  return (
    <>
      <DocumentTitle title={quote ? `Edit ${quote.quoteNumber}` : 'Edit quote'} />
      <PageHeader
        title={quote ? `Edit ${quote.quoteNumber}` : 'Edit quote'}
        description={
          quote?.status === 'draft' || !quote
            ? 'Update the items, pricing and terms before you send.'
            : 'Your customer will see the changes the next time they open the quote link.'
        }
        back={{ to: paths.quote(quoteId), label: 'Back to quote' }}
      />
      {query.isPending ? (
        <EditorSkeleton />
      ) : query.isError || !quote ? (
        <LoadError
          title="We couldn’t load this quote"
          error={query.error}
          retrying={query.isFetching}
          onRetry={() => void query.refetch()}
        />
      ) : !canEditQuote(quote.status) ? (
        <Alert
          tone="info"
          title={`This quote is ${QUOTE_STATUS_LABELS[quote.status].toLowerCase()}`}
        >
          <p>
            Accepted and rejected quotes can no longer be edited. Duplicate it to make a new
            version.
          </p>
          <ButtonLink to={paths.quote(quote.id)} variant="secondary" size="sm" className="mt-3">
            Back to quote
          </ButtonLink>
        </Alert>
      ) : (
        <>
          {duplicated && (
            <Alert tone="success" className="mb-6">
              Copy created as draft {quote.quoteNumber}. Review it, then save or send.
            </Alert>
          )}
          <QuoteEditor
            key={quote.id}
            business={business}
            quote={quote}
            initialValues={quoteFormValuesFromQuote(quote)}
            initialCustomer={{ id: quote.customerId, ...quote.customer }}
          />
        </>
      )}
    </>
  );
}
