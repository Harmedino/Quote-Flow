import { ArrowRight, Menu } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/cn';
import { MarketingMenu } from './MarketingMenu';
import { MARKETING_NAV, navLabel } from './marketing-nav';
import { useLiveDemo } from './use-demo-status';

/** How far the page scrolls before the header casts its shadow. */
const SCROLL_SHADOW_OFFSET = 8;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

const isScrolled = () => window.scrollY > SCROLL_SHADOW_OFFSET;

/**
 * Whether the phone menu is open. It is tied to the location it was opened at, so following
 * any link (or going back) closes it.
 */
function useMenu() {
  const { key } = useLocation();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  return {
    open: openedAt === key,
    show: () => setOpenedAt(key),
    close: () => setOpenedAt(null),
  };
}

export function MarketingHeader() {
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled);
  // Only a session already loaded in this tab: the website doesn't check sign-in on its own.
  const signedIn = useSession().status === 'authenticated';
  const menu = useMenu();
  const liveDemo = useLiveDemo();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-ink transition-shadow duration-300',
        scrolled && 'shadow-[0_1px_0_rgb(255_255_255/0.08),0_10px_30px_-12px_rgb(0_0_0/0.5)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to={paths.home} className="flex shrink-0 rounded-lg focus-visible:outline-highlight">
          <Logo tone="light" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {MARKETING_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-highlight xl:px-3.5',
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white',
                )
              }
            >
              {navLabel(item, liveDemo)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle tone="ink" />
          <div className="hidden items-center gap-2 lg:flex">
            {signedIn ? (
              <ButtonLink to={paths.dashboard} variant="highlight" shape="pill">
                Open dashboard
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            ) : (
              <>
                <Link
                  to={paths.login}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white focus-visible:outline-highlight"
                >
                  Sign in
                </Link>
                <ButtonLink to={paths.register} variant="highlight" shape="pill">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={menu.show}
            aria-haspopup="dialog"
            aria-expanded={menu.open}
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-white hover:bg-white/10 focus-visible:outline-highlight lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      <MarketingMenu open={menu.open} onClose={menu.close} signedIn={signedIn} />
    </header>
  );
}
