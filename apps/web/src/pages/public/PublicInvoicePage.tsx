import type { PublicInvoiceDto } from '@quoteflow/shared';
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
import { StatusBanner } from '@/features/public-documents/StatusBanner';
import { publicPdfUrl } from '@/features/public-documents/public-api';
import {
  CUSTOMER_INVOICE_STATUS,
  invoiceStatusBanner,
} from '@/features/public-documents/public-status';
import { usePublicInvoice } from '@/features/public-documents/use-public-documents';
import { isApiError } from '@/lib/api-client';
import { formatCalendarDate, formatMoney } from '@/lib/format';

/** The figure a customer opening an unpaid invoice is looking for, at a glance. */
function AmountDue({ data, documentLabel }: { data: PublicInvoiceDto; documentLabel: string }) {
  const { invoice, business } = data;
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  return (
    <section
      aria-label="Amount due"
      className="animate-fade-in rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-900/5 sm:flex sm:items-end sm:justify-between sm:gap-6 sm:p-6 print:hidden"
    >
      <div>
        <p className="text-sm font-medium text-zinc-500">Amount due</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-(--doc-accent-text) tabular-nums">
          {money(invoice.balanceDue)}
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Due {formatCalendarDate(invoice.dueDate)}
          {invoice.amountPaid > 0 && ` · ${money(invoice.amountPaid)} already paid`}
        </p>
      </div>
      <div className="mt-5 sm:mt-0">
        <p className="mb-2 text-xs font-medium text-zinc-500 sm:text-right">
          Questions about this invoice?
        </p>
        <ContactLinks
          business={business}
          documentLabel={documentLabel}
          className="sm:justify-end"
        />
      </div>
    </section>
  );
}

function PublicInvoiceView({ token, data }: { token: string; data: PublicInvoiceDto }) {
  const { business, invoice } = data;
  const banner = invoiceStatusBanner(data);
  const documentLabel = `Invoice ${invoice.invoiceNumber}`;
  const status = CUSTOMER_INVOICE_STATUS[invoice.status];
  const awaitingPayment = invoice.status === 'sent' || invoice.status === 'partially_paid';

  return (
    <div style={brandColorVars(business.brandColor)} className="space-y-5">
      <title>{`${documentLabel} from ${business.name}`}</title>
      {/* The token in the URL is the capability: never send it to other sites. */}
      <meta name="referrer" content="no-referrer" />

      <PublicDocumentHeader
        eyebrow="Invoice from"
        businessName={business.name}
        pdfUrl={publicPdfUrl('invoice', token)}
        pdfFileName={`${invoice.invoiceNumber}.pdf`}
      />

      {banner && (
        <StatusBanner banner={banner}>
          {banner.showContact && <ContactLinks business={business} documentLabel={documentLabel} />}
        </StatusBanner>
      )}
      {awaitingPayment && <AmountDue data={data} documentLabel={documentLabel} />}

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
