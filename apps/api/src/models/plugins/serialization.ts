import type { Schema } from 'mongoose';

export interface SerializationOptions {
  /** Paths that must never leave the API, such as password hashes. */
  hidden?: readonly string[];
}

/**
 * Consistent `toJSON()`/`toObject()` output: a string `id` instead of `_id`,
 * no `__v`, ObjectIds as strings, and hidden paths removed. API responses use
 * explicit serializers; this is defence in depth against leaking a raw document.
 */
export function serialization(schema: Schema, { hidden = [] }: SerializationOptions = {}): void {
  const options = {
    virtuals: true,
    versionKey: false,
    flattenObjectIds: true,
    transform: (_document: unknown, output: Record<string, unknown>) => {
      delete output._id;
      for (const path of hidden) delete output[path];
      return output;
    },
  };
  schema.set('toJSON', options);
  schema.set('toObject', options);
}
