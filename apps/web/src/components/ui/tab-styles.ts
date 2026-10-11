import { cn } from '@/lib/cn';

/** Lets a row of tabs scroll sideways on phones instead of wrapping or overflowing the page. */
export const TAB_SCROLLER_CLASSES = 'no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0';

/** The row shared by status filters and section navigation, on a hairline. */
export const TAB_LIST_CLASSES = 'flex min-w-max gap-1 border-b border-line';

/**
 * A tab with the top bar's look: muted until selected, then navy with a 4px orange marker flush
 * with the hairline. Put a CountChip after the label for a count.
 */
export function tabClasses(selected: boolean): string {
  return cn(
    'relative -mb-px inline-flex h-11 items-center gap-2 px-3 text-[14.5px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-offset-[-2px] [&_svg]:size-4',
    'after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-t-[3px]',
    selected
      ? 'text-ink after:animate-marker-in after:bg-primary'
      : 'text-muted after:bg-transparent hover:text-ink hover:after:bg-line-strong',
  );
}
