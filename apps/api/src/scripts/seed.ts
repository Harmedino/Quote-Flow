import { hashPassword } from '../utils/password';
import { runScript } from './run-script';
import { createSeedClock } from '../demo/clock';
import { replaceDemoBusiness } from '../demo/demo';
import { InvalidSeedPasswordError, resolveDemoPassword } from '../demo/password';
import { describeSeededTenant } from '../demo/summary';

/**
 * Development seed (`pnpm seed`): replaces the demo business, found through the
 * demo users' emails, with a realistic data set. Other businesses are never touched.
 * The demo password is random per run unless SEED_DEMO_PASSWORD is set.
 */
if (process.env.NODE_ENV?.trim() === 'production') {
  process.stderr.write(
    'Refusing to seed: NODE_ENV is "production". The seed is for development only.\n',
  );
  process.exit(1);
}

function resolveDemoPasswordOrExit() {
  try {
    return resolveDemoPassword();
  } catch (error) {
    if (!(error instanceof InvalidSeedPasswordError)) throw error;
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

const password = resolveDemoPasswordOrExit();

await runScript('Seed', async ({ logger }) => {
  const { tenant, invoices, replaced } = await replaceDemoBusiness(
    createSeedClock(),
    await hashPassword(password.value),
  );
  if (replaced) logger.info('Replaced the previous demo business');

  process.stdout.write(await describeSeededTenant(tenant, invoices, password));
});
