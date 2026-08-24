import type { Request, Response } from 'express';
import { buildAnalyticsOverview } from '../src/utils/analyticsOverview';

/** 开发态 Umi mock：经营分析概览（与 demoApiRouter 口径一致） */
export default {
  'GET /api/analytics/overview': (req: Request, res: Response) => {
    res.json({
      success: true,
      data: buildAnalyticsOverview(
        String(req.query.centers || ''),
        String(req.query.range || '30d'),
      ),
    });
  },
};
