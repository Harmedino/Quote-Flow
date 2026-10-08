import type { Request, Response } from 'express';
import { authOf } from '../middleware/auth';
import type { DashboardService } from '../services/dashboard.service';
import { sendData } from '../utils/response';

export function createDashboardController(dashboard: DashboardService) {
  return {
    getDashboard: async (req: Request, res: Response): Promise<void> => {
      sendData(res, await dashboard.getDashboard(authOf(req)));
    },
  };
}
