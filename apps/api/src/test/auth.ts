import { randomBytes } from 'node:crypto';
import type { AuthSessionDto, RegisterInput, UserRole } from '@quoteflow/shared';
import { type SetCookie, parseSetCookie } from 'cookie';
import type { Express } from 'express';
import request from 'supertest';
import { type CreateAppOptions, createApp } from '../app';
import { UserModel } from '../models';
import type { Clock } from '../utils/clock';
import { hashPassword } from '../utils/password';
import { REFRESH_COOKIE_NAME } from '../utils/refresh-cookie';
import { createSilentLogger, createTestEnv, dataOf } from './helpers';

export const TEST_PASSWORD = 'correct horse battery staple';

/** A clock that only moves when told to. */
export interface TestClock {
  now: Clock;
  advance(ms: number): void;
}

export function createTestClock(start = new Date()): TestClock {
  let current = start;
  return {
    now: () => current,
    advance: (ms) => {
      current = new Date(current.getTime() + ms);
    },
  };
}

/** The app with the global and auth rate limits off unless a test sets them. */
export function createAuthTestApp(options: Partial<CreateAppOptions> = {}): Express {
  return createApp({
    env: createTestEnv(),
    logger: createSilentLogger(),
    rateLimit: false,
    authRateLimits: false,
    ...options,
  });
}

export function uniqueEmail(label = 'owner'): string {
  return `${label}.${randomBytes(4).toString('hex')}@example.com`;
}

export function registrationInput(overrides: Partial<RegisterInput> = {}): RegisterInput {
  return {
    name: 'Amina Yusuf',
    businessName: 'Sparkle Cleaning Co.',
    email: uniqueEmail(),
    password: TEST_PASSWORD,
    ...overrides,
  };
}

export const bearer = (accessToken: string) => `Bearer ${accessToken}`;
export const refreshCookieHeader = (refreshToken: string) =>
  `${REFRESH_COOKIE_NAME}=${refreshToken}`;

/** The refresh cookie a response set (or cleared), parsed. */
export function refreshCookieOf(res: { headers: Record<string, unknown> }): SetCookie | undefined {
  const header = res.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header.map(String) : [];
  return cookies
    .map((cookie) => parseSetCookie(cookie))
    .find((c) => c.name === REFRESH_COOKIE_NAME);
}

export interface SignedInClient {
  session: AuthSessionDto;
  refreshToken: string;
}

function signedInClientOf(res: request.Response): SignedInClient {
  const refreshToken = refreshCookieOf(res)?.value;
  if (!refreshToken) throw new Error(`Expected a refresh cookie (status ${res.status})`);
  return { session: dataOf<AuthSessionDto>(res), refreshToken };
}

export async function registerOwner(
  app: Express,
  overrides: Partial<RegisterInput> = {},
): Promise<SignedInClient & { input: RegisterInput }> {
  const input = registrationInput(overrides);
  const res = await request(app).post('/api/auth/register').send(input).expect(201);
  return { ...signedInClientOf(res), input };
}

export async function login(app: Express, email: string, password = TEST_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return signedInClientOf(res);
}

export function refresh(app: Express, refreshToken: string) {
  return request(app).post('/api/auth/refresh').set('Cookie', refreshCookieHeader(refreshToken));
}

/** Adds a user directly (there is no invitation flow yet) and signs them in. */
export async function addUser(
  app: Express,
  businessId: string,
  role: UserRole,
): Promise<SignedInClient> {
  const email = uniqueEmail(role);
  await UserModel.create({
    businessId,
    name: 'Luis Ortega',
    email,
    role,
    passwordHash: await hashPassword(TEST_PASSWORD),
  });
  return login(app, email);
}
