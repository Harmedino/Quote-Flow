import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:shrink-0';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-300 ring-inset hover:bg-zinc-50 active:bg-zinc-100',
  ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200/70',
  danger:
    'bg-red-700 text-white shadow-xs hover:bg-red-800 active:bg-red-900 focus-visible:outline-red-700',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm [&_svg]:size-4',
  md: 'h-10 px-4 text-sm [&_svg]:size-4',
  lg: 'h-12 px-5 text-base [&_svg]:size-5',
};

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleProps & { className?: string }): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}
