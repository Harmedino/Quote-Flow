import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { LogoMark } from '@/components/ui/Logo';

/**
 * A slim ink bar over a customer page opened from the website's demo, so visitors can go back
 * to the tour for the owner's side, or sign up.
 */
export function DemoBar() {
  return (
    <div className="bg-ink px-4 text-white sm:px-6 print:hidden">
      {/* Lined up with the page's cards (PublicDocumentLayout). */}
      <div className="mx-auto flex h-12 max-w-3xl items-center gap-3 lg:max-w-5xl">
        <Link
          to={paths.demo}
          className="flex shrink-0 items-center gap-2 rounded-lg text-sm font-medium text-white/80 transition-colors hover:text-white focus-visible:outline-highlight"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          <LogoMark onDark className="hidden size-6 sm:block" />
          Back to the demo
        </Link>
        <span className="hidden rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-highlight uppercase min-[360px]:inline">
          Demo
        </span>
        <span className="hidden min-w-0 truncate text-xs text-white/70 md:inline">
          Sample business. Nothing here reaches a real person.
        </span>
        <ButtonLink
          to={paths.register}
          variant="highlight"
          size="sm"
          shape="pill"
          className="ml-auto"
        >
          Start free
        </ButtonLink>
      </div>
    </div>
  );
}
