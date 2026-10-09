import { ChevronsUpDown, LogOut, type LucideIcon, Store, UserRound } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useSignOut } from '@/features/auth/use-sign-out';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getErrorMessage } from '@/lib/api-error';
import { AccountSummary } from './AccountSummary';

type InitialFocus = 'first' | 'last';

const LINKS: readonly { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Account settings', to: paths.accountSettings, icon: UserRound },
  { label: 'Business settings', to: paths.businessSettings, icon: Store },
];

const ITEM_CLASSES =
  'flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-stone-700 outline-none hover:bg-stone-100 hover:text-stone-900 focus-visible:bg-stone-100 focus-visible:text-stone-900 aria-disabled:cursor-wait [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-stone-500';

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

/**
 * The business and signed-in user at the foot of the ink sidebar, opening a menu with the
 * settings pages and sign out. It follows the ARIA menu button pattern: arrow keys move
 * between items, Escape closes and returns focus to the button, Tab or a click outside closes it.
 */
export function AccountMenu() {
  const session = useAuthenticatedSession();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const [initialFocus, setInitialFocus] = useState<InitialFocus>('first');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const menuId = useId();

  useEffect(() => {
    if (open) {
      const items = menuItems(menuRef.current);
      (initialFocus === 'last' ? items.at(-1) : items[0])?.focus();
    }
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  function openMenu(focus: InitialFocus) {
    if (open) {
      const items = menuItems(menuRef.current);
      (focus === 'last' ? items.at(-1) : items[0])?.focus();
      return;
    }
    signOut.reset();
    setInitialFocus(focus);
    setOpen(true);
  }

  function closeMenu(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowUp' ? 'last' : 'first');
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = menuItems(menuRef.current);
    const current = items.findIndex((item) => item === document.activeElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        next = items[(current + 1) % items.length];
        break;
      case 'ArrowUp':
        next = items[(current - 1 + items.length) % items.length];
        break;
      case 'Home':
        next = items[0];
        break;
      case 'End':
        next = items.at(-1);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        return;
      case 'Tab':
        // Leave from the button, so Tab and Shift+Tab continue from where the menu was opened.
        closeMenu(true);
        return;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  }

  return (
    <div ref={rootRef} className="relative border-t border-white/10 p-3">
      {open && (
        <div className="absolute bottom-full left-3 z-40 mb-1 w-72 animate-fade-in-up rounded-xl border border-stone-200 bg-surface p-1.5 text-stone-900 shadow-[var(--shadow-elevated)]">
          <div className="border-b border-stone-200 px-2.5 pt-2.5 pb-3">
            <AccountSummary session={session} />
          </div>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            onKeyDown={handleMenuKeyDown}
            className="space-y-0.5 pt-1.5"
          >
            {LINKS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                role="menuitem"
                tabIndex={-1}
                onClick={() => closeMenu(false)}
                className={ITEM_CLASSES}
              >
                <Icon aria-hidden="true" />
                {label}
              </Link>
            ))}
            <div role="separator" className="mx-1 my-1.5 h-px bg-stone-200" />
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={signOut.isPending || undefined}
              onClick={() => {
                if (!signOut.isPending) {
                  signOut.mutate();
                }
              }}
              className={ITEM_CLASSES}
            >
              {signOut.isPending ? <Spinner /> : <LogOut aria-hidden="true" />}
              {signOut.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
          {signOut.isError && (
            <p role="alert" className="px-2.5 pt-1 pb-2 text-xs text-red-700">
              Couldn’t sign out. {getErrorMessage(signOut.error)}
            </p>
          )}
        </div>
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu(false) : openMenu('first'))}
        onKeyDown={handleTriggerKeyDown}
        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-highlight aria-expanded:bg-white/[0.09]"
      >
        <Avatar name={session.business.name} tone="highlight" size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {session.business.name}
          </span>
          <span className="block truncate text-xs text-white/55">{session.user.name}</span>
        </span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-white/45" />
        <span className="sr-only">Account menu</span>
      </button>
    </div>
  );
}
