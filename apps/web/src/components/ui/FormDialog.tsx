import { X } from 'lucide-react';
import {
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface FormDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** While true (e.g. a save is in flight) the dialog cannot be dismissed. */
  pending?: boolean;
  onClose: () => void;
  /** Rendered only while open, so a form inside starts fresh every time. */
  children: ReactNode;
}

const FIRST_FIELD = 'input:not([type="hidden"]):not([disabled]), textarea, select';

/**
 * A modal for a short form: a bottom sheet on phones (like the Create and More
 * sheets), a centered panel from `sm` up. Built on a modal <dialog>, so the page behind is inert, focus
 * stays inside, Escape closes it and focus returns to the opener. Put a
 * <form> with {@link FormDialogBody} and {@link FormDialogFooter} inside.
 */
export function FormDialog({
  open,
  title,
  description,
  pending = false,
  onClose,
  children,
}: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>(FIRST_FIELD)?.focus();
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
    if (!pending) onClose();
  }

  // Escape fires `cancel`; the dialog closes only when the parent sets `open` to false.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    dismiss();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
    if (event.target === event.currentTarget) dismiss();
  }

  // Portalled to <body>, so a form inside never nests in a form around the opener.
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(
        'm-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[1.75rem] border-0 bg-surface p-0 text-stone-900 shadow-[var(--shadow-elevated)] backdrop:bg-black/45 open:flex open:flex-col open:animate-sheet-up open:backdrop:animate-fade-in',
        'sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)] sm:max-w-xl sm:rounded-2xl sm:border sm:border-stone-200 sm:open:animate-fade-in-up',
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
        <div className="min-w-0 pt-1">
          <h2 id={titleId} className="text-lg font-semibold text-stone-900">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-sm text-pretty text-stone-600">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={pending}
          className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
        >
          <X aria-hidden="true" className="size-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
      {open && children}
    </dialog>,
    document.body,
  );
}

/** Makes a <form> fill the dialog below its header. */
export const FORM_DIALOG_FORM_CLASSES = 'flex min-h-0 flex-1 flex-col';

/** The scrolling area of the form. */
export function FormDialogBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6', className)} {...props} />
  );
}

/** Actions pinned to the bottom of the dialog. */
export function FormDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col-reverse gap-3 border-t border-stone-200 bg-surface-muted px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:rounded-b-2xl sm:px-6 sm:pb-4',
        className,
      )}
      {...props}
    />
  );
}
