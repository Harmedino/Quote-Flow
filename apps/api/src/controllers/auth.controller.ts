import { type DemoAvailabilityDto, loginInputSchema, registerInputSchema } from '@quoteflow/shared';
import type { Request, Response } from 'express';
import { authOf } from '../middleware/auth';
import { notFound } from '../utils/app-error';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import type { AuthService } from '../services/auth.service';
import { type RefreshCookie, readRefreshCookie } from '../utils/refresh-cookie';
import { sendData } from '../utils/response';
import { clientInfoOf } from './client-info';

export const registerSchemas = { body: registerInputSchema } satisfies RequestSchemas;
export const loginSchemas = { body: loginInputSchema } satisfies RequestSchemas;

export function createAuthController(
  auth: AuthService,
  refreshCookie: RefreshCookie,
  demoLoginEnabled: boolean,
) {
  return {
    register: async (req: ValidatedRequest<typeof registerSchemas>, res: Response) => {
      const { session, refreshToken } = await auth.register(req.body, clientInfoOf(req));
      refreshCookie.set(res, refreshToken);
      sendData(res, session, 201);
    },

    login: async (req: ValidatedRequest<typeof loginSchemas>, res: Response) => {
      const { session, refreshToken } = await auth.login(req.body, clientInfoOf(req));
      refreshCookie.set(res, refreshToken);
      sendData(res, session);
    },

    demoAvailability: (_req: Request, res: Response) => {
      const availability: DemoAvailabilityDto = { available: demoLoginEnabled };
      sendData(res, availability);
    },

    demo: async (req: Request, res: Response) => {
      if (!demoLoginEnabled) throw notFound();
      const { session, refreshToken } = await auth.demo(clientInfoOf(req));
      refreshCookie.set(res, refreshToken);
      sendData(res, session);
    },

    /** A failed refresh leaves the cookie alone: a racing tab may just have received a newer one. */
    refresh: async (req: Request, res: Response) => {
      const { session, refreshToken } = await auth.refresh(
        readRefreshCookie(req),
        clientInfoOf(req),
      );
      refreshCookie.set(res, refreshToken);
      sendData(res, session);
    },

    /** Idempotent: always 204 and a cleared cookie, whatever the cookie held. */
    logout: async (req: Request, res: Response) => {
      await auth.logout(readRefreshCookie(req), clientInfoOf(req));
      refreshCookie.clear(res);
      res.status(204).end();
    },

    logoutAll: async (req: Request, res: Response) => {
      await auth.logoutAll(authOf(req), clientInfoOf(req));
      refreshCookie.clear(res);
      res.status(204).end();
    },

    me: async (req: Request, res: Response) => {
      sendData(res, await auth.currentUser(authOf(req)));
    },
  };
}
