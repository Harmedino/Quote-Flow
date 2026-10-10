/**
 * Shared look for text inputs, textareas and selects. The border is darker than the card
 * borders on purpose: a field's edge needs 3:1 contrast to be recognisable as a field.
 */
export const CONTROL_CLASSES =
  'block w-full rounded-lg border border-stone-500/80 bg-surface px-3 text-base text-stone-900 transition-colors placeholder:text-stone-500 sm:text-sm focus-visible:border-brand-500 focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-brand-500/30 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 aria-invalid:border-red-500 aria-invalid:focus-visible:border-red-500 aria-invalid:focus-visible:outline-red-500/25';
