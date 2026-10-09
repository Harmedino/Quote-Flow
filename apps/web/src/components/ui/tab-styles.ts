import { cn } from '@/lib/cn';

/** Lets a row of tabs scroll sideways on phones instead of wrapping or overflowing the page. */
export const TAB_SCROLLER_CLASSES = '-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0';

/** The underlined row shared by status filters and section navigation. */
export const TAB_LIST_CLASSES = 'flex min-w-max gap-3 border-b border-zinc-200';

export function tabClasses(selected: boolean): string {
  return cn(
    '-mb-px inline-flex h-10 items-center border-b-2 px-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-offset-[-2px]',
    selected
      ? 'border-brand-600 text-brand-700'
      : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-950',
  );
}
