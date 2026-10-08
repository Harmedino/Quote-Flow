/**
 * Maximum lengths for free-text fields that have no counterpart in the shared
 * validation primitives. Request schemas in later stages must use the same values.
 */
export const TEXT_LIMITS = {
  businessName: 120,
  companyName: 200,
  url: 2048,
  documentNumber: 40,
  notes: 5000,
  terms: 5000,
  rejectionReason: 1000,
  paymentReference: 120,
  paymentNote: 1000,
} as const;

export const QUOTE_VALIDITY_DAYS_RANGE = { min: 1, max: 365 } as const;
export const INVOICE_DUE_DAYS_RANGE = { min: 0, max: 365 } as const;
