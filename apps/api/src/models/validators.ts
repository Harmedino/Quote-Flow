import type { ValidatorProps } from 'mongoose';
import type { z } from 'zod';
import './validator-messages';

/**
 * Mongoose validators built from the Zod primitives in @quoteflow/shared, so
 * the database enforces exactly the rules the API and web forms apply.
 * Absent values pass; use `required` to make a field mandatory.
 */
export function validateWith(schema: z.ZodType) {
  return {
    validator: (value: unknown): boolean => value == null || schema.safeParse(value).success,
    message: ({ value }: ValidatorProps): string => {
      const result = schema.safeParse(value);
      return result.success
        ? 'Invalid value'
        : (result.error.issues[0]?.message ?? 'Invalid value');
    },
  };
}

function isNonNegativeSafeInteger(value: unknown): boolean {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** For derived amounts (line amounts, totals, balances) in minor units. */
export const nonNegativeMinorUnits = {
  validator: (value: unknown): boolean => value == null || isNonNegativeSafeInteger(value),
  message: 'Amount must be a non-negative whole number of minor units',
};

export const wholeNumber = {
  validator: (value: unknown): boolean => value == null || Number.isSafeInteger(value),
  message: 'Must be a whole number',
};

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !URL.canParse(value)) return false;
  const { protocol } = new URL(value);
  return protocol === 'https:' || protocol === 'http:';
}

export const httpUrl = {
  validator: (value: unknown): boolean => value == null || isHttpUrl(value),
  message: 'Enter a full web address starting with http:// or https://',
};
