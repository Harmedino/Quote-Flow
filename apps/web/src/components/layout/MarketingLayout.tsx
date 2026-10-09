import { Link, Outlet } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { Logo } from '@/components/ui/Logo';
import { Copyright } from './Copyright';
import { MAIN_CONTENT_ID, SkipLink } from './SkipLink';

const SECTION_LINKS = [
  { hash: '#product', label: 'Product' },
  { hash: '#features', label: 'Features' },
  { hash: '#how-it-works', label: 'How it works' },
  { hash: '#pricing', label: 'Pricing' },
];

const navLinkClass =
  'rounded-md text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950';

export default function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SkipLink />
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to={paths.home} className="flex rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
            {SECTION_LINKS.map((link) => (
              <a key={link.hash} href={link.hash} className={navLinkClass}>
                {link.label}
              </a>
            ))}
          </nav>
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            <ButtonLink to={paths.login} variant="ghost" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink to={paths.register} size="sm">
              Start free
            </ButtonLink>
          </nav>
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-200/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-pretty text-zinc-600">
              Quotes, approvals, invoices and payments for service businesses.
            </p>
          </div>
          <nav aria-label="Explore">
            <h2 className="text-sm font-semibold text-zinc-950">Explore</h2>
            <ul className="mt-3 space-y-2">
              {SECTION_LINKS.map((link) => (
                <li key={link.hash}>
                  <a href={link.hash} className={navLinkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Account links">
            <h2 className="text-sm font-semibold text-zinc-950">Account</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to={paths.register} className={navLinkClass}>
                  Create an account
                </Link>
              </li>
              <li>
                <Link to={paths.login} className={navLinkClass}>
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-zinc-200/70">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <Copyright />
          </div>
        </div>
      </footer>
    </div>
  );
}
