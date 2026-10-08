import { randomBytes } from 'node:crypto';
import { hashPassword } from '../utils/password';
import { runScript } from './run-script';
import { createSeedClock } from './seed/clock';
import { replaceDemoBusiness } from './seed/demo';
import { describeSeededTenant } from './seed/summary';

/**
 * Development seed (`pnpm seed`): replaces the demo business, found through its
 * owner's email, with a realistic data set. Other businesses are never touched.
 * The demo password is random per run so no known credential is ever created.
 */
if (process.env.NODE_ENV?.trim() === 'production') {
  process.stderr.write(
    'Refusing to seed: NODE_ENV is "production". The seed is for development only.\n',
  );
  process.exit(1);
}

await runScript('Seed', async ({ logger }) => {
  const password = randomBytes(12).toString('base64url');
  const { tenant, invoices, replaced } = await replaceDemoBusiness(
    createSeedClock(),
    await hashPassword(password),
  );
  if (replaced) logger.info('Replaced the previous demo business');

  process.stdout.write(await describeSeededTenant(tenant, invoices, password));
});
