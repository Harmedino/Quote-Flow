import type { Model } from 'mongoose';
import { BusinessModel, TENANT_MODELS, type TenantOwned, UserModel } from '../models';
import { DEMO_USERS } from './data/business';

const tenantModels: readonly Pick<Model<TenantOwned>, 'deleteMany'>[] = TENANT_MODELS;

const DEMO_EMAILS = Object.values(DEMO_USERS).map((user) => user.email);

/**
 * Deletes the demo business, found through the demo users' emails, and all of
 * its data. Every delete is scoped by that business's id, so no other tenant is
 * touched. Sign-ups refuse the emails' domain and a user's email cannot change,
 * so whatever business holds one is the demo or an impostor from before the
 * domain was reserved, whatever its isDemo flag says (a demo created before the
 * flag existed reads as false once saved): either way it is replaced. Users
 * whose business is already gone go too, so a reset interrupted part-way or a
 * partial cleanup by hand cannot block the rebuild. The users go last: they are
 * how the business is found, so a reset can simply be run again. Returns whether one was found.
 */
export async function removeDemoBusiness(): Promise<boolean> {
  // Deliberately cross-tenant: the emails are all there is to go on.
  const users = await UserModel.find(
    { email: { $in: DEMO_EMAILS } },
    { businessId: 1 },
    { skipTenantGuard: true },
  ).lean();
  const businessIds = [...new Set(users.map((user) => user.businessId.toString()))];

  for (const businessId of businessIds) {
    for (const model of tenantModels) {
      if (model !== UserModel) await model.deleteMany({ businessId });
    }
    await BusinessModel.deleteOne({ _id: businessId });
    await UserModel.deleteMany({ businessId });
  }
  return businessIds.length > 0;
}
