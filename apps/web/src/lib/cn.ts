export type ClassValue = string | false | null | undefined;

/**
 * Joins class names, skipping falsy values. It does not resolve conflicting
 * Tailwind utilities, so components should avoid styling a property that
 * callers are expected to override through `className`.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
