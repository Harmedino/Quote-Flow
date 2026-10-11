import { ArrowRight, X } from 'lucide-react';
import { type SyntheticEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { buttonClasses } from '@/components/ui/button-styles';
import { cn } from '@/lib/cn';
import { MARKETING_NAV, navLabel } from './marketing-nav';
import { SITE_CONTAINER } from './site-container';
import { useLiveDemo } from './use-demo-status';

export interface MarketingMenuProps {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
}

/**
 * The menu below xl: a full-screen sheet of site paper over the page. It is a modal <dialog>, so
 * the page behind is inert, focus stays inside, Escape closes it and focus returns to the menu
 * button. It repeats the header row because the header behind it is inert while it is open.
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
        'm-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-canvas p-0 text-ink',
        'opacity-0 transition-[opacity,overlay,display] transition-discrete duration-200 open:opacity-100 starting:open:opacity-0',
        'backdrop:bg-transparent',
      )}
    >
      <div className="pb-safe flex min-h-full flex-col">
        <div aria-hidden="true" className="h-1 shrink-0 hazard-tape" />
        <div
          className={cn(SITE_CONTAINER, 'flex h-16 shrink-0 items-center justify-between gap-4')}
        >
          <Link to={paths.home} className="flex rounded-lg">
            <Logo />
          </Link>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className={buttonClasses({ variant: 'secondary', size: 'icon' })}
            >
              <X aria-hidden="true" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
        </div>

        <nav aria-label="Main" className={cn(SITE_CONTAINER, 'mt-4')}>
          <ul className="border-t-[1.5px] border-dashed border-line-strong">
            {MARKETING_NAV.map((item, index) => {
              const current = pathname === item.to;
              return (
                <li
                  key={item.to}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    'border-b-[1.5px] border-dashed border-line-strong',
                    open && 'animate-fade-in-up',
                  )}
                >
                  <Link
                    to={item.to}
                    aria-current={current ? 'page' : undefined}
                    className="group flex items-center gap-4 rounded-md py-4"
                  >
                    <span aria-hidden="true" className="w-6 font-mono text-xs text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'flex-1 text-[1.75rem] leading-tight font-[820] tracking-[-0.02em] font-stretch-118%',
                        current ? 'text-primary-ink' : 'text-ink',
                      )}
                    >
                      {navLabel(item, liveDemo)}
                    </span>
                    {current ? (
                      <span aria-hidden="true" className="size-2.5 bg-primary" />
                    ) : (
                      <ArrowRight
                        aria-hidden="true"
                        className="size-5 text-muted transition-transform group-hover:translate-x-0.5"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn(SITE_CONTAINER, 'mt-auto grid gap-3 pt-10 pb-8 sm:grid-cols-2')}>
          {signedIn ? (
            <ButtonLink to={paths.dashboard} variant="primary" size="xl" className="sm:col-span-2">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to={paths.register} variant="primary" size="xl">
                Start free
              </ButtonLink>
              <ButtonLink to={paths.login} variant="outline" size="xl">
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
