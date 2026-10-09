import type {
  AuthSessionDto,
  ChangePasswordInput,
  CurrentUserDto,
  DemoAvailabilityDto,
  LoginInput,
  RegisterInput,
  UpdateAccountInput,
  UserDto,
} from '@quoteflow/shared';
import { request } from '@/lib/api-client';

/** Endpoints of the auth and account contract in `@quoteflow/shared` (see `auth.ts`). */

export function register(input: RegisterInput): Promise<AuthSessionDto> {
  return request('/auth/register', { method: 'POST', body: input });
}

export function login(input: LoginInput): Promise<AuthSessionDto> {
  return request('/auth/login', { method: 'POST', body: input });
}

/** Whether this deployment offers "Explore the demo". */
export function getDemoAvailability(): Promise<DemoAvailabilityDto> {
  return request('/auth/demo');
}

/** Signs in to the shared demo business (created or refreshed by the server as needed). */
export function startDemo(): Promise<AuthSessionDto> {
  return request('/auth/demo', { method: 'POST' });
}

/** Authenticated by the httpOnly refresh cookie, which the response rotates. */
export function refresh(): Promise<AuthSessionDto> {
  return request('/auth/refresh', { method: 'POST' });
}

/** Ends this browser's session. Succeeds even when there is no valid session. */
export function logout(): Promise<void> {
  return request('/auth/logout', { method: 'POST' });
}

/** Ends every session of the signed-in user, including this one. */
export function logoutAll(): Promise<void> {
  return request('/auth/logout-all', { method: 'POST' });
}

export function getCurrentUser(): Promise<CurrentUserDto> {
  return request('/auth/me');
}

export function updateAccount(input: UpdateAccountInput): Promise<UserDto> {
  return request('/account', { method: 'PATCH', body: input });
}

/** The server signs out every other session of the user. */
export function changePassword(input: ChangePasswordInput): Promise<void> {
  return request('/account/password', { method: 'PUT', body: input });
}
