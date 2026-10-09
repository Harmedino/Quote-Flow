import { type QuoteDto, canDeleteQuote } from '@quoteflow/shared';
import { Copy, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/paths';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PanelCard } from '@/components/ui/PanelCard';
import { QUICK_ACTION } from '@/features/documents/quick-action';
import { getErrorMessage } from '@/lib/api-client';
import { downloadFile } from '@/lib/download';
import { useDeleteQuote, useDuplicateQuote } from '../use-quotes';

/** The quieter things you can do with a quote; only actions the shared rules allow are shown. */
export function QuoteActionsPanel({ quote }: { quote: QuoteDto }) {
  const navigate = useNavigate();
  const duplicateQuote = useDuplicateQuote();
  const deleteQuote = useDeleteQuote();
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

  return (
    <PanelCard title="Actions">
      <div className="-mx-2.5 -my-1 space-y-0.5">
        <Button
          variant="ghost"
          className={QUICK_ACTION}
          loading={downloading}
          onClick={() => void download()}
        >
          <Download aria-hidden="true" />
          Download PDF
        </Button>
        <Button
          variant="ghost"
          className={QUICK_ACTION}
          loading={duplicateQuote.isPending}
          onClick={() => void duplicate()}
        >
          <Copy aria-hidden="true" />
          Duplicate as a new draft
        </Button>
        {canDeleteQuote(quote.status) && (
          <Button
            variant="danger-ghost"
            className={QUICK_ACTION}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete draft
          </Button>
        )}
      </div>
      {error && !confirmingDelete && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}
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
    </PanelCard>
  );
}
