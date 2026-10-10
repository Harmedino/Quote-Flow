import { TriangleAlert } from 'lucide-react';
import {
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useId,
  useRef,
} from 'react';
import { Alert } from './Alert';
import { Button } from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** While true the action is running: the dialog stays open and cannot be dismissed. */
  pending?: boolean;
  /** Shown inside the dialog when the action failed. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before a consequential action. Built on a modal <dialog>: the page
 * behind it is inert, Escape cancels, and the browser returns focus to the
 * element that opened it. Cancel is focused first, so Enter never confirms by accident.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function dismiss() {
    if (!pending) {
      onCancel();
    }
  }

  // Escape fires `cancel`; the dialog closes only when the parent sets `open` to false.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    dismiss();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
    if (event.target === event.currentTarget) {
      dismiss();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 bg-surface p-0 text-stone-900 shadow-[var(--shadow-elevated)] backdrop:bg-black/50 open:animate-fade-in-up"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <TriangleAlert aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0 pt-1">
            <h2 id={titleId} className="text-lg font-semibold text-stone-900">
              {title}
            </h2>
            <div id={descriptionId} className="mt-1.5 text-sm text-pretty text-stone-600">
              {description}
            </div>
          </div>
        </div>
        {error && (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        )}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={dismiss} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
