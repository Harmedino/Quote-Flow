import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, type To } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { cn } from '@/lib/cn';

const arrow = (
  <ArrowRight
    aria-hidden="true"
    className="size-4 transition-transform group-hover:translate-x-0.5"
  />
);

/** The lime "Start free" pill, the one main action of an ink section. */
export function StartFreeLink({
  to = paths.register,
  children = 'Start free',
  className,
}: {
  /** Another destination for the same pill, e.g. the demo on a page about trying it first. */
  to?: To;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <ButtonLink
      to={to}
      variant="highlight"
      size="xl"
      shape="pill"
      className={cn('group w-full sm:w-auto', className)}
    >
      {children}
      {arrow}
    </ButtonLink>
  );
}

/** A plain text link with a nudging arrow, e.g. "View live demo →" next to a pill. */
export function ArrowLink({
  to,
  children,
  onInk = false,
  className,
}: {
  to: To;
  children: ReactNode;
  onInk?: boolean;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center justify-center gap-1.5 rounded-md text-[0.9375rem] font-medium',
        onInk ? 'text-white focus-visible:outline-highlight' : 'text-stone-900',
        className,
      )}
    >
      {children}
      {arrow}
    </Link>
  );
}

/** An underlined link under a block of marketing copy, e.g. "See how quotes work". */
export function UnderlineLink({ to, children }: { to: To; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex rounded-sm text-sm font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4 transition-colors hover:decoration-stone-900"
    >
      {children}
    </Link>
  );
}
