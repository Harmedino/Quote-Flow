import { type InvoiceDto, canRecordPayment, toWhatsAppPhone } from '@quoteflow/shared';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { SharePanel } from '@/features/documents/SharePanel';
import { getErrorMessage } from '@/lib/api-client';
import { useInvoiceSharing } from './use-invoice-sharing';

export interface InvoiceSharePanelProps {
  invoice: InvoiceDto;
  businessName: string;
}

/** Share the invoice by WhatsApp or link; sharing a draft marks it as sent first. */
export function InvoiceSharePanel({ invoice, businessName }: InvoiceSharePanelProps) {
  const sharing = useInvoiceSharing(invoice, businessName);
  const isDraft = invoice.status === 'draft';
  const name = invoice.customer.name;

  return (
    <SharePanel
      title="Share with customer"
      description={
        isDraft
          ? `${name} can’t see this draft yet. Sharing it marks it as sent.`
          : `${name} opens the link to see what’s owed and download the PDF. No account needed.`
      }
      url={sharing.url}
      sending={sharing.sending}
      copied={sharing.copied}
      onShareWhatsApp={() => void sharing.shareOnWhatsApp()}
      onCopyLink={() => void sharing.copyLink()}
      previewHref={isDraft ? undefined : paths.publicInvoice(invoice.publicToken)}
      // With a balance to collect, the header's "Record payment" is the main action.
      emphasis={canRecordPayment(invoice.status, invoice.balanceDue) ? 'secondary' : 'primary'}
    >
      {toWhatsAppPhone(invoice.customer.phone) === null && (
        <p className="text-xs text-pretty text-stone-500">
          Add the customer’s phone number with its country code to open their WhatsApp chat
          directly.
        </p>
      )}
      {isDraft && (
        <p className="text-xs text-stone-500">
          Sent it another way?{' '}
          <button
            type="button"
            onClick={sharing.markAsSent}
            disabled={sharing.sending}
            className="rounded-sm font-medium text-brand-700 hover:text-brand-800 hover:underline disabled:opacity-50"
          >
            Mark as sent
          </button>
        </p>
      )}
      <p role="status" className="sr-only">
        {sharing.copied ? 'Link copied to the clipboard' : ''}
      </p>
      {sharing.copyError && (
        <Alert tone="warning">
          Copying isn’t available here. Select and copy the link above instead.
        </Alert>
      )}
      {sharing.sendError && <Alert tone="danger">{getErrorMessage(sharing.sendError)}</Alert>}
    </SharePanel>
  );
}
