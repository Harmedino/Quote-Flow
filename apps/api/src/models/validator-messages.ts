import mongoose from 'mongoose';

/**
 * Replaces Mongoose's built-in validator messages, several of which echo the
 * submitted value (e.g. "`x` is not a valid enum value for path `role`."),
 * with messages that never include it. They reach API clients as
 * VALIDATION_ERROR details. Placeholders such as {MAX} are the schema's limits.
 */
export const VALIDATOR_MESSAGES = {
  general: {
    default: 'Invalid value',
    required: 'This field is required',
    allowNull: 'This field cannot be null',
  },
  Number: {
    min: 'Must be at least {MIN}',
    max: 'Must be at most {MAX}',
    enum: 'Is not an allowed value',
  },
  Date: {
    min: 'Is too early',
    max: 'Is too late',
  },
  String: {
    enum: 'Is not an allowed value',
    match: 'Has an invalid format',
    minlength: 'Must be at least {MINLENGTH} characters',
    maxlength: 'Must be at most {MAXLENGTH} characters',
  },
} as const;

// Mongoose copies a default message into each validator when a schema path is
// declared, so this must run before any schema is created: validators.ts imports
// this module, and every module that creates a schema imports one of the two.
const messages = mongoose.Error.messages as Record<string, Record<string, string>>;
for (const [group, overrides] of Object.entries(VALIDATOR_MESSAGES)) {
  Object.assign((messages[group] ??= {}), overrides);
}
