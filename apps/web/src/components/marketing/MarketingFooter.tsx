import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { Copyright } from '@/components/layout/Copyright';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { FOOTER_COLUMNS, navLabel } from './marketing-nav';
import { SITE_CONTAINER } from './site-container';
import { useLiveDemo } from './use-demo-status';

/** The navy footer under a strip of hazard tape: the logo and what QuoteFlow is, then the links. */
export function MarketingFooter() {
  const liveDemo = useLiveDemo();

  return (
    <footer className="bg-navy text-on-navy">
      <div aria-hidden="true" className="h-1.5 hazard-tape" />
      <div className={cn(SITE_CONTAINER, 'pt-14 pb-10 sm:pt-16')}>
        <div className="grid gap-12 sm:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs sm:col-span-3 lg:col-span-1">
            <Link to={paths.home} className="inline-flex rounded-lg">
              <Logo tone="light" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-pretty text-on-navy/75">
              Quotes your customers accept from their phone, invoices and payment tracking, for
              businesses that price the job before they do it.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="label-mono text-on-navy/65">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="rounded-sm text-[14.5px] text-on-navy/85 underline-offset-4 transition-colors hover:text-on-navy hover:underline"
                    >
                      {navLabel(link, liveDemo)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-on-navy/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Copyright tone="light" />
          <p className="font-mono text-xs text-on-navy/70">
            Made for service businesses in Nigeria · Any currency, any time zone
          </p>
        </div>
      </div>
    </footer>
  );
}
