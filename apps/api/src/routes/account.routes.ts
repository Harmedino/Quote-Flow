import { type RequestHandler, Router } from 'express';
import {
  changePasswordSchemas,
  createAccountController,
  updateAccountSchemas,
} from '../controllers/account.controller';
import type { AuthRateLimiters } from '../middleware/auth-rate-limits';
import { noStore } from '../middleware/no-store';
import { validate } from '../middleware/validate';
import type { AccountService } from '../services/account.service';

export interface AccountRouterOptions {
  accounts: AccountService;
  requireAuth: RequestHandler;
  limiters: Pick<AuthRateLimiters, 'changePassword'>;
}

export function createAccountRouter({
  accounts,
  requireAuth,
  limiters,
}: AccountRouterOptions): Router {
  const controller = createAccountController(accounts);
  const router = Router();
  router.use(noStore, requireAuth);

  router.patch('/', validate(updateAccountSchemas), controller.updateAccount);
  router.put(
    '/password',
    limiters.changePassword,
    validate(changePasswordSchemas),
    controller.changePassword,
  );
  return router;
}
