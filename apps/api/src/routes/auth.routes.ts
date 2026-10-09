import { type RequestHandler, Router } from 'express';
import {
  createAuthController,
  loginSchemas,
  registerSchemas,
} from '../controllers/auth.controller';
import type { AuthRateLimiters } from '../middleware/auth-rate-limits';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';
import type { AuthService } from '../services/auth.service';
import type { RefreshCookie } from '../utils/refresh-cookie';

export interface AuthRouterOptions {
  auth: AuthService;
  refreshCookie: RefreshCookie;
  requireAuth: RequestHandler;
  /** Guards the endpoints that set or use the refresh cookie against cross-site requests. */
  trustedOrigin: RequestHandler;
  limiters: AuthRateLimiters;
  /** Whether "Explore the demo" may sign visitors in to the shared demo business. */
  demoLoginEnabled: boolean;
}

export function createAuthRouter({
  auth,
  refreshCookie,
  requireAuth,
  trustedOrigin,
  limiters,
  demoLoginEnabled,
}: AuthRouterOptions): Router {
  const controller = createAuthController(auth, refreshCookie, demoLoginEnabled);
  const router = Router();
  router.use(noStore);

  router.post(
    '/register',
    trustedOrigin,
    limiters.register,
    validate(registerSchemas),
    controller.register,
  );
  router.post(
    '/login',
    trustedOrigin,
    limiters.login,
    limiters.loginAccount,
    limiters.loginEmail,
    validate(loginSchemas),
    controller.login,
  );
  router.get('/demo', controller.demoAvailability);
  router.post('/demo', trustedOrigin, limiters.demo, controller.demo);
  router.post('/refresh', trustedOrigin, limiters.refresh, controller.refresh);
  router.post('/logout', trustedOrigin, controller.logout);
  router.post('/logout-all', requireAuth, controller.logoutAll);
  router.get('/me', requireAuth, controller.me);
  return router;
}
