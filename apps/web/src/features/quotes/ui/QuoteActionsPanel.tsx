import { type QuoteDto, canConvertQuote, canDeleteQuote, canEditQuote } from '@quoteflow/shared';
import { Copy, Download, Pencil, Receipt, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getErrorMessage } from '@/lib/api-client';
import { downloadFile } from '@/lib/download';
import { useConvertQuote, useDeleteQuote, useDuplicateQuote, useSendQuote } from '../use-quotes';

const ACTION = 'w-full justify-start';

/** Everything else you can do with a quote; only actions the shared rules allow are shown. */
export function QuoteActionsPanel({ quote }: { quote: QuoteDto }) {
  const navigate = useNavigate();
  const sendQuote = useSendQuote();
  const duplicateQuote = useDuplicateQuote();
  const deleteQuote = useDeleteQuote();
  const convertQuote = useConvertQuote();
  const [downloading, setDownloading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError(getErrorMessage(actionError));
    }
  }

  const download = () =>
    run(async () => {
      setDownloading(true);
      try {
        await downloadFile(
          `/quotes/${encodeURIComponent(quote.id)}/pdf`,
          `${quote.quoteNumber}.pdf`,
        );
      } finally {
        setDownloading(false);
      }
    });

  const duplicate = () =>
    run(async () => {
      const copy = await duplicateQuote.mutateAsync(quote.id);
      void navigate(paths.editQuote(copy.id), { state: { flash: 'duplicated' } });
    });

  const convert = () =>
    run(async () => {
      const invoice = await convertQuote.mutateAsync(quote.id);
      void navigate(paths.invoice(invoice.id));
    });

  return (
    <div className="space-y-2">
      {canConvertQuote(quote.status, quote.invoiceId) && (
        <Button className={ACTION} loading={convertQuote.isPending} onClick={() => void convert()}>
          <Receipt aria-hidden="true" />
          Convert to invoice
        </Button>
      )}
      {quote.invoiceId && (
        <ButtonLink to={paths.invoice(quote.invoiceId)} className={ACTION}>
          <Receipt aria-hidden="true" />
          View invoice
        </ButtonLink>
      )}
      {canEditQuote(quote.status) && (
        <ButtonLink to={paths.editQuote(quote.id)} variant="secondary" className={ACTION}>
          <Pencil aria-hidden="true" />
          Edit quote
        </ButtonLink>
      )}
      {quote.status === 'draft' && (
        <Button
          variant="secondary"
          className={ACTION}
          loading={sendQuote.isPending}
          onClick={() => void run(() => sendQuote.mutateAsync(quote.id).then(() => undefined))}
        >
          <Send aria-hidden="true" />
          Mark as sent
        </Button>
      )}
      <Button
        variant="secondary"
        className={ACTION}
        loading={downloading}
        onClick={() => void download()}
      >
        <Download aria-hidden="true" />
        Download PDF
      </Button>
      <Button
        variant="secondary"
        className={ACTION}
        loading={duplicateQuote.isPending}
        onClick={() => void duplicate()}
      >
        <Copy aria-hidden="true" />
        Duplicate
      </Button>
      {canDeleteQuote(quote.status) && (
        <Button
          variant="ghost"
          className={`${ACTION} text-red-700 hover:bg-red-50 hover:text-red-800`}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 aria-hidden="true" />
          Delete draft
        </Button>
      )}
      {error && !confirmingDelete && <Alert tone="danger">{error}</Alert>}
      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${quote.quoteNumber}?`}
        description="This draft will be permanently deleted. This can’t be undone."
        confirmLabel="Delete draft"
        pending={deleteQuote.isPending}
        error={confirmingDelete ? error : null}
        onCancel={() => {
          setConfirmingDelete(false);
          setError(null);
        }}
        onConfirm={() =>
          void run(async () => {
            await deleteQuote.mutateAsync(quote.id);
            void navigate(paths.quotes, { replace: true });
          })
        }
      />
    </div>
  );
}
