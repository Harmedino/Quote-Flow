import { describe, expect, it } from 'vitest';
import {
  changePasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  updateAccountInputSchema,
} from './auth';

const registration = {
  name: '  Amina Yusuf ',
  businessName: ' Sparkle Cleaning Co. ',
  email: 'Amina@Sparkle.example',
  password: 'correct horse battery',
};

describe('registerInputSchema', () => {
  it('normalises a valid registration', () => {
    expect(registerInputSchema.parse({ ...registration, currency: 'NGN' })).toEqual({
      name: 'Amina Yusuf',
      businessName: 'Sparkle Cleaning Co.',
      email: 'amina@sparkle.example',
      password: 'correct horse battery',
      currency: 'NGN',
    });
  });

  it('keeps a valid browser time zone and drops an unrecognised one', () => {
    expect(registerInputSchema.parse({ ...registration, timezone: 'Africa/Lagos' }).timezone).toBe(
      'Africa/Lagos',
    );
    const parsed = registerInputSchema.parse({ ...registration, timezone: 'Mars/Olympus' });
    expect(parsed.timezone).toBeUndefined();
  });

  it('rejects weak passwords, blank names and unsupported currencies', () => {
    const result = registerInputSchema.safeParse({
      ...registration,
      name: ' ',
      businessName: '',
      password: 'short',
      currency: 'XYZ',
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['name', 'businessName', 'password', 'currency']));
  });
});

describe('loginInputSchema', () => {
  it('does not apply the password policy when signing in', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.co', password: 'old' }).success).toBe(true);
  });

  it('requires a password and bounds its length', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
    expect(
      loginInputSchema.safeParse({ email: 'a@b.co', password: 'x'.repeat(1025) }).success,
    ).toBe(false);
  });
});

describe('changePasswordInputSchema', () => {
  it('requires a new password that differs from the current one', () => {
    const result = changePasswordInputSchema.safeParse({
      currentPassword: 'same password',
      newPassword: 'same password',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['newPassword']);
  });

  it('applies the password policy to the new password only', () => {
    expect(
      changePasswordInputSchema.safeParse({ currentPassword: 'old', newPassword: 'a new password' })
        .success,
    ).toBe(true);
    expect(
      changePasswordInputSchema.safeParse({ currentPassword: 'old', newPassword: 'short' }).success,
    ).toBe(false);
  });
});

describe('updateAccountInputSchema', () => {
  it('trims the name and ignores fields that cannot be changed here', () => {
    expect(
      updateAccountInputSchema.parse({ name: ' New Name ', email: 'x@y.co', role: 'owner' }),
    ).toEqual({ name: 'New Name' });
  });
});
