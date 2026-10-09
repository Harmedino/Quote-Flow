import { cn } from '@/lib/cn';

/** Lets a row of tabs scroll sideways on phones instead of wrapping or overflowing the page. */
export const TAB_SCROLLER_CLASSES = 'no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0';

/** The underlined row shared by status filters and section navigation. */
export const TAB_LIST_CLASSES = 'flex min-w-max gap-5 border-b border-stone-200';

export function tabClasses(selected: boolean): string {
  return cn(
    '-mb-px inline-flex h-10 items-center gap-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-offset-[-2px]',
    selected
      ? 'border-brand-600 text-stone-900'
      : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800',
  );
}
