import type {
  UserDto,
  changePasswordInputSchema,
  updateAccountInputSchema,
} from '@quoteflow/shared';
import type { z } from 'zod';
import { type UserDocument, UserModel } from '../models';
import { toUserDto } from '../serializers/user.serializer';
import { sessionExpired, validationFailed } from '../utils/app-error';
import { hashPassword, verifyPassword } from '../utils/password';
import type { AuthContext } from './access-token.service';
import type { ClientInfo } from './auth.service';
import type { SessionService } from './session.service';

export type UpdateAccountData = z.output<typeof updateAccountInputSchema>;
export type ChangePasswordData = z.output<typeof changePasswordInputSchema>;

export interface AccountService {
  updateAccount(auth: AuthContext, input: UpdateAccountData): Promise<UserDto>;
  /** Keeps the caller's own session and revokes every other one. */
  changePassword(auth: AuthContext, input: ChangePasswordData, client: ClientInfo): Promise<void>;
}

async function findUser(auth: AuthContext, select?: string): Promise<UserDocument> {
  const user = await UserModel.findOne({ _id: auth.userId, businessId: auth.businessId }, select);
  if (!user) throw sessionExpired();
  return user;
}

/** The signed-in user's own profile and password. */
export function createAccountService({
  sessions,
}: {
  sessions: Pick<SessionService, 'revokeAllForUser'>;
}): AccountService {
  return {
    async updateAccount(auth, { name }) {
      const user = await findUser(auth);
      user.name = name;
      await user.save();
      return toUserDto(user);
    },

    async changePassword(auth, { currentPassword, newPassword }, client) {
      const user = await findUser(auth, '+passwordHash');
      if (!(await verifyPassword(currentPassword, user.passwordHash))) {
        client.log.warn(
          { event: 'auth.password_change_failed', userId: auth.userId },
          'Password change rejected: the current password was wrong',
        );
        throw validationFailed([
          { path: 'currentPassword', message: 'Your current password is incorrect' },
        ]);
      }

      await UserModel.updateOne(
        { _id: user._id, businessId: user.businessId },
        { $set: { passwordHash: await hashPassword(newPassword) } },
      );
      const revokedSessions = await sessions.revokeAllForUser(
        auth,
        'password_changed',
        auth.sessionId,
      );
      client.log.info(
        { event: 'auth.password_changed', userId: auth.userId, revokedSessions },
        'Password changed; other sessions revoked',
      );
    },
  };
}
