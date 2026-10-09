import { type InvoiceDto, toWhatsAppPhone } from '@quoteflow/shared';
import {
  Ban,
  Banknote,
  Check,
  Download,
  Link2,
  MessageCircle,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PanelCard } from '@/components/ui/PanelCard';
import { getErrorMessage } from '@/lib/api-client';
import { downloadFile } from '@/lib/download';
import { getInvoiceActions } from './invoice-view';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { useCancelInvoice, useDeleteInvoice, useSendInvoice } from './use-invoices';
import { useInvoiceSharing } from './use-invoice-sharing';

export interface InvoiceActionsCardProps {
  invoice: InvoiceDto;
  businessName: string;
  /** Today in the business time zone, 'YYYY-MM-DD'. */
  today: string;
}

type Confirmation = 'delete' | 'cancel' | null;

const ACTION = 'w-full justify-start';

/** Every action the lifecycle rules allow for this invoice, primary action first. */
export function InvoiceActionsCard({ invoice, businessName, today }: InvoiceActionsCardProps) {
  const navigate = useNavigate();
  const actions = getInvoiceActions(invoice);
  const sharing = useInvoiceSharing(invoice, businessName);
  const send = useSendInvoice(invoice.id);
  const cancel = useCancelInvoice(invoice.id);
  const remove = useDeleteInvoice(invoice.id);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<unknown>(null);

  const actionError = send.error ?? sharing.sendError ?? downloadError;

  async function downloadPdf() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadFile(
        `/invoices/${encodeURIComponent(invoice.id)}/pdf`,
        `${invoice.invoiceNumber}.pdf`,
      );
    } catch (error) {
      setDownloadError(error);
    } finally {
      setDownloading(false);
    }
  }

  function closeConfirmation() {
    setConfirmation(null);
    cancel.reset();
    remove.reset();
  }

  const hasPhone = toWhatsAppPhone(invoice.customer.phone) !== null;

  return (
    <PanelCard title="Actions">
      <div className="space-y-2">
        {actions.recordPayment && (
          <Button className={ACTION} onClick={() => setPaymentOpen(true)}>
            <Banknote aria-hidden="true" />
            Record payment
          </Button>
        )}
        {actions.markAsSent && (
          <Button
            className={ACTION}
            variant={actions.recordPayment ? 'secondary' : 'primary'}
            loading={send.isPending}
            onClick={() => send.mutate()}
          >
            <Send aria-hidden="true" />
            Mark as sent
          </Button>
        )}
        {actions.edit && (
          <ButtonLink to={paths.editInvoice(invoice.id)} variant="secondary" className={ACTION}>
            <Pencil aria-hidden="true" />
            Edit draft
          </ButtonLink>
        )}

        {actions.share && (
          <div className="space-y-2 border-t border-zinc-200 pt-3">
            <Button
              variant="secondary"
              className={ACTION}
              loading={sharing.sending}
              onClick={() => void sharing.shareOnWhatsApp()}
            >
              <MessageCircle aria-hidden="true" />
              Share via WhatsApp
            </Button>
            <Button variant="secondary" className={ACTION} onClick={() => void sharing.copyLink()}>
              {sharing.copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              {sharing.copied ? 'Link copied' : 'Copy link'}
            </Button>
            {actions.markAsSent && (
              <p className="text-xs text-pretty text-zinc-500">Sharing marks this draft as sent.</p>
            )}
            {!hasPhone && (
              <p className="text-xs text-pretty text-zinc-500">
                Add the customer’s phone number with its country code to open their WhatsApp chat
                directly.
              </p>
            )}
          </div>
        )}

        <Button
          variant="secondary"
          className={ACTION}
          loading={downloading}
          onClick={() => void downloadPdf()}
        >
          <Download aria-hidden="true" />
          Download PDF
        </Button>

        <p role="status" className="sr-only">
          {sharing.copied ? 'Link copied to the clipboard' : ''}
        </p>
        {sharing.copyError && (
          <Alert tone="warning">
            Copying isn’t available here. Select and copy the link instead:
            <span className="mt-1 block font-mono text-xs break-all select-all">{sharing.url}</span>
          </Alert>
        )}
        {actionError !== null && actionError !== undefined && (
          <Alert tone="danger">{getErrorMessage(actionError)}</Alert>
        )}

        {(actions.delete || actions.cancel) && (
          <div className="flex flex-col gap-1 border-t border-zinc-200 pt-2">
            {actions.delete && (
              <Button
                variant="danger-ghost"
                className={ACTION}
                onClick={() => setConfirmation('delete')}
              >
                <Trash2 aria-hidden="true" />
                Delete draft
              </Button>
            )}
            {actions.cancel && (
              <Button
                variant="danger-ghost"
                className={ACTION}
                onClick={() => setConfirmation('cancel')}
              >
                <Ban aria-hidden="true" />
                Cancel invoice
              </Button>
            )}
          </div>
        )}
      </div>

      <RecordPaymentDialog
        open={paymentOpen}
        invoice={invoice}
        today={today}
        onClose={() => setPaymentOpen(false)}
        onRecorded={() => setPaymentOpen(false)}
      />
      <ConfirmDialog
        open={confirmation === 'delete'}
        title={`Delete ${invoice.invoiceNumber}?`}
        description="This draft will be removed permanently. Its number will not be reused."
        confirmLabel="Delete draft"
        pending={remove.isPending}
        error={remove.error ? getErrorMessage(remove.error) : null}
        onCancel={closeConfirmation}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => void navigate(paths.invoices, { replace: true }),
          })
        }
      />
      <ConfirmDialog
        open={confirmation === 'cancel'}
        title={`Cancel ${invoice.invoiceNumber}?`}
        description="The customer will no longer owe this amount, and the invoice can’t be reopened. It stays in your records as cancelled."
        confirmLabel="Cancel invoice"
        pending={cancel.isPending}
        error={cancel.error ? getErrorMessage(cancel.error) : null}
        onCancel={closeConfirmation}
        onConfirm={() => cancel.mutate(undefined, { onSuccess: closeConfirmation })}
      />
    </PanelCard>
  );
}
