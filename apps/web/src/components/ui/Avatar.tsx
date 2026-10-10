import { initials } from '@/features/auth/user-display';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
} as const;

// Soft washes that keep their contrast in dark mode (see styles/index.css).
const PALETTE = [
  'bg-brand-100 text-brand-800',
  'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-stone-200 text-stone-700',
  'bg-emerald-100 text-emerald-800',
] as const;

const TONES = {
  /** A colour picked from the name, so the same person always gets the same tile. */
  auto: '',
  /** Lime on ink, for the sidebar and other dark surfaces. */
  highlight: 'bg-highlight text-ink',
  /** Ink with a lime letter, e.g. the business tile on a light surface. */
  ink: 'bg-ink text-highlight dark:bg-ink-700',
} as const;

function paletteFor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % PALETTE.length;
  }
  return PALETTE[hash] ?? PALETTE[0];
}

export interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  /** `square` is a rounded tile, used for businesses; people get a circle. */
  shape?: 'circle' | 'square';
  className?: string;
}

/** Initials on a coloured tile. Decorative: the name is always shown or announced next to it. */
export function Avatar({
  name,
  size = 'md',
  tone = 'auto',
  shape = 'circle',
  className,
}: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold select-none',
        shape === 'square' ? 'rounded-xl' : 'rounded-full',
        tone === 'auto' ? paletteFor(name) : TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {initials(name) || '?'}
    </span>
  );
}
