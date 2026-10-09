import type { Model } from 'mongoose';
import { BusinessModel, TENANT_MODELS, type TenantOwned, UserModel } from '../models';

const tenantModels: readonly Pick<Model<TenantOwned>, 'deleteMany'>[] = TENANT_MODELS;

/** The demo owner's email belongs to an account that was not created as the demo. */
export class DemoEmailTakenError extends Error {
  constructor() {
    super(
      'The demo owner email belongs to a business not marked as the demo, so nothing was removed. ' +
        'Delete that account by hand (or drop a development database seeded before isDemo existed).',
    );
    this.name = 'DemoEmailTakenError';
  }
}

/**
 * Deletes the demo business, found through its owner's email, and all of its
 * data. Every delete is scoped by that business's id, so no other tenant is
 * touched, and a business not marked as the demo is never removed: someone
 * may have signed up with the email before its domain was reserved.
 * The users go last: the owner is how the business is found, so a reset
 * interrupted part-way can simply be run again. Returns whether a business was found.
 */
export async function removeDemoBusiness(ownerEmail: string): Promise<boolean> {
  const owner = await UserModel.findOne(
    { email: ownerEmail, role: 'owner' },
    { businessId: 1 },
    { skipTenantGuard: true },
  ).lean();
  if (!owner) return false;

  const { businessId } = owner;
  const business = await BusinessModel.findById(businessId, { isDemo: 1 }).lean();
  // A missing business is a reset interrupted part-way, so its leftovers are removed.
  if (business && !business.isDemo) throw new DemoEmailTakenError();

  for (const model of tenantModels) {
    if (model !== UserModel) await model.deleteMany({ businessId });
  }
  await BusinessModel.deleteOne({ _id: businessId });
  await UserModel.deleteMany({ businessId });
  return true;
}
