/**
 * A modal <dialog> that is a bottom sheet on phones (like the Create and account sheets) and a
 * centred panel from `sm` up. Open it with showModal(); add `open:flex open:flex-col` for a
 * header/body/footer layout.
 */
export const DIALOG_CLASSES = [
  'm-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[1.25rem] border-0 bg-surface p-0 text-ink shadow-(--shadow-elevated) backdrop:bg-navy/50 open:animate-sheet-up open:backdrop:animate-fade-in',
  'sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)] sm:rounded-xl sm:open:animate-fade-in-up',
].join(' ');
