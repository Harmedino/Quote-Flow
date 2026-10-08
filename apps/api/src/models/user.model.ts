import { USER_ROLES, type UserRole, emailSchema, personNameSchema } from '@quoteflow/shared';
import { type HydratedDocument, Schema, model } from 'mongoose';
import { serialization } from './plugins/serialization';
import { type TenantOwned, tenantGuard } from './plugins/tenant-guard';
import type { Timestamps } from './types';
import { validateWith } from './validators';

/**
 * A person who signs in to a business. The email is globally unique (one login
 * per email). Supporting membership of several businesses later means moving
 * `businessId`/`role` into a membership collection; until then the user's
 * business is its tenant.
 */
export interface User extends TenantOwned, Timestamps {
  name: string;
  email: string;
  /** bcrypt hash. Excluded from queries unless selected with `+passwordHash`. */
  passwordHash: string;
  role: UserRole;
  lastLoginAt?: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, validate: validateWith(personNameSchema) },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: validateWith(emailSchema),
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true, default: 'staff' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.plugin(tenantGuard);
userSchema.plugin(serialization, { hidden: ['passwordHash'] });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ businessId: 1 });

export const UserModel = model<User>('User', userSchema);
