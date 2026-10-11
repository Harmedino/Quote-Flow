import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';

const TONES = {
  /** On a navy band. */
  ink: 'text-on-navy/85 shadow-[inset_0_0_0_1px_rgb(245_241_232/0.25)] hover:bg-white/10 hover:text-on-navy',
  /** On the page, a card or the top bar. */
  default:
    'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-surface-muted hover:text-ink',
} as const;

export interface ThemeToggleProps {
  tone?: keyof typeof TONES;
  className?: string;
}

/** Switches between light and dark mode. Every toggle on the page shares one theme. */
export function ThemeToggle({ tone = 'default', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[9px] transition-colors',
        TONES[tone],
        className,
      )}
    >
      {/* Keyed so the new icon spins in on every switch. */}
      <span key={theme} className="animate-spin-in">
        {dark ? (
          <Sun aria-hidden="true" className="size-[18px]" />
        ) : (
          <Moon aria-hidden="true" className="size-[18px]" />
        )}
      </span>
      <span className="sr-only">Dark mode</span>
    </button>
  );
}
