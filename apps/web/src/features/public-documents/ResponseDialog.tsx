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
import { BRAND_FILL, INK_FILL } from './fills';

export interface ResponseDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  /** 'brand' for the positive answer, 'ink' for a neutral one. */
  confirmFill: 'brand' | 'ink';
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirms a customer's answer: a bottom sheet on phones, a centered panel
 * from `sm` up. A modal <dialog>, so the page behind is inert, Escape cancels
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
      className="mx-0 mt-auto mb-0 max-h-[calc(100dvh-2rem)] w-full max-w-none overflow-y-auto rounded-t-2xl border-0 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-zinc-950/50 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-2xl"
    >
      <div className="px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-6">
        <h2 id={titleId} className="text-lg font-semibold text-zinc-950">
          {title}
        </h2>
        <div id={descriptionId} className="mt-2 text-sm/6 text-pretty text-zinc-600">
          {description}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {error && (
          <Alert tone="danger" className="mt-5">
            {error}
          </Alert>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
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
            style={confirmFill === 'brand' ? BRAND_FILL : INK_FILL}
            className="hover:brightness-95 active:brightness-90"
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
