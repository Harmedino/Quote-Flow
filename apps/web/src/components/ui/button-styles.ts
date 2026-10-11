import { cn } from '@/lib/cn';

export type ButtonVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-ghost' | 'on-navy';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';
export type ButtonShape = 'rounded' | 'ticket';

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `ticket` cuts side notches into the ends, like the phone's New quote key. */
  shape?: ButtonShape;
}

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-[650] font-stretch-105% tracking-[-0.005em] whitespace-nowrap select-none transition-[background-color,color,box-shadow,filter] duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:stroke-[2.25]';

const VARIANTS: Record<ButtonVariant, string> = {
  /** Hi-vis orange with navy text (never white), and a pressed edge along the bottom. */
  primary:
    'bg-primary text-on-primary shadow-[inset_0_-2px_0_rgb(14_27_51/0.22),0_1px_2px_rgb(14_27_51/0.12)] hover:bg-primary-hover active:shadow-[inset_0_2px_0_rgb(14_27_51/0.18)] dark:shadow-[inset_0_-2px_0_rgb(0_0_0/0.25)]',
  /** Ticket stock with a hairline ring: most actions beside the primary one. */
  secondary:
    'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)] hover:bg-surface-muted active:bg-canvas-deep',
  /** Ticket stock with a navy ring, for a strong second action (e.g. "Try the live demo"). */
  outline:
    'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)] hover:bg-surface-muted active:bg-canvas-deep',
  ghost: 'text-ink-2 hover:bg-surface-muted hover:text-ink active:bg-canvas-deep',
  danger:
    'bg-danger-fill text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.2)] hover:brightness-110 active:brightness-95',
  /** A quieter destructive action, e.g. "Delete draft" below the main actions. */
  'danger-ghost': 'text-danger hover:bg-danger-tint active:bg-danger-tint',
  /** A quiet outlined action on a navy band. */
  'on-navy':
    'text-on-navy shadow-[inset_0_0_0_1.5px_rgb(245_241_232/0.4)] hover:bg-white/10 active:bg-white/15',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
  md: 'h-10.5 px-4 text-[14.5px] [&_svg]:size-[17px]',
  lg: 'h-12 px-5 text-[15.5px] [&_svg]:size-[18px]',
  /** The website's large calls to action. */
  xl: 'h-13.5 px-6 text-[16.5px] [&_svg]:size-[19px]',
  /** A square button holding only an icon; give it an accessible name. */
  icon: 'size-10 text-sm [&_svg]:size-[18px]',
};

const RADII: Record<ButtonSize, string> = {
  sm: 'rounded-lg',
  md: 'rounded-lg',
  lg: 'rounded-[10px]',
  xl: 'rounded-[10px]',
  icon: 'rounded-[9px]',
};

function shapeClasses(shape: ButtonShape, size: ButtonSize): string {
  return cn(RADII[size], shape === 'ticket' && 'notch-mid [--notch:5px]');
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  className,
}: ButtonStyleProps & { className?: string }): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], shapeClasses(shape, size), className);
}
