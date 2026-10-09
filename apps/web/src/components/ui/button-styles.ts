import { cn } from '@/lib/cn';

export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'highlight' | 'on-ink' | 'ink';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'icon';
export type ButtonShape = 'rounded' | 'pill';

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `pill` gives fully rounded ends, as on the marketing pages. */
  shape?: ButtonShape;
}

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:shrink-0';

const VARIANTS: Record<ButtonVariant, string> = {
  // brand-700 lightens in dark mode, so the dark hover brightens brand-600 instead.
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:hover:bg-brand-600 dark:hover:brightness-110 dark:active:brightness-95',
  secondary:
    'border border-stone-300 bg-surface text-stone-700 hover:bg-stone-50 hover:text-stone-900 active:bg-stone-100',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200/70',
  danger:
    'bg-red-700 text-white hover:bg-red-800 active:bg-red-900 focus-visible:outline-red-600 dark:bg-red-600 dark:hover:bg-red-500 dark:active:bg-red-600',
  /** A quieter destructive action, e.g. "Delete draft" below the main actions. */
  'danger-ghost':
    'text-red-700 hover:bg-red-50 hover:text-red-800 active:bg-red-100 focus-visible:outline-red-600',
  /** The lime call to action, only on ink backgrounds (sidebar, dark sections). */
  highlight:
    'bg-highlight font-semibold text-ink hover:bg-highlight-soft active:bg-highlight focus-visible:outline-highlight',
  /** A quiet outlined action on ink backgrounds. */
  'on-ink':
    'border border-white/20 text-white hover:bg-white/10 active:bg-white/15 focus-visible:outline-highlight',
  /** The website's main action on paper: ink, and lime in dark mode, where the page is ink. */
  ink: 'bg-ink text-white hover:bg-ink-700 active:bg-ink-800 dark:bg-highlight dark:font-semibold dark:text-ink dark:hover:bg-highlight-soft dark:active:bg-highlight',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
  md: 'h-10 px-4 text-sm [&_svg]:size-4',
  lg: 'h-11 px-5 text-[0.9375rem] [&_svg]:size-4',
  /** The marketing pages' large calls to action. */
  xl: 'h-12 px-6 text-[0.9375rem] [&_svg]:size-4',
  /** A square button holding only an icon; give it an accessible name. */
  icon: 'size-9 text-sm [&_svg]:size-4',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  className,
}: ButtonStyleProps & { className?: string }): string {
  return cn(
    BASE,
    shape === 'pill' ? 'rounded-full' : 'rounded-lg',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
