import { APP_NAME } from '@/app/constants';
import { cn } from '@/lib/cn';

/** The same file serves as the favicon, so the mark has a single source. */
const MARK_URL = `${import.meta.env.BASE_URL}favicon.svg`;

const SIZES = {
  sm: { mark: 'size-5', wordmark: 'text-sm', gap: 'gap-1.5' },
  md: { mark: 'size-7', wordmark: 'text-[1.0625rem]', gap: 'gap-2.5' },
} as const;

export interface LogoProps {
  size?: keyof typeof SIZES;
  /** Show only the mark; the name stays available to screen readers. */
  markOnly?: boolean;
  className?: string;
}

export function Logo({ size = 'md', markOnly = false, className }: LogoProps) {
  const styles = SIZES[size];
  return (
    <span className={cn('inline-flex items-center', styles.gap, className)}>
      <img src={MARK_URL} alt="" className={cn('shrink-0', styles.mark)} />
      <span
        className={
          markOnly ? 'sr-only' : cn('font-semibold tracking-tight text-zinc-950', styles.wordmark)
        }
      >
        {APP_NAME}
      </span>
    </span>
  );
}
