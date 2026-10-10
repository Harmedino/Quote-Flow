import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';

export interface LogoMarkProps {
  className?: string;
  /** Lifts the tile off ink backgrounds (sidebar, top bar, dark sections). */
  onDark?: boolean;
}

/**
 * The QuoteFlow mark: a "Q" whose lime tail is the quote moving on. public/favicon.svg is the
 * same drawing on the ink tile; keep the two in step.
 */
export function LogoMark({ className, onDark = false }: LogoMarkProps) {
  // The raised tile also keeps the mark distinct on the near-black dark-mode page.
  const tile = onDark ? 'fill-ink-700' : 'fill-ink dark:fill-ink-700';
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('shrink-0', className)}>
      <rect width="64" height="64" rx="16" className={tile} />
      <circle cx="29.5" cy="30" r="12.5" fill="none" stroke="#fff" strokeWidth="8" />
      <rect x="29" y="39.5" width="24" height="12" rx="6" className={tile} />
      <rect x="30.5" y="41" width="21" height="9" rx="4.5" className="fill-highlight" />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 'size-6', wordmark: 'text-[0.9375rem]', gap: 'gap-2' },
  md: { mark: 'size-8', wordmark: 'text-lg', gap: 'gap-2.5' },
  lg: { mark: 'size-10', wordmark: 'text-2xl', gap: 'gap-3' },
} as const;

export interface LogoProps {
  size?: keyof typeof SIZES;
  /** `light` for ink backgrounds: a white wordmark and a raised tile. */
  tone?: 'default' | 'light';
  /** Show only the mark; the name stays available to screen readers. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 'md', tone = 'default', markOnly = false, className }: LogoProps) {
  const styles = SIZES[size];
  const light = tone === 'light';
  return (
    <span className={cn('inline-flex items-center', styles.gap, className)}>
      <LogoMark className={styles.mark} onDark={light} />
      <span
        className={
          markOnly
            ? 'sr-only'
            : cn(
                'font-display font-bold tracking-tight',
                light ? 'text-white' : 'text-stone-900',
                styles.wordmark,
              )
        }
      >
        {APP_NAME}
      </span>
    </span>
  );
}
