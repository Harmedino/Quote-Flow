import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Short facts on one line, dot-separated: "LHS-Q-0017 · Valid until Oct 24". Each child draws
 * the dot before it, and the row is shifted left by one dot's width with the overflow clipped,
 * so when the facts wrap the dot that would start a line is cut off and none is left dangling.
 */
export function MetaLine({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('block overflow-hidden', className)}>
      <span className="-ml-3 flex flex-wrap [&>*]:before:inline-block [&>*]:before:w-3 [&>*]:before:text-center [&>*]:before:font-sans [&>*]:before:content-['·']">
        {children}
      </span>
    </span>
  );
}
