import type { Model } from 'mongoose';

type IndexedModel = Pick<Model<unknown>, 'modelName' | 'createIndexes' | 'diffIndexes'>;

export interface IndexReport {
  model: string;
  /** The first error raised while building the declared indexes. The others are still attempted. */
  error?: unknown;
  /** Declared indexes that do not exist after the build, i.e. whose creation failed. */
  missing: string[];
  /** Indexes in the database that the schema no longer declares. Reported, never dropped. */
  undeclared: string[];
}

async function buildModelIndexes(model: IndexedModel): Promise<IndexReport> {
  let error: unknown;
  try {
    await model.createIndexes();
  } catch (buildError) {
    error = buildError;
  }

  const { toCreate, toDrop } = await model.diffIndexes();
  return {
    model: model.modelName,
    ...(error !== undefined && { error }),
    missing: toCreate.map((index: unknown) => JSON.stringify(index)),
    undeclared: toDrop.map((name: unknown) => String(name)),
  };
}

export interface MissingIndexes {
  model: string;
  /** Declared index specs that do not exist in the database, as JSON. */
  missing: string[];
}

/**
 * Lists the declared indexes that do not exist in the database, per model,
 * without changing anything. Models whose indexes are all present are omitted.
 */
export async function findMissingIndexes(
  models: readonly Pick<IndexedModel, 'modelName' | 'diffIndexes'>[],
): Promise<MissingIndexes[]> {
  const results: MissingIndexes[] = [];
  for (const model of models) {
    const { toCreate } = await model.diffIndexes();
    if (toCreate.length > 0) {
      results.push({
        model: model.modelName,
        missing: toCreate.map((index: unknown) => JSON.stringify(index)),
      });
    }
  }
  return results;
}

/**
 * Creates every index the given models declare. Non-destructive: an index
 * that exists with different options fails to build (and is reported) instead
 * of being dropped and rebuilt, and indexes no longer declared are only reported.
 * Production disables autoIndex, so this is how indexes reach the database.
 */
export async function buildDeclaredIndexes(
  models: readonly IndexedModel[],
): Promise<IndexReport[]> {
  const reports: IndexReport[] = [];
  for (const model of models) {
    reports.push(await buildModelIndexes(model));
  }
  return reports;
}
