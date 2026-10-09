import type { AuthContext } from '../services/access-token.service';

declare global {
  namespace Express {
    interface Request {
      /** The signed-in user, set by `requireAuth` on protected routes. Read it with `authOf(req)`. */
      auth?: AuthContext;
    }
  }
}
