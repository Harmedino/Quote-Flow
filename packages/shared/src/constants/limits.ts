/**
 * Maximum lengths of free-text fields, in characters. The validation
 * primitives and the API's database schemas both use these values, so a
 * value the web forms accept is never rejected when it is stored.
 */
export const TEXT_LIMITS = {
  personName: 120,
  businessName: 120,
  companyName: 200,
  email: 254,
  url: 2048,
  addressLine: 200,
  city: 100,
  state: 100,
  postalCode: 20,
  country: 100,
  itemName: 200,
  itemDescription: 2000,
  itemUnit: 30,
  documentPrefix: 12,
  documentNumber: 40,
  notes: 5000,
  terms: 5000,
  rejectionReason: 1000,
  paymentReference: 120,
  paymentNote: 1000,
} as const;

/** Allowed values of a business's default quote validity, in days. */
export const QUOTE_VALIDITY_DAYS_RANGE = { min: 1, max: 365 } as const;
/** Allowed values of a business's default invoice payment term, in days (0 = due on receipt). */
export const INVOICE_DUE_DAYS_RANGE = { min: 0, max: 365 } as const;
