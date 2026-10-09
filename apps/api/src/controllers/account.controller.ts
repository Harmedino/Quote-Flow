import { changePasswordInputSchema, updateAccountInputSchema } from '@quoteflow/shared';
import type { Response } from 'express';
import { authOf } from '../middleware/auth';
import type { RequestSchemas, ValidatedRequest } from '../middleware/validate';
import type { AccountService } from '../services/account.service';
import { sendData } from '../utils/response';
import { clientInfoOf } from './client-info';

export const updateAccountSchemas = { body: updateAccountInputSchema } satisfies RequestSchemas;
export const changePasswordSchemas = { body: changePasswordInputSchema } satisfies RequestSchemas;

export function createAccountController(accounts: AccountService) {
  return {
    updateAccount: async (req: ValidatedRequest<typeof updateAccountSchemas>, res: Response) => {
      sendData(res, await accounts.updateAccount(authOf(req), req.body));
    },

    changePassword: async (req: ValidatedRequest<typeof changePasswordSchemas>, res: Response) => {
      await accounts.changePassword(authOf(req), req.body, clientInfoOf(req));
      res.status(204).end();
    },
  };
}
