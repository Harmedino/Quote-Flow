import type { InvoiceDocument } from '../models';
import { DEMO_OWNER_EMAIL } from './data/business';
import type { SeedClock } from './clock';
import { createInvoices } from './invoices';
import { createQuotes } from './quotes';
import { removeBusinessOwnedBy } from './reset';
import { type DemoTenant, createDemoTenant } from './tenant';

export interface SeededDemo {
  tenant: DemoTenant;
  invoices: InvoiceDocument[];
  /** Whether a previous demo business was removed first. */
  replaced: boolean;
}

/** Removes the previous demo business (and only it), then creates a fresh one. */
export async function replaceDemoBusiness(
  clock: SeedClock,
  passwordHash: string,
): Promise<SeededDemo> {
  const replaced = await removeBusinessOwnedBy(DEMO_OWNER_EMAIL);
  const tenant = await createDemoTenant(clock, passwordHash);
  const quotes = await createQuotes(tenant, clock);
  const invoices = await createInvoices(tenant, clock, quotes);
  return { tenant, invoices, replaced };
}
