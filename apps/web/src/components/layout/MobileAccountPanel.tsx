import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { useSignOut } from '@/features/auth/use-sign-out';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';
import { AccountSummary } from './AccountSummary';
import { isNavItemActive, MOBILE_MORE_ITEMS } from './nav-items';

const ROW_CLASSES =
  'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors focus-visible:outline-offset-[-2px] active:bg-surface-muted [&_svg]:size-5 [&_svg]:shrink-0';

/**
 * The phone's account sheet, opened from the business name: who is signed in, the screens that
 * are not in the tab bar, the theme switch and sign out.
 */
export function MobileAccountPanel() {
  const session = useAuthenticatedSession();
  const { pathname } = useLocation();
  const signOut = useSignOut();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <section aria-label="Account" className="space-y-4">
      <div className="px-1">
        <AccountSummary session={session} />
      </div>

      <ul className="grid grid-cols-2 gap-2.5">
        {MOBILE_MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 overflow-hidden rounded-xl bg-surface px-4 py-3.5 transition-colors active:bg-surface-muted',
                  active ? 'shadow-[inset_0_0_0_1.5px_var(--color-ink)]' : 'shadow-(--shadow-card)',
                )}
              >
                <Icon aria-hidden="true" className="size-5 text-primary-ink" strokeWidth={2} />
                <span className="text-sm font-bold text-ink">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="divide-y divide-line overflow-hidden rounded-xl bg-surface shadow-(--shadow-card)">
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={toggleTheme}
          className={cn(ROW_CLASSES, 'text-ink')}
        >
          {dark ? (
            <Sun aria-hidden="true" className="text-ink-2" strokeWidth={2} />
          ) : (
            <Moon aria-hidden="true" className="text-ink-2" strokeWidth={2} />
          )}
          <span className="flex-1">Dark mode</span>
          <span
            aria-hidden="true"
            className={cn(
              'relative h-6 w-10 rounded-full transition-colors',
              dark ? 'bg-primary' : 'bg-line-strong',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full shadow-sm transition-transform',
                dark ? 'translate-x-[18px] bg-on-primary' : 'translate-x-0.5 bg-surface',
              )}
            />
          </span>
        </button>
        <button
          type="button"
          aria-disabled={signOut.isPending || undefined}
          onClick={() => {
            if (!signOut.isPending) signOut.mutate();
          }}
          className={cn(ROW_CLASSES, 'text-danger aria-disabled:cursor-wait')}
        >
          <LogOut aria-hidden="true" strokeWidth={2} />
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {signOut.isError && (
        <Alert tone="danger">Couldn’t sign out. {getErrorMessage(signOut.error)}</Alert>
      )}
    </section>
  );
}
