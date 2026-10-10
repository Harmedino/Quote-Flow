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
        {/* Tinted from the surface, not white, so the summary also reads in dark mode. */}
        <dl className="flex items-center justify-between gap-4 rounded-r-xl border-l-[3px] border-(--doc-fill) bg-[color-mix(in_srgb,var(--doc-fill)_8%,var(--color-surface))] px-4 py-3.5">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-stone-500">Quote</dt>
            <dd className="truncate font-medium text-stone-900">{quoteNumber}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs font-medium text-stone-500">Total</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-stone-900 tabular-nums">
              {total}
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
