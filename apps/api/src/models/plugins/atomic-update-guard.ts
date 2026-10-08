import type {
  AnyBulkWriteOperation,
  Model,
  MongooseBulkWriteOptions,
  Query,
  Schema,
} from 'mongoose';
import { unskippable } from './tenant-guard';
import { updateTouchesPaths } from './tenant-scope';

declare module 'mongoose' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match Mongoose's declaration to merge
  interface QueryOptions<DocType = unknown> {
    /**
     * Lets updateOne/updateMany/findOneAndUpdate run on a model guarded by
     * atomicUpdateGuard, for paths that feed no derived value (e.g. a status
     * change). updateOne/updateMany narrow their option types, so pass it
     * there with `.setOptions()`.
     */
    allowAtomicUpdate?: boolean;
  }
  interface MongooseBulkWriteOptions {
    allowAtomicUpdate?: boolean;
  }
}

/** Paths whose values are derived in pre('validate'), or that derived values are calculated from. */
const DERIVED_PATHS = [
  'items',
  'discount',
  'taxRate',
  'totals',
  'currency',
  'payments',
  'amountPaid',
  'balanceDue',
] as const;

const VERSION_KEY = '__v';

function isDerivedPath(path: string): boolean {
  return DERIVED_PATHS.some((derived) => path === derived || path.startsWith(`${derived}.`));
}

/**
 * An atomic update that would bypass a document's derived values or its
 * optimistic concurrency. Always a programming error, reported as a generic 500.
 */
export class AtomicUpdateGuardError extends Error {
  constructor(message: string) {
    super(`Atomic update guard: ${message}`);
    this.name = 'AtomicUpdateGuardError';
  }
}

interface AtomicUpdateOptions {
  allowAtomicUpdate?: boolean;
  upsert?: boolean;
  overwriteImmutable?: boolean;
}

function atomicUpdateViolation(update: unknown, options: AtomicUpdateOptions): string | undefined {
  if (options.allowAtomicUpdate !== true) {
    return 'must load and save the document, or pass allowAtomicUpdate';
  }
  // An upsert would insert a document whose derived values were never calculated.
  if (options.upsert === true) return 'cannot upsert; create the document instead';
  // Would rewrite immutable fields such as document numbers or the converted-quote link.
  if (options.overwriteImmutable === true) return 'cannot overwrite immutable fields';
  if (Array.isArray(update)) return 'cannot use an update pipeline';
  if (updateTouchesPaths(update, isDerivedPath)) {
    return 'must not change items, discount, taxRate, totals, currency or payments; load and save the document instead';
  }
  return undefined;
}

/** Bumping the version makes a concurrent save() of a stale copy fail with a VersionError. */
function withVersionIncrement(update: unknown): Record<string, unknown> {
  const { $inc, ...rest } = (update ?? {}) as Record<string, unknown>;
  const increments = typeof $inc === 'object' && $inc !== null ? $inc : {};
  return { ...rest, $inc: { ...increments, [VERSION_KEY]: 1 } };
}

function guardUpdate(operation: string) {
  return unskippable(function (this: Query<unknown, unknown>) {
    const update = this.getUpdate();
    const { allowAtomicUpdate, upsert } = this.getOptions();
    const violation = atomicUpdateViolation(update, {
      allowAtomicUpdate,
      upsert,
      overwriteImmutable: this.mongooseOptions().overwriteImmutable,
    });
    if (violation) {
      throw new AtomicUpdateGuardError(`${operation} on ${this.model.modelName} ${violation}`);
    }
    this.setUpdate(withVersionIncrement(update));
  });
}

function rejectReplace(operation: string) {
  return unskippable(function (this: Query<unknown, unknown>) {
    throw new AtomicUpdateGuardError(
      `${operation} on ${this.model.modelName} would bypass derived values; load and save the document instead`,
    );
  });
}

const guardBulkWrite = unskippable(function (
  this: Model<unknown>,
  operations: readonly AnyBulkWriteOperation[],
  options?: MongooseBulkWriteOptions,
) {
  const allowed = options?.allowAtomicUpdate === true;
  for (const operation of operations) {
    if ('replaceOne' in operation) {
      throw new AtomicUpdateGuardError(`bulkWrite on ${this.modelName}: replaceOne is not allowed`);
    }
    const spec =
      'updateOne' in operation
        ? operation.updateOne
        : 'updateMany' in operation
          ? operation.updateMany
          : undefined;
    if (!spec) continue;

    const violation = atomicUpdateViolation(spec.update, {
      allowAtomicUpdate: allowed,
      upsert: spec.upsert,
    });
    if (violation) throw new AtomicUpdateGuardError(`bulkWrite on ${this.modelName}: ${violation}`);
    spec.update = withVersionIncrement(spec.update);
  }
});

/**
 * For documents whose totals and balances are derived in pre('validate')
 * (quotes and invoices), which only load-modify-save keeps correct.
 *
 * - updateOne/updateMany/findOneAndUpdate (and bulkWrite updates) are rejected
 *   unless the query passes `allowAtomicUpdate: true`. Even then they may not
 *   upsert, overwrite immutable fields, use an update pipeline or touch items,
 *   discount, taxRate, totals, currency or payments, and they increment the version key, so a
 *   concurrent save() of a stale copy fails with a VersionError.
 * - replaceOne/findOneAndReplace (and bulkWrite replaceOne) are always rejected.
 *
 * save(), create, insertMany and deletes are not affected.
 */
export function atomicUpdateGuard(schema: Schema): void {
  for (const operation of ['updateOne', 'updateMany', 'findOneAndUpdate'] as const) {
    schema.pre(operation, guardUpdate(operation));
  }
  for (const operation of ['replaceOne', 'findOneAndReplace'] as const) {
    schema.pre(operation, rejectReplace(operation));
  }
  schema.pre('bulkWrite', guardBulkWrite);
}
