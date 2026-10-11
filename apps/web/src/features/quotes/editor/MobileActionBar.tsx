import type { ReactNode } from 'react';
import { bottomBarClearance } from '@/components/bottom-bar-clearance';
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
 * The live total as a ticket stub with the save buttons torn off beside it (below it on phones),
 * floating at the bottom of the screen while the builder scrolls and coming to rest under the
 * last section. Used below the wide layout, which has a side panel.
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
      ref={bottomBarClearance}
      className={cn(
        'sticky z-20 mt-6 lift-high max-sm:ticket-col sm:ticket-row',
        aboveTabBar
          ? 'bottom-[calc(var(--spacing-tab-bar)+0.75rem)] lg:bottom-4'
          : 'bottom-[max(0.75rem,env(safe-area-inset-bottom))] lg:bottom-4',
        className,
      )}
    >
      <div className="min-w-0 bg-primary-tint px-4 py-2.5 sm:flex sm:max-w-[45%] sm:flex-none sm:flex-col sm:justify-center sm:pr-6">
        <p className="figure text-[1.375rem] text-ink">{total ?? '—'}</p>
        <p className="mt-1 truncate text-[12.5px] text-ink-2">{detail}</p>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-3 max-sm:[&>*]:flex-1 sm:justify-end sm:px-4">
        {children}
      </div>
    </div>
  );
}
