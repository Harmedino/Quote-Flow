import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

/** An inline router link in orange-for-text, for links within text and "All invoices" links. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'rounded-sm font-[650] text-primary-ink underline-offset-[3px] transition-colors hover:underline [&_svg]:ml-1 [&_svg]:inline-block [&_svg]:size-4 [&_svg]:stroke-[2.4] [&_svg]:align-[-3px]',
        className,
      )}
      {...props}
    />
  );
}
