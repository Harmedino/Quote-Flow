import type { Model } from 'mongoose';
import { BusinessModel, TENANT_MODELS, type TenantOwned, UserModel } from '../../models';

const tenantModels: readonly Pick<Model<TenantOwned>, 'deleteMany'>[] = TENANT_MODELS;

/**
 * Deletes the business owned by `ownerEmail` and all of its data. Every
 * delete is scoped by that business's id, so no other tenant is touched.
 * Returns whether a business was found.
 */
export async function removeBusinessOwnedBy(ownerEmail: string): Promise<boolean> {
  const owner = await UserModel.findOne(
    { email: ownerEmail, role: 'owner' },
    { businessId: 1 },
    { skipTenantGuard: true },
  ).lean();
  if (!owner) return false;

  const { businessId } = owner;
  for (const model of tenantModels) {
    await model.deleteMany({ businessId });
  }
  await BusinessModel.deleteOne({ _id: businessId });
  return true;
}
