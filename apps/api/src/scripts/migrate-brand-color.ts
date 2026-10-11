import { DEFAULT_BRAND_COLOR } from '@quoteflow/shared';
import { BusinessModel } from '../models';
import { runScript } from './run-script';

/** The default brand colour before the Signal identity: ServiceBook's near-black ink. */
const RETIRED_DEFAULT_BRAND_COLOR = '#0c1a14';

/**
 * One-off (`pnpm db:migrate-brand-color`): businesses created before the Signal identity were
 * given the retired default as their brand colour. This moves them to today's default, so their
 * documents, customer pages and PDFs stop showing the old ink. Running it again changes nothing.
 */
await runScript('Brand colour migration', async ({ logger }) => {
  const { matchedCount, modifiedCount } = await BusinessModel.updateMany(
    { brandColor: RETIRED_DEFAULT_BRAND_COLOR },
    { $set: { brandColor: DEFAULT_BRAND_COLOR } },
  );
  logger.info(
    { matched: matchedCount, updated: modifiedCount, brandColor: DEFAULT_BRAND_COLOR },
    'Moved businesses off the retired default brand colour',
  );
});
