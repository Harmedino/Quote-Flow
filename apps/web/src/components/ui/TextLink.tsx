import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

/** An inline router link in the brand color, for links within text. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'rounded-sm font-medium text-brand-700 underline-offset-2 transition-colors hover:text-brand-800 hover:underline',
        className,
      )}
      {...props}
    />
  );
}
