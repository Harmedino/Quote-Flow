import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Copyright } from '@/components/layout/Copyright';
import { Logo } from '@/components/ui/Logo';
import { FOOTER_COLUMNS, navLabel } from './marketing-nav';
import { useLiveDemo } from './use-demo-status';

export function MarketingFooter() {
  const liveDemo = useLiveDemo();

  return (
    <footer className="bg-ink text-white dark:border-t dark:border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs sm:col-span-3 lg:col-span-1">
            <Link
              to={paths.home}
              className="inline-flex rounded-lg focus-visible:outline-highlight"
            >
              <Logo tone="light" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-pretty text-white/65">
              Quotes your customers accept from their phone, invoices and payment tracking, for
              businesses that price the job before they do it.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="rounded-sm text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-highlight"
                    >
                      {navLabel(link, liveDemo)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Copyright tone="light" />
          <p className="text-xs text-white/60">
            Made for service businesses in Nigeria. Works in any currency and time zone.
          </p>
        </div>
      </div>
    </footer>
  );
}
