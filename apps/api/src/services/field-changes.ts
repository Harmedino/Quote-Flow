/** A field to change: its dotted path and new value, where `undefined` removes it. */
export type FieldChange = readonly [path: string, value: unknown];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns a validated PATCH body into document changes. Omitted fields are left
 * alone and '' clears an optional field. Nested objects (such as an address)
 * are applied part by part, so a partial address keeps the parts it omits.
 */
export function toFieldChanges(input: Record<string, unknown>, prefix = ''): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const [key, value] of Object.entries(input)) {
    const path = `${prefix}${key}`;
    if (value === undefined) continue;
    if (isPlainObject(value)) changes.push(...toFieldChanges(value, `${path}.`));
    else changes.push([path, value === '' ? undefined : value]);
  }
  return changes;
}

/** The fields of a create body that have a value: '' and undefined are dropped. */
export function withoutBlankFields<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>;
}
