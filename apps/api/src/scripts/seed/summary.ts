import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  formatMoney,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import {
  CustomerModel,
  type InvoiceDocument,
  InvoiceModel,
  QuoteModel,
  ServiceModel,
  UserModel,
} from '../../models';
import { DEMO_USERS } from '../seed-data/business';
import type { DemoPassword } from './password';
import type { DemoTenant } from './tenant';

interface StatusCount {
  _id: string;
  count: number;
}

function formatBreakdown<Status extends string>(
  statuses: readonly Status[],
  labels: Record<Status, string>,
  rows: readonly StatusCount[],
): string {
  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return statuses.map((status) => `${labels[status]} ${counts.get(status) ?? 0}`).join(', ');
}

function byStatus(businessId: Types.ObjectId) {
  return [{ $match: { businessId } }, { $group: { _id: '$status', count: { $sum: 1 } } }];
}

function sumOf(invoices: readonly InvoiceDocument[], amount: (invoice: InvoiceDocument) => number) {
  return invoices.reduce((total, invoice) => total + amount(invoice), 0);
}

/** Counts are read back from the database, so the summary also confirms what was stored. */
export async function describeSeededTenant(
  { business }: DemoTenant,
  invoices: readonly InvoiceDocument[],
  password: DemoPassword,
): Promise<string> {
  const businessId = business._id;
  const [users, customers, archived, services, inactive, quoteRows, invoiceRows] =
    await Promise.all([
      UserModel.countDocuments({ businessId }),
      CustomerModel.countDocuments({ businessId }),
      CustomerModel.countDocuments({ businessId, archivedAt: { $ne: null } }),
      ServiceModel.countDocuments({ businessId }),
      ServiceModel.countDocuments({ businessId, active: false }),
      QuoteModel.aggregate<StatusCount>(byStatus(businessId)),
      InvoiceModel.aggregate<StatusCount>(byStatus(businessId)),
    ]);

  const sum = (rows: readonly StatusCount[]) => rows.reduce((total, row) => total + row.count, 0);
  const billable = invoices.filter((invoice) => invoice.status !== 'cancelled');
  const invoiced = sumOf(billable, (invoice) => invoice.totals.total);
  const collected = sumOf(billable, (invoice) => invoice.amountPaid);
  const currency = business.currency;

  return [
    `Seeded "${business.name}" (${currency}, ${business.timezone})`,
    `  Users      ${users}`,
    `  Customers  ${customers} (${archived} archived)`,
    `  Services   ${services} (${inactive} inactive)`,
    `  Quotes     ${sum(quoteRows)}: ${formatBreakdown(QUOTE_STATUSES, QUOTE_STATUS_LABELS, quoteRows)}`,
    `  Invoices   ${sum(invoiceRows)}: ${formatBreakdown(INVOICE_STATUSES, INVOICE_STATUS_LABELS, invoiceRows)}`,
    `  Collected  ${formatMoney(collected, currency, 'en-US')} of ${formatMoney(invoiced, currency, 'en-US')} invoiced`,
    '',
    password.generated
      ? 'Demo login (development only; the password changes on every seed run)'
      : 'Demo login (development only)',
    `  Owner     ${DEMO_USERS.owner.email}`,
    `  Staff     ${DEMO_USERS.staff.email}`,
    `  Password  ${password.generated ? password.value : '(from SEED_DEMO_PASSWORD)'}`,
    '',
  ].join('\n');
}
