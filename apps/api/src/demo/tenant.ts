import {
  BusinessModel,
  type BusinessDocument,
  CustomerModel,
  type CustomerDocument,
  ServiceModel,
  type ServiceDocument,
  UserModel,
  type UserDocument,
} from '../models';
import { DEMO_BUSINESS, DEMO_USERS, type DemoUserRole } from './data/business';
import { DEMO_CUSTOMERS, type DemoCustomerKey } from './data/customers';
import { DEMO_SERVICES, type DemoServiceKey } from './data/services';
import type { SeedClock } from './clock';

const BUSINESS_AGE_DAYS = 120;
const OLDEST_CUSTOMER_DAYS = 90;

export interface DemoTenant {
  business: BusinessDocument;
  users: Record<DemoUserRole, UserDocument>;
  customers: Record<DemoCustomerKey, CustomerDocument>;
  services: Record<DemoServiceKey, ServiceDocument>;
}

/** Creates one record per entry, in order, keeping each entry's key. */
async function createEach<Key extends string, Seed, Created>(
  seeds: Record<Key, Seed>,
  create: (seed: Seed, index: number) => Promise<Created>,
): Promise<Record<Key, Created>> {
  const created = {} as Record<Key, Created>;
  const entries = Object.entries(seeds) as [Key, Seed][];
  for (const [index, [key, seed]] of entries.entries()) {
    created[key] = await create(seed, index);
  }
  return created;
}

export async function createDemoTenant(
  clock: SeedClock,
  passwordHash: string,
): Promise<DemoTenant> {
  const createdAt = clock.daysAgo(BUSINESS_AGE_DAYS);
  const business = await BusinessModel.create({ ...DEMO_BUSINESS, createdAt });
  const businessId = business._id;

  const users = await createEach(DEMO_USERS, (user) =>
    UserModel.create({ ...user, businessId, passwordHash, createdAt }),
  );
  const customers = await createEach(DEMO_CUSTOMERS, ({ archivedDaysAgo, ...customer }, index) =>
    CustomerModel.create({
      ...customer,
      businessId,
      archivedAt: archivedDaysAgo === undefined ? null : clock.daysAgo(archivedDaysAgo),
      createdAt: clock.daysAgo(OLDEST_CUSTOMER_DAYS - index),
    }),
  );
  const services = await createEach(DEMO_SERVICES, (service) =>
    ServiceModel.create({ ...service, businessId, createdAt }),
  );

  return { business, users, customers, services };
}
