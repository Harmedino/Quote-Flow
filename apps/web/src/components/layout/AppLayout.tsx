import { type RefObject, useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useMatches } from 'react-router';
import { paths } from '@/app/paths';
import { PageLoader } from '@/components/PageLoader';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SESSION_EXPIRED_STATE, signInPathFor } from '@/features/auth/redirect';
import { useSession } from '@/features/auth/use-session';
import { AccountMenu } from './AccountMenu';
import { AppNavigation, CreateCard } from './AppNavigation';
import { type MobileSheetName, type MobileSheets, MobileNav, MobileTopBar } from './MobileNav';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

/** Matches Tailwind's `lg` breakpoint, where the sidebar replaces the phone navigation. */
const DESKTOP_QUERY = '(min-width: 64rem)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function AppLayout() {
  const session = useSession();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const sheets = useMobileSheets();
  usePageEntrance(mainRef);

  // Route middleware admits only signed-in users; this handles a session that ends while
  // the app is open (sign-out, here or in another tab, or a refresh that was refused).
  if (session.status !== 'authenticated') {
    if (session.status === 'anonymous' && session.endReason === 'signed-out') {
      return <Navigate to={paths.login} replace />;
    }
    return (
      <>
        <Navigate
          to={signInPathFor(`${location.pathname}${location.search}`)}
          replace
          state={SESSION_EXPIRED_STATE}
        />
        <PageLoader />
      </>
    );
  }

  return (
    <div className="flex min-h-dvh bg-stone-50">
      <SkipLink />

      <aside className="sticky top-0 z-40 hidden h-dvh w-64 shrink-0 flex-col bg-ink lg:flex dark:border-r dark:border-white/[0.06]">
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
          <Link to={paths.dashboard} className="flex rounded-lg focus-visible:outline-highlight">
            <Logo tone="light" />
          </Link>
          <ThemeToggle tone="ink" />
        </div>
        <AppNavigation />
        <CreateCard />
        <AccountMenu />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar sheets={sheets} />
        <main
          ref={mainRef}
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
      </div>

      <MobileNav sheets={sheets} />
    </div>
  );
}

/**
 * Which phone sheet is open. It is tied to the location it was opened at, so any navigation
 * (a link in the sheet, back/forward) closes it, and so does widening to desktop.
 */
function useMobileSheets(): MobileSheets {
  const { key } = useLocation();
  const [opened, setOpened] = useState<{ name: MobileSheetName; at: string } | null>(null);
  const open = opened?.at === key ? opened.name : null;

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpened(null);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [open]);

  return {
    open,
    show: (name) => setOpened({ name, at: key }),
    close: () => setOpened(null),
  };
}

/**
 * Fades each new page in. It plays when the matched route changes, not on every URL change,
 * so filters and search params never replay it, and it animates in place rather than
 * remounting the page, so focus and state survive.
 */
function usePageEntrance(mainRef: RefObject<HTMLElement | null>) {
  const routeId = useMatches().at(-1)?.id;

  useEffect(() => {
    const main = mainRef.current;
    if (!main || !routeId || window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const animation = main.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
    return () => animation.cancel();
  }, [mainRef, routeId]);
}
