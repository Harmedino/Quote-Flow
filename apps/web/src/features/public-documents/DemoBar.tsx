import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LogoMark } from '@/components/ui/Logo';
import { PAGE_COLUMN } from './DocumentBand';

/**
 * QuoteFlow's own navy bar, under its hazard tape, over a customer page opened from the website's
 * demo: visitors can go back to the tour for the owner's side, or sign up.
 */
export function DemoBar() {
  return (
    <div className="bg-navy text-on-navy print:hidden">
      <div aria-hidden="true" className="h-1 hazard-tape" />
      <div className="px-4 sm:px-6">
        <div className={`${PAGE_COLUMN} flex h-12 items-center gap-3`}>
          <Link
            to={paths.demo}
            className="flex shrink-0 items-center gap-2 rounded-lg text-sm font-semibold text-on-navy/85 transition-colors hover:text-on-navy"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.25} />
            <LogoMark className="hidden size-6 sm:block" />
            Back to the demo
          </Link>
          <span className="hidden h-5.5 items-center rounded-[5px] bg-primary px-2 font-mono text-[10.5px] font-semibold tracking-[0.07em] text-on-primary uppercase min-[360px]:inline-flex">
            Demo
          </span>
          <span className="hidden min-w-0 truncate text-[13px] text-on-navy/75 md:inline">
            Sample business. Nothing here reaches a real person.
          </span>
          <ButtonLink to={paths.register} size="sm" className="ml-auto">
            Start free
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
