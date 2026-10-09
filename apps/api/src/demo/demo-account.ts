import { randomBytes } from 'node:crypto';
import { isDuplicateKeyError } from '../db/errors';
import { type BusinessDocument, BusinessModel, type UserDocument, UserModel } from '../models';
import type { Clock } from '../utils/clock';
import type { Logger } from '../utils/logger';
import { hashPassword } from '../utils/password';
import { createSeedClock } from './clock';
import { DEMO_OWNER_EMAIL } from './data/business';
import { replaceDemoBusiness } from './demo';

/**
 * The shared demo business behind "Explore the demo" (only when
 * DEMO_LOGIN_ENABLED is set). It is created on first use and rebuilt once a
 * day, so visitors' edits don't accumulate and its dates stay relative to
 * today. Real businesses are never touched: the rebuild only removes the
 * business holding the demo users' emails, which sign-ups cannot use (see reset.ts).
 */

const DEMO_REFRESH_MS = 24 * 60 * 60 * 1000;

export interface DemoAccount {
  user: UserDocument;
  business: BusinessDocument;
}

async function findDemoAccount(): Promise<DemoAccount | undefined> {
  // Deliberately cross-tenant: the demo owner's email is all there is to go on.
  const user = await UserModel.findOne({ email: DEMO_OWNER_EMAIL, role: 'owner' }, null, {
    skipTenantGuard: true,
  });
  if (!user) return undefined;
  // Only a business the demo builder created, never one that merely uses the email.
  const business = await BusinessModel.findOne({ _id: user.businessId, isDemo: true });
  return business ? { user, business } : undefined;
}

const isFresh = (account: DemoAccount, clock: Clock) =>
  clock().getTime() - account.business.updatedAt.getTime() < DEMO_REFRESH_MS;

async function rebuildDemoBusiness(clock: Clock, log: Logger): Promise<void> {
  // Nobody signs in to the demo with a password, so it gets an unguessable one.
  const passwordHash = await hashPassword(randomBytes(32).toString('base64url'));
  try {
    const { tenant } = await replaceDemoBusiness(createSeedClock(clock()), passwordHash);
    // The demo business is backdated (Mongoose then backdates updatedAt too), so stamp
    // the rebuild time explicitly: it is what decides when the next rebuild is due.
    await BusinessModel.updateOne(
      { _id: tenant.business._id },
      { $set: { updatedAt: clock() } },
      { timestamps: false },
    );
  } catch (error) {
    // Most likely another instance rebuilt it at the same moment; its demo is just as good.
    if (!isDuplicateKeyError(error)) throw error;
    log.warn(
      { err: error, event: 'demo.rebuild_collided' },
      'Another demo rebuild got there first',
    );
  }
}

let rebuilding: Promise<void> | undefined;

export async function ensureDemoAccount(clock: Clock, log: Logger): Promise<DemoAccount> {
  const existing = await findDemoAccount();
  if (existing && isFresh(existing, clock)) return existing;

  rebuilding ??= rebuildDemoBusiness(clock, log).finally(() => {
    rebuilding = undefined;
  });
  await rebuilding;
  log.info({ event: 'demo.rebuilt' }, 'Rebuilt the demo business');

  const account = await findDemoAccount();
  if (!account) throw new Error('The demo business could not be created');
  // Only a finished rebuild stamps the business as fresh: this one is still being built
  // elsewhere, or never will be finished (then the next visitor's sign-in rebuilds it).
  if (!isFresh(account, clock)) {
    log.warn(
      { event: 'demo.incomplete', businessId: account.business.id },
      'Signed a visitor in to a demo business that is not fully built',
    );
  }
  return account;
}
