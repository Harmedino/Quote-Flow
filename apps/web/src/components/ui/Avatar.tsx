import { normalizeBrandColor, textColorOn } from '@/components/documents/brand-color';
import { businessInitials } from '@/components/documents/document-format';
import { initials } from '@/features/auth/user-display';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: { box: 'size-6 text-[10px]', square: 'rounded-md' },
  sm: { box: 'size-8 text-[11.5px]', square: 'rounded-lg' },
  md: { box: 'size-9 text-[12.5px]', square: 'rounded-[9px]' },
  lg: { box: 'size-12 text-base', square: 'rounded-xl' },
} as const;

// Six soft tiles with navy letters (paper letters in dark mode), see styles/index.css.
const PALETTE = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
] as const;

const TONES = {
  /** A tile picked from the name, so the same person always gets the same colour. */
  auto: '',
  /** Navy with paper letters, e.g. a person on a navy band. */
  navy: 'bg-navy text-on-navy',
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
  /** A business takes the first letters of its first two words, as on its documents ("LH"). */
  kind?: 'person' | 'business';
  /** Fills the tile with a business's brand colour (letters in white or navy, whichever reads). */
  brandColor?: string;
  /** `square` (default) is Signal's rounded tile; `circle` is available for photos-style use. */
  shape?: 'circle' | 'square';
  className?: string;
}

/** Initials on a coloured tile. Decorative: the name is always shown or announced next to it. */
export function Avatar({
  name,
  size = 'md',
  tone = 'auto',
  kind = 'person',
  brandColor,
  shape = 'square',
  className,
}: AvatarProps) {
  const brand = brandColor === undefined ? undefined : normalizeBrandColor(brandColor);
  return (
    <span
      aria-hidden="true"
      style={brand ? { backgroundColor: brand, color: textColorOn(brand) } : undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-[750] tracking-[0.02em] font-stretch-112% select-none',
        shape === 'square' ? SIZES[size].square : 'rounded-full',
        !brand && (tone === 'auto' ? cn(paletteFor(name), 'text-ink') : TONES[tone]),
        SIZES[size].box,
        className,
      )}
    >
      {kind === 'business' ? businessInitials(name) : initials(name) || '?'}
    </span>
  );
}
