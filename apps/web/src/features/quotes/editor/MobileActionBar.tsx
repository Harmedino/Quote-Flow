import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface MobileActionBarProps {
  /** The live total, formatted; null when it can't be totalled. */
  total: string | null;
  /** Who it is for and how many items, e.g. "For Daniel Nguyen · 2 items". */
  detail: string;
  /** True when the phone tab bar is showing below it. */
  aboveTabBar?: boolean;
  /** The save buttons, main action last. */
  children: ReactNode;
  className?: string;
}

/**
 * The total and save buttons, floating at the bottom of the screen while the builder scrolls and
 * coming to rest under the last section. Used below the wide layout, which has a side panel.
 */
export function MobileActionBar({
  total,
  detail,
  aboveTabBar = false,
  children,
  className,
}: MobileActionBarProps) {
  return (
    <div
      className={cn(
        'sticky z-20 mt-6 rounded-2xl border border-stone-200 bg-surface/95 p-3 shadow-[var(--shadow-elevated)] backdrop-blur-md sm:px-4',
        aboveTabBar
          ? 'bottom-[calc(var(--spacing-tab-bar)+0.75rem)] lg:bottom-4'
          : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] lg:bottom-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-semibold tracking-tight text-stone-900 tabular-nums">
            {total ?? '—'}
          </p>
          <p className="truncate text-xs text-stone-500">{detail}</p>
        </div>
        <div className="flex gap-2.5 max-sm:w-full max-sm:[&>*]:flex-1">{children}</div>
      </div>
    </div>
  );
}
