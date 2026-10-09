import { initials } from '@/features/auth/user-display';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Initials in a circle. Decorative: the name is always shown or announced next to it. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 ring-1 ring-brand-600/10 select-none',
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
