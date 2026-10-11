/**
 * Shared look for text inputs, textareas and selects. The edge is darker than the card hairlines
 * on purpose: a field's edge needs 3:1 contrast to be recognisable as a field. Focus turns it
 * orange-for-text and two pixels thick.
 */
export const CONTROL_CLASSES =
  'block w-full rounded-lg border border-edge bg-surface px-3 text-base text-ink transition-colors placeholder:text-muted sm:text-[14.5px] focus-visible:border-primary-ink focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-primary-ink disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted aria-invalid:border-danger aria-invalid:focus-visible:border-danger aria-invalid:focus-visible:outline-danger';
