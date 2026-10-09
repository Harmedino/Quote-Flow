import type {
  AuthSessionDto,
  CurrentUserDto,
  DemoQuoteDto,
  loginInputSchema,
  registerInputSchema,
} from '@quoteflow/shared';
import type { Types } from 'mongoose';
import type { z } from 'zod';
import { isDuplicateKeyError } from '../db/errors';
import { isDemoEmail } from '../demo/data/business';
import { ensureDemoAccount } from '../demo/demo-account';
import { openDemoQuote } from '../demo/open-quote';
import {
  type BusinessDocument,
  BusinessModel,
  type SessionDocument,
  type UserDocument,
  UserModel,
} from '../models';
import { toBusinessDto } from '../serializers/business.serializer';
import { toUserDto } from '../serializers/user.serializer';
import { AppError, sessionExpired, unauthorized, validationFailed } from '../utils/app-error';
import type { Clock } from '../utils/clock';
import type { Logger } from '../utils/logger';
import { hashPassword, verifyPassword } from '../utils/password';
import type { AccessTokenService, AuthContext } from './access-token.service';
import type { SessionService } from './session.service';

export type RegisterData = z.output<typeof registerInputSchema>;
export type LoginData = z.output<typeof loginInputSchema>;

/** Request details the services need: a request-scoped logger and the client's user agent. */
export interface ClientInfo {
  log: Logger;
  userAgent: string | undefined;
}

export interface SignedIn {
  session: AuthSessionDto;
  /** For the httpOnly cookie only; never part of a response body. */
  refreshToken: string;
}

export interface AuthService {
  register(input: RegisterData, client: ClientInfo): Promise<SignedIn>;
  login(input: LoginData, client: ClientInfo): Promise<SignedIn>;
  /** Signs in to the shared demo business, creating or refreshing it first. */
  demo(client: ClientInfo): Promise<SignedIn>;
  /** A demo quote its customer can still answer, sending a new one when none is left. */
  demoQuote(client: ClientInfo): Promise<DemoQuoteDto>;
  refresh(refreshToken: string | undefined, client: ClientInfo): Promise<SignedIn>;
  logout(refreshToken: string | undefined, client: ClientInfo): Promise<void>;
  logoutAll(auth: AuthContext, client: ClientInfo): Promise<void>;
  currentUser(auth: AuthContext): Promise<CurrentUserDto>;
}

export interface AuthServiceOptions {
  tokens: AccessTokenService;
  sessions: SessionService;
  clock: Clock;
}

const INVALID_CREDENTIALS_MESSAGE = 'Incorrect email or password.';
const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';

const emailTaken = () =>
  new AppError('CONFLICT', `${EMAIL_TAKEN_MESSAGE}.`, {
    details: [{ path: 'email', message: EMAIL_TAKEN_MESSAGE }],
  });

interface Account {
  user: UserDocument;
  business: BusinessDocument;
}

async function findAccount(
  userId: Types.ObjectId | string,
  businessId: Types.ObjectId | string,
): Promise<Account | undefined> {
  const [user, business] = await Promise.all([
    UserModel.findOne({ _id: userId, businessId }),
    BusinessModel.findById(businessId),
  ]);
  return user && business ? { user, business } : undefined;
}

/** Sign-up, sign-in and the refresh-session lifecycle. */
export function createAuthService({ tokens, sessions, clock }: AuthServiceOptions): AuthService {
  async function toAuthSession(
    { user, business }: Account,
    session: SessionDocument,
  ): Promise<AuthSessionDto> {
    const accessToken = await tokens.issue({
      userId: user._id.toString(),
      businessId: business._id.toString(),
      role: user.role,
      sessionId: session._id.toString(),
    });
    return {
      user: toUserDto(user),
      business: toBusinessDto(business),
      accessToken: accessToken.token,
      accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
    };
  }

  async function signIn(account: Account, client: ClientInfo): Promise<SignedIn> {
    const { user } = account;
    const { session, refreshToken } = await sessions.start(
      { userId: user._id, businessId: user.businessId },
      client.userAgent,
    );
    // An atomic update, so sign-in never depends on revalidating the whole user document.
    await UserModel.updateOne(
      { _id: user._id, businessId: user.businessId },
      { $set: { lastLoginAt: clock() } },
    );
    return { session: await toAuthSession(account, session), refreshToken };
  }

  return {
    async register({ name, businessName, email, password, currency, timezone }, client) {
      // The demo is found through its owner's email, so nobody else may hold one on its domain.
      if (isDemoEmail(email)) {
        throw validationFailed([{ path: 'email', message: 'This email address is reserved' }]);
      }
      const existing = await UserModel.exists({ email }).setOptions({ skipTenantGuard: true });
      if (existing) throw emailTaken();

      const passwordHash = await hashPassword(password);
      // The business's contact email is public (quotes, invoices, PDFs), so it is never
      // defaulted to the sign-in email: the owner chooses what customers see.
      const business = await BusinessModel.create({
        name: businessName,
        ...(currency !== undefined && { currency }),
        ...(timezone !== undefined && { timezone }),
      });

      let user: UserDocument;
      try {
        user = await UserModel.create({
          businessId: business._id,
          name,
          email,
          passwordHash,
          role: 'owner',
        });
      } catch (error) {
        // No transaction: undo the business by hand (e.g. a concurrent sign-up took the email).
        await BusinessModel.deleteOne({ _id: business._id }).catch((cleanupError: unknown) => {
          client.log.error(
            { err: cleanupError, businessId: business.id },
            'Could not remove the business of a failed sign-up',
          );
        });
        if (isDuplicateKeyError(error)) throw emailTaken();
        throw error;
      }

      client.log.info(
        { event: 'auth.registered', userId: user.id, businessId: business.id },
        'New business registered',
      );
      return signIn({ user, business }, client);
    },

    async login({ email, password }, client) {
      // Deliberately cross-tenant: the email is all there is to go on.
      const user = await UserModel.findOne({ email }, '+passwordHash', { skipTenantGuard: true });
      // Runs bcrypt even for an unknown email, so timing does not reveal which emails exist.
      const passwordMatches = await verifyPassword(password, user?.passwordHash);
      if (!user || !passwordMatches) {
        client.log.warn(
          {
            event: 'auth.login_failed',
            reason: user ? 'wrong_password' : 'unknown_email',
            userId: user?.id,
          },
          'Sign-in failed',
        );
        throw unauthorized(INVALID_CREDENTIALS_MESSAGE);
      }

      const business = await BusinessModel.findById(user.businessId);
      if (!business) throw new Error('A user exists whose business does not');

      client.log.info({ event: 'auth.login', userId: user.id }, 'Signed in');
      return signIn({ user, business }, client);
    },

    async demo(client) {
      const account = await ensureDemoAccount(clock, client.log);
      client.log.info(
        { event: 'auth.demo_login', userId: account.user.id },
        'Signed in to the demo',
      );
      return signIn(account, client);
    },

    async demoQuote(client) {
      const account = await ensureDemoAccount(clock, client.log);
      return { publicToken: await openDemoQuote(account, clock()) };
    },

    async refresh(refreshToken, client) {
      if (!refreshToken) throw sessionExpired();
      const outcome = await sessions.rotate(refreshToken);
      if (outcome.status === 'reused') {
        client.log.warn(
          {
            event: 'auth.refresh_token_reused',
            sessionId: outcome.session.id,
            userId: outcome.session.userId.toString(),
          },
          'A rotated refresh token was replayed; the session has been revoked',
        );
      }
      if (outcome.status !== 'rotated') throw sessionExpired();

      const { session } = outcome;
      const account = await findAccount(session.userId, session.businessId);
      if (!account) {
        await sessions.revoke(session, 'account_removed');
        throw sessionExpired();
      }
      // Signed with the user's current role, so role changes apply from the next refresh.
      return {
        session: await toAuthSession(account, session),
        refreshToken: outcome.refreshToken,
      };
    },

    async logout(refreshToken, client) {
      if (!refreshToken) return;
      const session = await sessions.revokeByToken(refreshToken, 'logout');
      if (session) {
        client.log.info(
          { event: 'auth.logout', sessionId: session.id, userId: session.userId.toString() },
          'Signed out',
        );
      }
    },

    async logoutAll(auth, client) {
      // Every demo visitor signs in as the same owner, so one must not sign the others out.
      const isDemo = await BusinessModel.exists({ _id: auth.businessId, isDemo: true });
      const revokedSessions = isDemo
        ? await sessions.revokeOne(auth, 'logout_all')
        : await sessions.revokeAllForUser(auth, 'logout_all');
      client.log.info(
        { event: 'auth.logout_all', userId: auth.userId, revokedSessions },
        'Signed out of every session',
      );
    },

    async currentUser(auth) {
      const account = await findAccount(auth.userId, auth.businessId);
      if (!account) throw sessionExpired();
      return { user: toUserDto(account.user), business: toBusinessDto(account.business) };
    },
  };
}
