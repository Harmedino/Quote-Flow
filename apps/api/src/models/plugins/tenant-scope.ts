import { objectIdSchema } from '@quoteflow/shared';
import { Types } from 'mongoose';

/** The field that ties a document to its tenant (the owning Business). */
export const TENANT_FIELD = 'businessId';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isTenantId(value: unknown): boolean {
  return value instanceof Types.ObjectId || objectIdSchema.safeParse(value).success;
}

/** Only an exact id, `{ $eq: id }` or `{ $in: [id, …] }` pins a query to specific tenants. */
function isTenantCondition(condition: unknown): boolean {
  if (isTenantId(condition)) return true;
  if (!isPlainObject(condition) || Object.keys(condition).length !== 1) return false;
  if ('$eq' in condition) return isTenantId(condition.$eq);
  const ids = condition.$in;
  return Array.isArray(ids) && ids.length > 0 && ids.every(isTenantId);
}

function normalizeTenantId(value: unknown): string | undefined {
  return isTenantId(value) ? String(value).toLowerCase() : undefined;
}

/** The single tenant a filter condition selects, if it selects exactly one. */
function singleTenantId(condition: unknown): string | undefined {
  return normalizeTenantId(isPlainObject(condition) ? condition.$eq : condition);
}

/**
 * Whether a filter is restricted to specific tenants by a top-level
 * `businessId` condition. Conditions nested in `$and`/`$or` are not
 * recognised, and operators such as `$exists` or `$ne` do not scope a query.
 */
export function isTenantScoped(filter: unknown): boolean {
  return isPlainObject(filter) && isTenantCondition(filter[TENANT_FIELD]);
}

function isTenantPath(path: string): boolean {
  return path === TENANT_FIELD || path.startsWith(`${TENANT_FIELD}.`);
}

/**
 * Whether an update document would set, unset or rename a path that
 * `isProtectedPath` matches, under any operator (including `$rename` targets).
 * Aggregation-pipeline updates cannot be inspected reliably, so they count as touching it.
 */
export function updateTouchesPaths(
  update: unknown,
  isProtectedPath: (path: string) => boolean,
): boolean {
  if (update == null) return false;
  if (!isPlainObject(update)) return true;

  return Object.entries(update).some(([key, value]) => {
    if (!key.startsWith('$')) return isProtectedPath(key);
    if (!isPlainObject(value)) return false;
    return Object.entries(value).some(
      ([path, target]) =>
        isProtectedPath(path) ||
        (key === '$rename' && typeof target === 'string' && isProtectedPath(target)),
    );
  });
}

/** Whether an update document would set, unset or rename `businessId`. */
export function updateChangesTenant(update: unknown): boolean {
  return updateTouchesPaths(update, isTenantPath);
}

/** Whether a replacement document keeps the single tenant its filter selects. */
export function replacementKeepsTenant(filter: unknown, replacement: unknown): boolean {
  if (!isPlainObject(filter) || !isPlainObject(replacement)) return false;
  const filterTenant = singleTenantId(filter[TENANT_FIELD]);
  return (
    filterTenant !== undefined && normalizeTenantId(replacement[TENANT_FIELD]) === filterTenant
  );
}

/** Whether an aggregation pipeline starts with a `$match` stage scoped to a tenant. */
export function isTenantScopedPipeline(pipeline: readonly unknown[]): boolean {
  const [first] = pipeline;
  return isPlainObject(first) && isTenantScoped(first.$match);
}

/** Stages that write to, or traverse, other collections without a filter that can be checked. */
const FORBIDDEN_STAGES: ReadonlySet<string> = new Set(['$out', '$merge', '$graphLookup']);
/** Stages that read another collection through a sub-pipeline. */
const SUB_PIPELINE_STAGES: ReadonlySet<string> = new Set(['$lookup', '$unionWith']);

/**
 * Describes why a pipeline could reach beyond its tenant, or returns undefined
 * when it cannot. `$lookup` and `$unionWith` must use a sub-pipeline that
 * starts with a `$match` on businessId; `$facet` and sub-pipelines are checked
 * recursively. Messages name the stage operator only, never values.
 */
export function pipelineViolation(pipeline: readonly unknown[]): string | undefined {
  for (const stage of pipeline) {
    if (!isPlainObject(stage)) continue;
    for (const [operator, spec] of Object.entries(stage)) {
      if (FORBIDDEN_STAGES.has(operator)) return `${operator} is not allowed`;

      if (operator === '$facet' && isPlainObject(spec)) {
        for (const facet of Object.values(spec)) {
          const violation = Array.isArray(facet) ? pipelineViolation(facet) : undefined;
          if (violation) return violation;
        }
      }

      if (SUB_PIPELINE_STAGES.has(operator)) {
        // Covers the localField/foreignField form of $lookup and the `$unionWith: 'coll'` form.
        const subPipeline = isPlainObject(spec) ? spec.pipeline : undefined;
        if (!Array.isArray(subPipeline) || !isTenantScopedPipeline(subPipeline)) {
          return `${operator} must use a pipeline that starts with a $match on businessId`;
        }
        const violation = pipelineViolation(subPipeline);
        if (violation) return violation;
      }
    }
  }
  return undefined;
}

/** A bulkWrite operation as Mongoose receives it, e.g. `{ updateOne: { filter, update } }`. */
type BulkOperation = Record<string, unknown>;

/**
 * Describes why a bulkWrite operation would escape its tenant, or returns
 * undefined when it is safe. `requireScope: false` (skipTenantGuard) only
 * relaxes the filter requirement; businessId can never be changed.
 */
export function bulkOperationViolation(
  operation: BulkOperation,
  requireScope: boolean,
): string | undefined {
  const entries = Object.entries(operation);
  const [entry] = entries;
  if (entries.length !== 1 || entry === undefined) {
    return 'each bulkWrite operation must contain exactly one action';
  }
  const [name, rawSpec] = entry;
  const spec: Record<string, unknown> = isPlainObject(rawSpec) ? rawSpec : {};

  switch (name) {
    case 'insertOne': {
      const document = spec.document;
      return isPlainObject(document) && isTenantId(document[TENANT_FIELD])
        ? undefined
        : 'insertOne must set businessId';
    }
    case 'replaceOne':
      return replacementKeepsTenant(spec.filter, spec.replacement)
        ? undefined
        : 'replaceOne must filter by businessId and keep it in the replacement';
    case 'updateOne':
    case 'updateMany':
      if (requireScope && !isTenantScoped(spec.filter)) return `${name} must filter by businessId`;
      return updateChangesTenant(spec.update) ? `${name} must not change businessId` : undefined;
    case 'deleteOne':
    case 'deleteMany':
      return requireScope && !isTenantScoped(spec.filter)
        ? `${name} must filter by businessId`
        : undefined;
    default:
      return `unsupported bulkWrite operation ${name}`;
  }
}
