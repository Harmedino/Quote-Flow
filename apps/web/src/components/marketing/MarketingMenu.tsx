import { ArrowRight, X } from 'lucide-react';
import { type SyntheticEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';
import { MARKETING_NAV, navLabel } from './marketing-nav';
import { useLiveDemo } from './use-demo-status';

export interface MarketingMenuProps {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
}

/**
 * The phone menu: a full-screen ink panel over the page. It is a modal <dialog>, so the page
 * behind is inert, focus stays inside, Escape closes it and focus returns to the menu button.
 * It repeats the header row because the header behind it is inert while it is open.
 */
export function MarketingMenu({ open, onClose, signedIn }: MarketingMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const liveDemo = useLiveDemo();

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

  // Escape fires `cancel`; the menu closes when the header sets `open` to false.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    onClose();
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label="Menu"
      onCancel={handleCancel}
      className={cn(
        'm-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-ink p-0 text-white',
        'opacity-0 transition-[opacity,overlay,display] transition-discrete duration-200 open:opacity-100 starting:open:opacity-0',
        'backdrop:bg-transparent',
      )}
    >
      <div className="pb-safe flex min-h-full flex-col px-4 sm:px-6">
        <div className="flex h-16 shrink-0 items-center justify-between gap-4">
          <Link to={paths.home} className="flex rounded-lg focus-visible:outline-highlight">
            <Logo tone="light" />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle tone="ink" />
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex size-10 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline-highlight"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
        </div>

        <nav aria-label="Main" className="mt-2">
          <ul>
            {MARKETING_NAV.map((item, index) => {
              const current = pathname === item.to;
              return (
                <li
                  key={item.to}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={open ? 'animate-fade-in-up' : undefined}
                >
                  <Link
                    to={item.to}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between border-b border-white/10 py-5 font-display text-3xl font-semibold tracking-tight focus-visible:outline-highlight',
                      current ? 'text-highlight' : 'text-white',
                    )}
                  >
                    {navLabel(item, liveDemo)}
                    <ArrowRight aria-hidden="true" className="size-5 text-white/40" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto grid gap-3 pt-10 pb-8">
          {signedIn ? (
            <ButtonLink to={paths.dashboard} variant="highlight" size="xl" shape="pill">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to={paths.register} variant="highlight" size="xl" shape="pill">
                Start free
              </ButtonLink>
              <ButtonLink to={paths.login} variant="on-ink" size="xl" shape="pill">
                Sign in
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
