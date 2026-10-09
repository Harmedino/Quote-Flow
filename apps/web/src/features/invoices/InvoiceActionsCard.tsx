import type { InvoiceDto } from '@quoteflow/shared';
import { Ban, Download, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PanelCard } from '@/components/ui/PanelCard';
import { QUICK_ACTION } from '@/features/documents/quick-action';
import { getErrorMessage } from '@/lib/api-client';
import { downloadFile } from '@/lib/download';
import { getInvoiceActions } from './invoice-view';
import { useCancelInvoice, useDeleteInvoice } from './use-invoices';

type Confirmation = 'delete' | 'cancel' | null;

/** The quieter things you can do with an invoice; only what the lifecycle rules allow is shown. */
export function InvoiceActionsCard({ invoice }: { invoice: InvoiceDto }) {
  const navigate = useNavigate();
  const actions = getInvoiceActions(invoice);
  const cancel = useCancelInvoice(invoice.id);
  const remove = useDeleteInvoice(invoice.id);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<unknown>(null);

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

  return (
    <PanelCard title="Actions">
      <div className="-mx-2.5 -my-1 space-y-0.5">
        <Button
          variant="ghost"
          className={QUICK_ACTION}
          loading={downloading}
          onClick={() => void downloadPdf()}
        >
          <Download aria-hidden="true" />
          Download PDF
        </Button>
        {invoice.quoteId && (
          <ButtonLink to={paths.quote(invoice.quoteId)} variant="ghost" className={QUICK_ACTION}>
            <FileText aria-hidden="true" />
            View the original quote
          </ButtonLink>
        )}
        {actions.delete && (
          <Button
            variant="danger-ghost"
            className={QUICK_ACTION}
            onClick={() => setConfirmation('delete')}
          >
            <Trash2 aria-hidden="true" />
            Delete draft
          </Button>
        )}
        {actions.cancel && (
          <Button
            variant="danger-ghost"
            className={QUICK_ACTION}
            onClick={() => setConfirmation('cancel')}
          >
            <Ban aria-hidden="true" />
            Cancel invoice
          </Button>
        )}
      </div>
      {downloadError !== null && (
        <Alert tone="danger" className="mt-3">
          {getErrorMessage(downloadError)}
        </Alert>
      )}

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
