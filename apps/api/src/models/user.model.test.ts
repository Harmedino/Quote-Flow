import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';
import { validationErrorsOf } from '../test/model-fixtures';
import { UserModel } from './user.model';

function userInput(overrides: Record<string, unknown> = {}) {
  return {
    businessId: new Types.ObjectId(),
    name: 'Maya Robinson',
    email: 'maya@example.com',
    passwordHash: 'placeholder-not-a-real-hash',
    ...overrides,
  };
}

describe('UserModel', () => {
  it('defaults to the staff role and normalises the email', async () => {
    const user = new UserModel(userInput({ email: '  Maya@Example.COM ' }));
    expect(await validationErrorsOf(user)).toEqual({});
    expect(user).toMatchObject({ role: 'staff', email: 'maya@example.com' });
  });

  it.each([
    ['businessId', { businessId: undefined }],
    ['name', { name: '' }],
    ['email', { email: undefined }],
    ['email', { email: 'maya' }],
    ['passwordHash', { passwordHash: undefined }],
    ['role', { role: 'admin' }],
  ])('rejects a missing or invalid %s', async (path, overrides) => {
    expect(await validationErrorsOf(new UserModel(userInput(overrides)))).toHaveProperty([path]);
  });

  it('never selects or serialises the password hash', () => {
    expect(UserModel.schema.path('passwordHash').options).toMatchObject({ select: false });

    const user = new UserModel(userInput({ role: 'owner' }));
    for (const output of [user.toJSON(), user.toObject(), JSON.parse(JSON.stringify(user))]) {
      expect(output).not.toHaveProperty('passwordHash');
      expect(output).toMatchObject({ id: user.id, role: 'owner' });
    }
  });

  it('enforces one login per email across all businesses', () => {
    expect(UserModel.schema.indexes()).toEqual(
      expect.arrayContaining([[{ email: 1 }, expect.objectContaining({ unique: true })]]),
    );
  });
});
