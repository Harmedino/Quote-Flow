import { Plus } from 'lucide-react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { PageLoader } from '@/components/PageLoader';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { SESSION_EXPIRED_STATE, signInPathFor } from '@/features/auth/redirect';
import { useSession } from '@/features/auth/use-session';
import { AccountMenu } from './AccountMenu';
import { AppNavigation } from './AppNavigation';
import { MobileNav } from './MobileNav';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

export default function AppLayout() {
  const session = useSession();
  const location = useLocation();

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
    <div className="min-h-dvh bg-zinc-50">
      <SkipLink />

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-zinc-200 lg:bg-white">
        <div className="flex h-16 shrink-0 items-center px-6">
          <Link to={paths.dashboard} className="flex rounded-lg">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-4 pt-2 pb-4">
          <AppNavigation />
        </div>
        <div className="shrink-0 border-t border-zinc-200 p-3">
          <AccountMenu />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:hidden">
        <MobileNav />
        <Link to={paths.dashboard} className="flex min-w-0 overflow-hidden rounded-lg">
          <Logo />
        </Link>
        <ButtonLink to={paths.newQuote} size="sm" className="ml-auto">
          <Plus aria-hidden="true" />
          <span className="max-sm:sr-only">New quote</span>
        </ButtonLink>
      </header>

      <div className="lg:pl-64">
        <main
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-8 focus:outline-none sm:px-6 lg:px-10 lg:py-12"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
