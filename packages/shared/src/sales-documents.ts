import type { DocumentDiscount, DocumentTotals } from './totals';
import type { AddressInput } from './validation';

/** Shapes shared by quote and invoice responses. Calendar dates are 'YYYY-MM-DD'. */

export interface LineItemDto {
  serviceId: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  /** Minor units. */
  unitPrice: number;
  /** quantity × unitPrice, minor units, calculated by the server. */
  amount: number;
}

/** The billed-to details frozen on the document when it was created. */
export interface CustomerSnapshotDto {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: AddressInput;
}

export type DiscountDto = DocumentDiscount | null;
export type TotalsDto = DocumentTotals;

/** What a customer without an account sees about the business on public pages and PDFs. */
export interface PublicBusinessDto {
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: AddressInput;
  brandColor: string;
}
