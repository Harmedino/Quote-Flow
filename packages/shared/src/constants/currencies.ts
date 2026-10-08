/**
 * Currencies offered to businesses. `minorUnits` follows ISO 4217 and is the
 * single source of truth for converting between display amounts and the
 * integer minor units stored in the database. It is deliberately static so
 * the browser and the API always agree, regardless of their Intl/ICU data.
 */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', minorUnits: 2 },
  { code: 'EUR', name: 'Euro', minorUnits: 2 },
  { code: 'GBP', name: 'British Pound', minorUnits: 2 },
  { code: 'CAD', name: 'Canadian Dollar', minorUnits: 2 },
  { code: 'AUD', name: 'Australian Dollar', minorUnits: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', minorUnits: 2 },
  { code: 'CHF', name: 'Swiss Franc', minorUnits: 2 },
  { code: 'SEK', name: 'Swedish Krona', minorUnits: 2 },
  { code: 'NOK', name: 'Norwegian Krone', minorUnits: 2 },
  { code: 'DKK', name: 'Danish Krone', minorUnits: 2 },
  { code: 'PLN', name: 'Polish Złoty', minorUnits: 2 },
  { code: 'TRY', name: 'Turkish Lira', minorUnits: 2 },
  { code: 'NGN', name: 'Nigerian Naira', minorUnits: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', minorUnits: 2 },
  { code: 'KES', name: 'Kenyan Shilling', minorUnits: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', minorUnits: 0 },
  { code: 'TZS', name: 'Tanzanian Shilling', minorUnits: 2 },
  { code: 'RWF', name: 'Rwandan Franc', minorUnits: 0 },
  { code: 'ETB', name: 'Ethiopian Birr', minorUnits: 2 },
  { code: 'ZAR', name: 'South African Rand', minorUnits: 2 },
  { code: 'EGP', name: 'Egyptian Pound', minorUnits: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', minorUnits: 2 },
  { code: 'XOF', name: 'West African CFA Franc', minorUnits: 0 },
  { code: 'XAF', name: 'Central African CFA Franc', minorUnits: 0 },
  { code: 'AED', name: 'UAE Dirham', minorUnits: 2 },
  { code: 'SAR', name: 'Saudi Riyal', minorUnits: 2 },
  { code: 'QAR', name: 'Qatari Riyal', minorUnits: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', minorUnits: 3 },
  { code: 'BHD', name: 'Bahraini Dinar', minorUnits: 3 },
  { code: 'OMR', name: 'Omani Rial', minorUnits: 3 },
  { code: 'JOD', name: 'Jordanian Dinar', minorUnits: 3 },
  { code: 'INR', name: 'Indian Rupee', minorUnits: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', minorUnits: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', minorUnits: 2 },
  { code: 'LKR', name: 'Sri Lankan Rupee', minorUnits: 2 },
  { code: 'SGD', name: 'Singapore Dollar', minorUnits: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', minorUnits: 2 },
  { code: 'PHP', name: 'Philippine Peso', minorUnits: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', minorUnits: 2 },
  { code: 'THB', name: 'Thai Baht', minorUnits: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', minorUnits: 2 },
  { code: 'CNY', name: 'Chinese Yuan', minorUnits: 2 },
  { code: 'JPY', name: 'Japanese Yen', minorUnits: 0 },
  { code: 'KRW', name: 'South Korean Won', minorUnits: 0 },
  { code: 'BRL', name: 'Brazilian Real', minorUnits: 2 },
  { code: 'MXN', name: 'Mexican Peso', minorUnits: 2 },
  { code: 'COP', name: 'Colombian Peso', minorUnits: 2 },
  { code: 'CLP', name: 'Chilean Peso', minorUnits: 0 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const CURRENCY_CODES = CURRENCIES.map((currency) => currency.code) as [
  CurrencyCode,
  ...CurrencyCode[],
];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

const minorUnitsByCode = new Map<string, number>(
  CURRENCIES.map((currency) => [currency.code, currency.minorUnits]),
);

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return minorUnitsByCode.has(code);
}

export function getCurrencyMinorUnits(code: CurrencyCode): number {
  const minorUnits = minorUnitsByCode.get(code);
  if (minorUnits === undefined) {
    throw new RangeError(`Unsupported currency: ${code}`);
  }
  return minorUnits;
}
