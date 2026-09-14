import type { Request, Response } from 'express';
import { buildAnalyticsOverview } from '../src/utils/analyticsOverview';

/** 开发态 Umi mock：首页概览（与 demoApiRouter 口径一致） */
export default {
  'GET /api/analytics/overview': (req: Request, res: Response) => {
    res.json({
      success: true,
      data: buildAnalyticsOverview(
        String(req.query.centers || ''),
        String(req.query.salesRange || req.query.range || '3d'),
        String(req.query.topRange || req.query.range || '3d'),
      ),
    });
  },
};
