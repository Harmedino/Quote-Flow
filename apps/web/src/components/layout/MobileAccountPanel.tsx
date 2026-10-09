import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useSignOut } from '@/features/auth/use-sign-out';
import { useAuthenticatedSession } from '@/features/auth/use-session';
import { getErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';
import { AccountSummary } from './AccountSummary';
import { isNavItemActive, MOBILE_MORE_ITEMS } from './nav-items';

const ROW_CLASSES =
  'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors focus-visible:outline-offset-[-2px] active:bg-stone-50 [&_svg]:size-5 [&_svg]:shrink-0';

/**
 * The phone "More" sheet: who is signed in, the screens that are not in the tab bar, the theme
 * switch and sign out.
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

      <ul className="grid grid-cols-3 gap-2">
        {MOBILE_MORE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-colors',
                  active
                    ? 'border-stone-900 bg-stone-50 dark:border-stone-500'
                    : 'border-stone-200 active:bg-stone-50',
                )}
              >
                <Icon aria-hidden="true" className="size-5 text-stone-800" strokeWidth={1.75} />
                <span className="text-[13px] font-medium text-stone-800">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200">
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={toggleTheme}
          className={cn(ROW_CLASSES, 'text-stone-800')}
        >
          {dark ? (
            <Sun aria-hidden="true" className="text-stone-600" strokeWidth={1.75} />
          ) : (
            <Moon aria-hidden="true" className="text-stone-600" strokeWidth={1.75} />
          )}
          <span className="flex-1">Dark mode</span>
          <span
            aria-hidden="true"
            className={cn(
              'relative h-6 w-10 rounded-full transition-colors',
              dark ? 'bg-brand-600' : 'bg-stone-300',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
                dark ? 'translate-x-[18px]' : 'translate-x-0.5',
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
          className={cn(ROW_CLASSES, 'text-red-700 aria-disabled:cursor-wait')}
        >
          {signOut.isPending ? (
            <Spinner className="size-5" />
          ) : (
            <LogOut aria-hidden="true" strokeWidth={1.75} />
          )}
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      {signOut.isError && (
        <Alert tone="danger">Couldn’t sign out. {getErrorMessage(signOut.error)}</Alert>
      )}
    </section>
  );
}
