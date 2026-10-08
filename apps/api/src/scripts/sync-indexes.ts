import { buildDeclaredIndexes } from '../db/indexes';
import { ALL_MODELS } from '../models';
import { runScript } from './run-script';

/**
 * Builds every declared index (`pnpm db:indexes`, or `db:indexes:prod` with the
 * built bundle on deploy). Exits non-zero when an index could not be built.
 */
await runScript('Index build', async ({ logger }) => {
  const reports = await buildDeclaredIndexes(ALL_MODELS);

  for (const { model, error, missing, undeclared } of reports) {
    if (error !== undefined || missing.length > 0) {
      logger.error({ model, err: error, missing }, `Indexes for ${model} could not all be built`);
    } else {
      logger.info({ model }, `Indexes for ${model} are up to date`);
    }
    if (undeclared.length > 0) {
      logger.warn(
        { model, undeclared },
        `${model} has indexes that are no longer declared; review and drop them manually`,
      );
    }
  }

  return reports.every((report) => report.error === undefined && report.missing.length === 0);
});
