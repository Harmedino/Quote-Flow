import { z } from 'zod';
import type { BusinessDto } from './business';
import type { UserRole } from './constants/roles';
import {
  businessNameSchema,
  currencyCodeSchema,
  emailSchema,
  passwordSchema,
  personNameSchema,
  timeZoneSchema,
} from './validation';

/**
 * Authentication and account contracts shared by the API and the web app.
 *
 *   POST /api/auth/register      RegisterInput        → 201 AuthSessionDto (+ refresh cookie)
 *   POST /api/auth/login         LoginInput           → 200 AuthSessionDto (+ refresh cookie)
 *   POST /api/auth/refresh       (refresh cookie)     → 200 AuthSessionDto (+ rotated cookie)
 *   POST /api/auth/logout        (refresh cookie)     → 204 (cookie cleared)
 *   POST /api/auth/logout-all    (bearer)             → 204 (every session revoked, cookie cleared)
 *   GET  /api/auth/me            (bearer)             → 200 CurrentUserDto
 *   PATCH /api/account           UpdateAccountInput   → 200 UserDto
 *   PUT  /api/account/password   ChangePasswordInput  → 204 (other sessions revoked)
 */

/** Passwords are only length-checked on sign-in so policy changes never lock anyone out. */
const submittedPasswordSchema = z
  .string()
  .min(1, 'Enter your password')
  .max(1024, 'Password is too long');

export const registerInputSchema = z.object({
  name: personNameSchema,
  businessName: businessNameSchema,
  email: emailSchema,
  password: passwordSchema,
  currency: currencyCodeSchema.optional(),
  /** Detected by the browser; an unrecognised zone falls back to the default instead of failing sign-up. */
  timezone: timeZoneSchema.optional().catch(undefined),
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: submittedPasswordSchema,
});

export const updateAccountInputSchema = z.object({
  name: personNameSchema,
});

export const changePasswordInputSchema = z
  .object({
    currentPassword: submittedPasswordSchema,
    newPassword: passwordSchema,
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ['newPassword'],
    message: 'Choose a password that is different from your current one',
  });

export type RegisterInput = z.input<typeof registerInputSchema>;
export type LoginInput = z.input<typeof loginInputSchema>;
export type UpdateAccountInput = z.input<typeof updateAccountInputSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordInputSchema>;

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface CurrentUserDto {
  user: UserDto;
  business: BusinessDto;
}

export interface AuthSessionDto extends CurrentUserDto {
  /** Short-lived JWT for the `Authorization: Bearer` header. Keep it in memory only. */
  accessToken: string;
  /** ISO timestamp after which the access token is rejected. */
  accessTokenExpiresAt: string;
}
