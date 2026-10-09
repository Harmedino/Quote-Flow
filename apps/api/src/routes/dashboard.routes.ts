import { type RequestHandler, Router } from 'express';
import { createDashboardController } from '../controllers/dashboard.controller';
import { noStore } from '../middleware/no-store';
import { createDashboardService } from '../services/dashboard.service';
import type { Clock } from '../utils/clock';

export interface DashboardRouterOptions {
  requireAuth: RequestHandler;
  clock: Clock;
}

export function createDashboardRouter({ requireAuth, clock }: DashboardRouterOptions): Router {
  const controller = createDashboardController(createDashboardService({ clock }));
  const router = Router();
  router.use(noStore, requireAuth);
  router.get('/', controller.getDashboard);
  return router;
}
