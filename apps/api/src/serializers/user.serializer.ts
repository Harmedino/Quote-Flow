import type { UserDto } from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { User } from '../models';

export type UserRecord = Pick<User, 'name' | 'email' | 'role' | 'createdAt'> & {
  _id: Types.ObjectId;
};

/** Picks the public fields explicitly, so a password hash can never reach a response. */
export function toUserDto(user: UserRecord): UserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
