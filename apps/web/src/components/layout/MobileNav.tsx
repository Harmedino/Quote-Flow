import { Menu, X } from 'lucide-react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Logo } from '@/components/ui/Logo';
import { AppNavigation } from './AppNavigation';

const DRAWER_ID = 'mobile-navigation';
/** Matches Tailwind's `lg` breakpoint, where the permanent sidebar takes over. */
const DESKTOP_QUERY = '(min-width: 64rem)';

/**
 * Menu button and slide-over navigation for small screens. Built on a modal
 * <dialog>, which makes the rest of the page inert, traps focus and closes on
 * Escape natively.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Rotating or resizing to desktop width hides the drawer; close it so the page is not left inert.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };
    desktop.addEventListener('change', closeOnDesktop);

    return () => {
      document.body.style.overflow = overflow;
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function handleDialogClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
    if (event.target === event.currentTarget) {
      close();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        aria-haspopup="dialog"
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
      >
        <Menu aria-hidden="true" className="size-5" />
        <span className="sr-only">Open navigation</span>
      </button>

      <dialog
        ref={dialogRef}
        id={DRAWER_ID}
        aria-label="Navigation"
        onClose={handleDialogClose}
        onClick={handleBackdropClick}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-80 max-w-[calc(100vw-3rem)] overflow-hidden border-0 bg-white p-0 shadow-xl transition-transform duration-200 ease-out backdrop:bg-zinc-950/40 starting:open:-translate-x-full motion-reduce:transition-none"
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 pb-6">
          <div className="flex h-14 shrink-0 items-center justify-between">
            <Link to={paths.dashboard} onClick={close} className="flex rounded-lg">
              <Logo />
            </Link>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close navigation</span>
            </button>
          </div>
          <div className="mt-4 flex flex-1 flex-col">
            <AppNavigation onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
