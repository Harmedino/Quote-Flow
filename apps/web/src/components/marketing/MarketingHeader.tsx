import { ArrowRight, Menu } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { paths } from '@/app/paths';
import { HazardTape } from '@/components/layout/HazardTape';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { buttonClasses } from '@/components/ui/button-styles';
import { useSession } from '@/features/auth/use-session';
import { cn } from '@/lib/cn';
import { MarketingMenu } from './MarketingMenu';
import { MARKETING_NAV, navLabel } from './marketing-nav';
import { SITE_CONTAINER } from './site-container';
import { useLiveDemo } from './use-demo-status';

/** How far the page scrolls before the header draws its hairline. */
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

/** A main link: muted until it is the current page, which gets the orange marker under it. */
function navLinkClasses({ isActive }: { isActive: boolean }): string {
  return cn(
    'relative rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors',
    'after:absolute after:inset-x-3 after:-bottom-1 after:h-1 after:rounded-[3px]',
    isActive
      ? 'text-ink after:animate-marker-in after:bg-primary'
      : 'text-ink-2 hover:bg-surface-muted hover:text-ink',
  );
}

/**
 * The website's header: the hazard tape (it scrolls while a page loads), then a light bar with
 * the logo, the pages (from xl; a menu below), dark mode, Sign in and the orange Start free.
 */
export function MarketingHeader() {
  const scrolled = useSyncExternalStore(subscribeToScroll, isScrolled, () => false);
  // Only a session already loaded in this tab: the website doesn't check sign-in on its own.
  const signedIn = useSession().status === 'authenticated';
  const menu = useMenu();
  const liveDemo = useLiveDemo();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-canvas/92 backdrop-blur-md transition-shadow duration-300',
        scrolled && 'shadow-[0_1px_0_var(--color-line),0_10px_24px_-18px_rgb(14_27_51/0.35)]',
      )}
    >
      <HazardTape />
      <div className={cn(SITE_CONTAINER, 'flex h-16 items-center gap-6 xl:h-19 xl:gap-8')}>
        <Link to={paths.home} className="flex shrink-0 rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
          {MARKETING_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              {navLabel(item, liveDemo)}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />
          {/* Wrapped, because a button's own display would win over `hidden`. */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {signedIn ? (
              <ButtonLink to={paths.dashboard} variant="primary">
                Open dashboard
                <ArrowRight aria-hidden="true" />
              </ButtonLink>
            ) : (
              <>
                <div className="hidden lg:block">
                  <ButtonLink to={paths.login} variant="ghost" className="text-[15px]">
                    Sign in
                  </ButtonLink>
                </div>
                <ButtonLink to={paths.register} variant="primary">
                  Start free
                  <ArrowRight aria-hidden="true" />
                </ButtonLink>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={menu.show}
            aria-haspopup="dialog"
            aria-expanded={menu.open}
            className={buttonClasses({
              variant: 'secondary',
              size: 'icon',
              className: 'xl:hidden',
            })}
          >
            <Menu aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      <MarketingMenu open={menu.open} onClose={menu.close} signedIn={signedIn} />
    </header>
  );
}
