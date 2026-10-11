import {
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useId,
  useRef,
} from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { DIALOG_CLASSES } from '@/components/ui/dialog-styles';
import { cn } from '@/lib/cn';
import { BRAND_FILL, FILL_FEEDBACK, NEUTRAL_FILL } from './fills';

export interface ResponseDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  /** 'brand' for the positive answer, 'neutral' for one that shouldn't look celebratory. */
  confirmFill: 'brand' | 'neutral';
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirms a customer's answer: a bottom sheet on phones, a centred panel
 * from `sm` up (the app's dialog look). A modal <dialog>, so the page behind is inert, Escape cancels
 * and focus returns to the opener. Cancel is focused first so Enter never answers by accident.
 */
export function ResponseDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  confirmFill,
  pending,
  error,
  onConfirm,
  onCancel,
}: ResponseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  function dismiss() {
    if (!pending) onCancel();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    dismiss();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) dismiss();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(DIALOG_CLASSES, 'sm:max-w-md')}
    >
      <div className="px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <h2 id={titleId} className="text-xl leading-tight font-[800] font-stretch-115%">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-[14.5px] text-pretty text-ink-2">
          {description}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {error && (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        )}
        <div className="mt-6 grid grid-cols-[1fr_1.4fr] gap-2.5 sm:flex sm:justify-end">
          <Button
            ref={cancelRef}
            variant="secondary"
            size="lg"
            onClick={dismiss}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            style={confirmFill === 'brand' ? BRAND_FILL : NEUTRAL_FILL}
            className={FILL_FEEDBACK}
            onClick={onConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
