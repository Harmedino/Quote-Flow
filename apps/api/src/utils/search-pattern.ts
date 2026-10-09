/** Escapes every regular-expression metacharacter, so user input only ever matches literally. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
}

/** A case-insensitive "contains" pattern for user-typed search text. */
export function containsPattern(search: string): RegExp {
  return new RegExp(escapeRegex(search), 'i');
}

const PHONE_SEARCH = /^\+?[\d\s().-]+$/;
const PHONE_SEPARATORS = '[\\s().-]*';

/**
 * A pattern that finds a phone number however it was formatted: "5550101"
 * matches "+1 (555) 010-1". Null unless the search looks like part of a phone
 * number with at least three digits.
 */
export function phoneDigitsPattern(search: string): RegExp | null {
  if (!PHONE_SEARCH.test(search)) return null;
  const digits = search.replace(/\D/g, '');
  if (digits.length < 3) return null;
  return new RegExp(digits.split('').join(PHONE_SEPARATORS));
}
