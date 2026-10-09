import { X } from 'lucide-react';
import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** The sheet's accessible name, e.g. "Menu". */
  label: string;
  children: ReactNode;
  className?: string;
}

/** How far (px) or how fast (px/ms) a downward drag on the handle must go to close the sheet. */
const CLOSE_DISTANCE = 90;
const CLOSE_VELOCITY = 0.6;

/**
 * A panel that slides up from the bottom of a phone screen. Built on a modal <dialog>, so the
 * page behind is inert, focus stays inside, and Escape, a tap on the backdrop or a drag down
 * on the handle closes it. The parent owns `open` and returns focus where it belongs.
 */
export function Sheet({ open, onClose, label, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ startY: number; startTime: number } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
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

  // Escape fires `cancel`; the sheet closes when the parent sets `open` to false.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
    if (event.target === event.currentTarget) onClose();
  }

  function offset(event: PointerEvent): number {
    return drag.current ? Math.max(0, event.clientY - drag.current.startY) : 0;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { startY: event.clientY, startTime: event.timeStamp };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dialog = dialogRef.current;
    if (!drag.current || !dialog) return;
    dialog.style.transition = 'none';
    dialog.style.translate = `0 ${offset(event)}px`;
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const dialog = dialogRef.current;
    if (!drag.current || !dialog) return;
    const distance = offset(event);
    const velocity = distance / Math.max(1, event.timeStamp - drag.current.startTime);
    drag.current = null;
    // Hand the position back to the stylesheet, which animates to open or closed.
    dialog.style.transition = '';
    dialog.style.translate = '';
    if (distance > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) onClose();
  }

  // Portalled to <body>, so no sticky bar or transformed ancestor can sit on top of it.
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className={cn(
        'm-0 mt-auto max-h-[88svh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[1.75rem] border-0 bg-surface p-0 text-stone-900 shadow-[var(--shadow-elevated)]',
        'translate-y-full transition-[translate,overlay,display] transition-discrete duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] open:translate-y-0 starting:open:translate-y-full',
        'backdrop:bg-black/45 backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-300 starting:open:backdrop:bg-black/0',
      )}
    >
      <div className="pb-safe">
        <div
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="flex cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
        >
          <span className="h-1.5 w-10 rounded-full bg-stone-300" />
        </div>
        <div className={cn('px-4 pt-2 pb-5', className)}>{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-3 focus-visible:right-3 focus-visible:inline-flex focus-visible:size-9 focus-visible:items-center focus-visible:justify-center focus-visible:rounded-full focus-visible:bg-stone-100"
        >
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
