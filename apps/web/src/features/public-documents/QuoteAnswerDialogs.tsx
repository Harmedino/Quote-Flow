import { TEXT_LIMITS } from '@quoteflow/shared';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { ResponseDialog } from './ResponseDialog';

export type QuoteDialog = 'accept' | 'decline' | null;

export interface QuoteAnswerDialogsProps {
  open: QuoteDialog;
  quoteNumber: string;
  total: string;
  businessName: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  pending: boolean;
  error: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export function QuoteAnswerDialogs({
  open,
  quoteNumber,
  total,
  businessName,
  reason,
  onReasonChange,
  pending,
  error,
  onAccept,
  onDecline,
  onClose,
}: QuoteAnswerDialogsProps) {
  return (
    <>
      <ResponseDialog
        open={open === 'accept'}
        title="Accept this quote?"
        description={`By accepting, you’re letting ${businessName} know you’d like to go ahead. They’ll be in touch to arrange the next steps.`}
        confirmLabel="Accept quote"
        confirmFill="brand"
        pending={pending}
        error={open === 'accept' ? error : null}
        onConfirm={onAccept}
        onCancel={onClose}
      >
        {/* A stub of the quote being accepted, in the business's colour. */}
        <dl className="flex items-center justify-between gap-4 rounded-[10px] bg-(--doc-accent-soft) px-4 py-3.5">
          <div className="min-w-0">
            <dt className="label-mono text-muted">Quote</dt>
            <dd className="mt-1 truncate font-mono text-[13px] font-medium text-ink-2">
              {quoteNumber}
            </dd>
          </div>
          <div className="text-right">
            <dt className="label-mono text-muted">Total</dt>
            <dd className="mt-1 text-xl leading-none font-[820] tabular-nums font-stretch-115%">
              <span className="shadow-[inset_0_-4px_0_color-mix(in_srgb,var(--doc-accent)_30%,transparent)]">
                {total}
              </span>
            </dd>
          </div>
        </dl>
      </ResponseDialog>

      <ResponseDialog
        open={open === 'decline'}
        title="Decline this quote?"
        description={`Let ${businessName} know you won’t be going ahead with quote ${quoteNumber}.`}
        confirmLabel="Decline quote"
        confirmFill="neutral"
        pending={pending}
        error={open === 'decline' ? error : null}
        onConfirm={onDecline}
        onCancel={onClose}
      >
        <Field
          label="Reason (optional)"
          hint={`${reason.length}/${TEXT_LIMITS.rejectionReason} characters`}
        >
          <Textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            maxLength={TEXT_LIMITS.rejectionReason}
            rows={3}
            placeholder="E.g. the timing doesn’t work for us"
          />
        </Field>
      </ResponseDialog>
    </>
  );
}
