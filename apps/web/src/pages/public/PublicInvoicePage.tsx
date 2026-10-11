import { type PublicInvoiceDto, todayInTimeZone } from '@quoteflow/shared';
import { useParams } from 'react-router';
import { SalesDocument } from '@/components/documents/SalesDocument';
import { HangTag } from '@/components/ui/HangTag';
import { BrandedPage } from '@/features/public-documents/BrandedPage';
import { DocumentColumns } from '@/features/public-documents/DocumentBand';
import { DownloadPdfLink } from '@/features/public-documents/DownloadPdfLink';
import { AmountDueCard, InvoiceSummaryPart } from '@/features/public-documents/InvoiceAmount';
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
  dueNote,
  invoiceStamp,
  invoiceStatusBanner,
  isAwaitingPayment,
} from '@/features/public-documents/public-status';
import { usePublicInvoice } from '@/features/public-documents/use-public-documents';
import { isApiError } from '@/lib/api-client';
import { formatCalendarDate } from '@/lib/format';
import { detectTimeZone } from '@/lib/locale';

function PublicInvoiceView({ token, data }: { token: string; data: PublicInvoiceDto }) {
  const { business, invoice } = data;
  const banner = invoiceStatusBanner(data);
  const documentLabel = `Invoice ${invoice.invoiceNumber}`;
  const status = CUSTOMER_INVOICE_STATUS[invoice.status];
  // Days to the due date are counted where the customer is.
  const today = todayInTimeZone(detectTimeZone() ?? 'UTC');
  const stamp = invoiceStamp(invoice, today);
  const pdfUrl = publicPdfUrl('invoice', token);
  const pdfFileName = `${invoice.invoiceNumber}.pdf`;
  const amountProps = { invoice, businessName: business.name, today };

  return (
    <BrandedPage brandColor={business.brandColor}>
      <title>{`${documentLabel} from ${business.name}`}</title>
      {/* The token in the URL is the capability: never send it to other sites. */}
      <meta name="referrer" content="no-referrer" />

      <PublicDocumentHeader
        business={business}
        eyebrow={`Invoice for ${invoice.customer.name}`}
        date={formatCalendarDate(invoice.issueDate)}
        documentLabel={documentLabel}
      />

      <DocumentColumns
        aside={
          <SummaryAside label="Invoice summary" pdfUrl={pdfUrl} pdfFileName={pdfFileName}>
            <InvoiceSummaryPart {...amountProps} />
          </SummaryAside>
        }
      >
        {banner && <StatusBanner banner={banner} />}
        {isAwaitingPayment(invoice) && <AmountDueCard {...amountProps} />}

        <SalesDocument
          kind="invoice"
          number={invoice.invoiceNumber}
          business={business}
          customer={invoice.customer}
          currency={invoice.currency}
          issueDate={invoice.issueDate}
          secondaryDate={{
            label: 'Due date',
            value: invoice.dueDate,
            note: dueNote(invoice, today),
          }}
          items={invoice.items}
          discount={invoice.discount}
          taxRate={invoice.taxRate}
          totals={invoice.totals}
          amountPaid={invoice.amountPaid}
          balanceDue={invoice.balanceDue}
          notes={invoice.notes}
          terms={invoice.terms}
          // Paid, overdue and cancelled invoices are stamped; the others carry a tag.
          status={stamp ? undefined : <HangTag tone={status.tone}>{status.label}</HangTag>}
          stamp={stamp}
          // The band above says who sent it; a printout, without the band, still does.
          sender="print-only"
        />

        <DownloadPdfLink href={pdfUrl} fileName={pdfFileName} className="w-full lg:hidden" />
      </DocumentColumns>
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
