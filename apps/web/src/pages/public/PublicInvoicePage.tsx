import type { PublicInvoiceDto } from '@quoteflow/shared';
import { useParams } from 'react-router';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { Badge } from '@/components/ui/Badge';
import { BrandedPage } from '@/features/public-documents/BrandedPage';
import { AmountDueCard, InvoiceSummaryFigure } from '@/features/public-documents/InvoiceAmount';
import { PublicDocumentHeader } from '@/features/public-documents/PublicDocumentHeader';
import {
  PublicDocumentError,
  PublicDocumentSkeleton,
  PublicLinkUnavailable,
} from '@/features/public-documents/PublicDocumentStates';
import { StatusBanner } from '@/features/public-documents/StatusBanner';
import { SummaryAside } from '@/features/public-documents/SummaryAside';
import { publicPdfUrl } from '@/features/public-documents/public-api';
import {
  CUSTOMER_INVOICE_STATUS,
  invoiceStatusBanner,
  isAwaitingPayment,
} from '@/features/public-documents/public-status';
import { usePublicInvoice } from '@/features/public-documents/use-public-documents';
import { isApiError } from '@/lib/api-client';
import { formatCalendarDate } from '@/lib/format';

function PublicInvoiceView({ token, data }: { token: string; data: PublicInvoiceDto }) {
  const { business, invoice } = data;
  const banner = invoiceStatusBanner(data);
  const documentLabel = `Invoice ${invoice.invoiceNumber}`;
  const status = CUSTOMER_INVOICE_STATUS[invoice.status];
  const pdfUrl = publicPdfUrl('invoice', token);
  const pdfFileName = `${invoice.invoiceNumber}.pdf`;

  return (
    <BrandedPage brandColor={business.brandColor}>
      <title>{`${documentLabel} from ${business.name}`}</title>
      {/* The token in the URL is the capability: never send it to other sites. */}
      <meta name="referrer" content="no-referrer" />

      <PublicDocumentHeader
        business={business}
        eyebrow="Invoice from"
        summary={`${documentLabel} · Due ${formatCalendarDate(invoice.dueDate)}`}
        documentLabel={documentLabel}
        pdfUrl={pdfUrl}
        pdfFileName={pdfFileName}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
          {banner && <StatusBanner banner={banner} />}
          {isAwaitingPayment(invoice) && <AmountDueCard invoice={invoice} />}

          <SalesDocument
            kind="invoice"
            number={invoice.invoiceNumber}
            business={business}
            customer={invoice.customer}
            currency={invoice.currency}
            issueDate={invoice.issueDate}
            secondaryDate={{ label: 'Due date', value: invoice.dueDate }}
            items={invoice.items}
            discount={invoice.discount}
            taxRate={invoice.taxRate}
            totals={invoice.totals}
            amountPaid={invoice.amountPaid}
            balanceDue={invoice.balanceDue}
            notes={invoice.notes}
            terms={invoice.terms}
            status={<Badge tone={status.tone}>{status.label}</Badge>}
          />
        </div>

        <SummaryAside label="Invoice summary" pdfUrl={pdfUrl} pdfFileName={pdfFileName}>
          <InvoiceSummaryFigure invoice={invoice} />
        </SummaryAside>
      </div>
    </BrandedPage>
  );
}

export default function PublicInvoicePage() {
  const { token = '' } = useParams();
  const query = usePublicInvoice(token);

  // A failed background refetch keeps showing the invoice it already has.
  if (query.data) return <PublicInvoiceView token={token} data={query.data} />;
  if (!query.isError) return <PublicDocumentSkeleton />;
  return isApiError(query.error) && query.error.status === 404 ? (
    <PublicLinkUnavailable kind="invoice" />
  ) : (
    <PublicDocumentError
      error={query.error}
      onRetry={() => void query.refetch()}
      retrying={query.isFetching}
    />
  );
}
