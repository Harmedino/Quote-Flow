import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';

/**
 * The QuoteFlow mark: an orange job ticket with side notches and a navy "Q". public/favicon.svg
 * is the same drawing in its light colours; keep the two in step.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('shrink-0', className)}>
      <path
        className="fill-primary"
        d="M7 2H25A5 5 0 0 1 30 7V12A4 4 0 0 0 30 20V25A5 5 0 0 1 25 30H7A5 5 0 0 1 2 25V20A4 4 0 0 0 2 12V7A5 5 0 0 1 7 2Z"
      />
      <circle
        className="stroke-on-primary"
        cx="15.6"
        cy="15.4"
        r="5.2"
        fill="none"
        strokeWidth="3.1"
      />
      <path
        className="stroke-on-primary"
        d="M18.7 18.6L21.9 21.8"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 'size-6', wordmark: 'text-[15px]', gap: 'gap-2' },
  md: { mark: 'size-8', wordmark: 'text-[19px]', gap: 'gap-2.5' },
  lg: { mark: 'size-10', wordmark: 'text-2xl', gap: 'gap-3' },
} as const;

export interface LogoProps {
  size?: keyof typeof SIZES;
  /** `light` for navy bands: a paper-coloured wordmark. */
  tone?: 'default' | 'light';
  /** Show only the mark; the name stays available to screen readers. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 'md', tone = 'default', markOnly = false, className }: LogoProps) {
  const styles = SIZES[size];
  return (
    <span className={cn('inline-flex items-center', styles.gap, className)}>
      <LogoMark className={styles.mark} />
      <span
        className={
          markOnly
            ? 'sr-only'
            : cn(
                'leading-none font-extrabold tracking-[-0.01em] font-stretch-118%',
                tone === 'light' ? 'text-on-navy' : 'text-ink',
                styles.wordmark,
              )
        }
      >
        {APP_NAME}
      </span>
    </span>
  );
}
