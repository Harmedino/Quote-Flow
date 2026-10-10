import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useReveal } from './use-reveal';

export interface RevealProps {
  children: ReactNode;
  /** Milliseconds, to stagger items in a row or a list. */
  delay?: number;
  className?: string;
}

/** Fades its content up once as it scrolls into view (see useReveal). */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,translate] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] data-[reveal=pending]:translate-y-6 data-[reveal=pending]:opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}
