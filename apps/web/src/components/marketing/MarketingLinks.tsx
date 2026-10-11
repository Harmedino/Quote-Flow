import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { To } from 'react-router';
import { paths } from '@/app/paths';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { TextLink } from '@/components/ui/TextLink';
import { cn } from '@/lib/cn';

const arrow = (
  <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
);

/**
 * The website's big orange "Start free", the one main action of a section. It stands on a navy
 * edge, like the concept's hero button, so it reads as the thing to press.
 */
export function StartFreeLink({
  to = paths.register,
  children = 'Start free',
  className,
}: {
  /** Another destination for the same button, e.g. the demo on a page about trying it first. */
  to?: To;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <ButtonLink
      to={to}
      variant="primary"
      size="xl"
      className={cn(
        'group w-full shadow-[inset_0_-3px_0_rgb(14_27_51/0.22),0_3px_0_var(--color-navy)] sm:w-auto dark:shadow-[inset_0_-3px_0_rgb(0_0_0/0.25)]',
        className,
      )}
    >
      {children}
      {arrow}
    </ButtonLink>
  );
}

/** An orange text link with a nudging arrow, e.g. "See how it works →" under a block of copy. */
export function ArrowLink({
  to,
  children,
  className,
}: {
  to: To;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TextLink to={to} className={cn('group text-base', className)}>
      {children}
      {arrow}
    </TextLink>
  );
}
