import {
  type Aggregate,
  type AnyBulkWriteOperation,
  type HydratedDocument,
  type Model,
  type MongooseBulkWriteOptions,
  type MongooseDefaultQueryMiddleware,
  type Query,
  Schema,
  type Types,
} from 'mongoose';
import {
  TENANT_FIELD,
  bulkOperationViolation,
  isTenantScoped,
  isTenantScopedPipeline,
  pipelineViolation,
  replacementKeepsTenant,
  updateChangesTenant,
} from './tenant-scope';

declare module 'mongoose' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match Mongoose's declaration to merge
  interface QueryOptions<DocType = unknown> {
    /**
     * Lets a query on a tenant-owned model run without a businessId filter.
     * Only for deliberate cross-tenant lookups (login by email, public quote by token).
     * updateOne/updateMany narrow their option types, so pass it there with `.setOptions()`.
     */
    skipTenantGuard?: boolean;
  }
  interface AggregateOptions {
    skipTenantGuard?: boolean;
  }
  interface MongooseBulkWriteOptions {
    skipTenantGuard?: boolean;
  }
}

/** Every document of a tenant-owned model belongs to exactly one Business. */
export interface TenantOwned {
  businessId: Types.ObjectId;
}

/**
 * A query that could read or change another tenant's data. This is always a
 * programming error: it surfaces as a generic 500 and the message names only
 * the operation and model, never query values.
 */
export class TenantGuardError extends Error {
  constructor(message: string) {
    super(`Tenant guard: ${message}`);
    this.name = 'TenantGuardError';
  }
}

const SCOPED_QUERY_OPERATIONS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'updateOne',
  'updateMany',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'countDocuments',
  'distinct',
] as const satisfies readonly MongooseDefaultQueryMiddleware[];

type ScopedQueryOperation = (typeof SCOPED_QUERY_OPERATIONS)[number];

const UPDATE_OPERATIONS: ReadonlySet<ScopedQueryOperation> = new Set([
  'findOneAndUpdate',
  'updateOne',
  'updateMany',
]);
const REPLACE_OPERATIONS: ReadonlySet<ScopedQueryOperation> = new Set([
  'findOneAndReplace',
  'replaceOne',
]);

type AnyQuery = Query<unknown, unknown>;

/**
 * Mongoose skips user middleware when a call passes `{ middleware: false }`,
 * except hooks flagged with this registered symbol. Flagging the guard keeps
 * that generic option from bypassing tenant isolation; a test fails if a
 * Mongoose upgrade changes this.
 */
const BUILT_IN_MIDDLEWARE = Symbol.for('mongoose:built-in-middleware');

export function unskippable<Hook extends object>(hook: Hook): Hook {
  return Object.assign(hook, { [BUILT_IN_MIDDLEWARE]: true });
}

function assertQueryIsSafe(query: AnyQuery, operation: ScopedQueryOperation): void {
  const target = `${operation} on ${query.model.modelName}`;
  const filter = query.getFilter();

  if (query.getOptions().skipTenantGuard !== true && !isTenantScoped(filter)) {
    throw new TenantGuardError(`${target} must filter by businessId`);
  }
  if (UPDATE_OPERATIONS.has(operation) && updateChangesTenant(query.getUpdate())) {
    throw new TenantGuardError(`${target} must not change businessId`);
  }
  if (REPLACE_OPERATIONS.has(operation) && !replacementKeepsTenant(filter, query.getUpdate())) {
    throw new TenantGuardError(
      `${target} must filter by businessId and keep it in the replacement`,
    );
  }
}

function guardQuery(operation: ScopedQueryOperation) {
  return unskippable(function (this: AnyQuery) {
    assertQueryIsSafe(this, operation);
  });
}

const guardEstimatedDocumentCount = unskippable(function (this: AnyQuery) {
  if (this.getOptions().skipTenantGuard === true) return;
  throw new TenantGuardError(
    `estimatedDocumentCount on ${this.model.modelName} cannot be scoped; use countDocuments with businessId`,
  );
});

const guardAggregate = unskippable(function (this: Aggregate<unknown>) {
  if (this.options.skipTenantGuard === true) return;
  const modelName = this.model().modelName;
  const pipeline = this.pipeline();
  if (!isTenantScopedPipeline(pipeline)) {
    throw new TenantGuardError(`aggregate on ${modelName} must start with a $match on businessId`);
  }
  const violation = pipelineViolation(pipeline);
  if (violation) throw new TenantGuardError(`aggregate on ${modelName}: ${violation}`);
});

const guardBulkWrite = unskippable(function (
  this: Model<unknown>,
  operations: readonly AnyBulkWriteOperation[],
  options?: MongooseBulkWriteOptions,
) {
  const requireScope = options?.skipTenantGuard !== true;
  for (const operation of operations) {
    const violation = bulkOperationViolation(operation, requireScope);
    if (violation) throw new TenantGuardError(`bulkWrite on ${this.modelName}: ${violation}`);
  }
});

const guardedSchemas = new WeakSet<Schema>();

/** Whether `tenantGuard` was applied to the schema. */
export function isTenantGuarded(schema: Schema): boolean {
  return guardedSchemas.has(schema);
}

const scopeDocumentWrite = unskippable(function (this: HydratedDocument<TenantOwned>) {
  // Not loaded when a projection excluded it; the query guard then rejects deleteOne/updateOne.
  if (this.businessId == null) return;
  this.$where = { ...this.$where, [TENANT_FIELD]: this.businessId };
});

/**
 * Tenant isolation for a tenant-owned schema. Apply it explicitly to every
 * schema whose documents belong to a Business (never to Business itself).
 *
 * - Adds the required, immutable `businessId` path.
 * - Every query must filter on a top-level businessId (an id, `$eq` or `$in`).
 *   Note `findById(id)` is `findOne({ _id })` and is rejected: use
 *   `findOne({ _id, businessId })`. Populating a tenant-owned path needs
 *   `match: { businessId }`, which also stops a forged reference from
 *   resolving to another tenant's document.
 * - `estimatedDocumentCount` cannot be scoped and is rejected.
 * - Aggregations must start with a `$match` on businessId. `$out`, `$merge` and
 *   `$graphLookup` are rejected, and `$lookup`/`$unionWith` (also inside
 *   `$facet`) must use a sub-pipeline that starts with a `$match` on businessId.
 * - bulkWrite operations are checked one by one.
 * - Updates may never set, unset or rename businessId, and replacements must
 *   keep it, even when the guard is skipped.
 * - Document `deleteOne()`/`updateOne()`/`save()` add the document's own
 *   businessId to their filter.
 *
 * Opt out per query with the greppable option `{ skipTenantGuard: true }`.
 * Writes through `Model.collection` bypass Mongoose and therefore this guard.
 */
export function tenantGuard(schema: Schema): void {
  if (schema.path(TENANT_FIELD)) {
    throw new Error(`tenantGuard adds "${TENANT_FIELD}" itself; remove it from the schema`);
  }
  schema.add({
    [TENANT_FIELD]: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      immutable: true,
    },
  });

  for (const operation of SCOPED_QUERY_OPERATIONS) {
    schema.pre(operation, guardQuery(operation));
  }
  schema.pre('estimatedDocumentCount', guardEstimatedDocumentCount);
  schema.pre('aggregate', guardAggregate);
  schema.pre('bulkWrite', guardBulkWrite);
  schema.pre(
    ['save', 'updateOne', 'deleteOne'],
    { document: true, query: false },
    scopeDocumentWrite,
  );
  guardedSchemas.add(schema);
}
