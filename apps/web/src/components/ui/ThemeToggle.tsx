import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTheme } from '@/lib/theme';

const TONES = {
  /** On ink: the sidebar, the mobile top bar and the marketing header. */
  ink: 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-highlight',
  /** On the page or a card. */
  default: 'border-stone-200 bg-surface text-stone-600 hover:bg-stone-100 hover:text-stone-900',
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
        'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-colors',
        TONES[tone],
        className,
      )}
    >
      {/* Keyed so the new icon spins in on every switch. */}
      <span key={theme} className="animate-spin-in">
        {dark ? (
          <Sun aria-hidden="true" className="size-4" />
        ) : (
          <Moon aria-hidden="true" className="size-4" />
        )}
      </span>
      <span className="sr-only">Dark mode</span>
    </button>
  );
}
