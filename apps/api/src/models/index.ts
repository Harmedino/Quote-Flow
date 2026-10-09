import { BusinessModel } from './business.model';
import { CounterModel } from './counter.model';
import { CustomerModel } from './customer.model';
import { InvoiceModel } from './invoice.model';
import { QuoteModel } from './quote.model';
import { RateLimitCounterModel } from './rate-limit-counter.model';
import { RetiredRefreshTokenModel } from './retired-refresh-token.model';
import { ServiceModel } from './service.model';
import { SessionModel } from './session.model';
import { UserModel } from './user.model';

export * from './business.model';
export * from './counter.model';
export * from './customer.model';
export * from './invoice.model';
export * from './quote.model';
export * from './rate-limit-counter.model';
export * from './retired-refresh-token.model';
export * from './service.model';
export * from './session.model';
export * from './user.model';
export { AtomicUpdateGuardError } from './plugins/atomic-update-guard';
export { TenantGuardError, type TenantOwned } from './plugins/tenant-guard';
export type { Address } from './schemas/address';
export { type CustomerSnapshot, toCustomerSnapshot } from './schemas/customer-snapshot';
export type { Discount } from './schemas/discount';
export type { LineItem } from './schemas/line-item';
export type { Payment } from './schemas/payment';
export type { Timestamps } from './types';

/** Models whose documents belong to a business; every query on them must be scoped by businessId. */
export const TENANT_MODELS = [
  UserModel,
  CustomerModel,
  ServiceModel,
  QuoteModel,
  InvoiceModel,
  CounterModel,
  SessionModel,
  RetiredRefreshTokenModel,
] as const;

export const ALL_MODELS = [BusinessModel, ...TENANT_MODELS, RateLimitCounterModel] as const;
