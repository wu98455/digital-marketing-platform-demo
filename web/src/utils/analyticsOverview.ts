export type MarketingOverviewMetrics = {
  /** 营销总金额（归因成交金额） */
  marketingAmount: number;
  /** 营销次数（活动执行次数） */
  marketingTimes: number;
  /** 转化人数（归因成交去重人数） */
  convertUsers: number;
  /** 转化率 = 转化人数 / 营销触达人数 */
  convertRate: number;
  /** 口径分母：触达人数（用于计算转化率） */
  reachUsers: number;
};

export type TopActivityRow = {
  id: string;
  name: string;
  /** 营销触达人数 */
  reachUsers: number;
  visitUsers: number;
  cartUsers: number;
  orderUsers: number;
  /** 营销方式，如 短信 / 企微 / 短信+企微 */
  channel: string;
  /** 活动时间展示 */
  activityTime: string;
};

export type AssetOverviewRow = {
  center: string;
  potential: number;
  active: number;
  silent: number;
  churned: number;
  total: number;
};

/** 通道用量（非余额） */
export type ChannelUsage = {
  smsSent: number;
  wecomPushes: number;
};

export type AnalyticsRange = '3d' | '7d' | '30d';

const RANGE_MUL: Record<string, number> = {
  '3d': 0.18,
  '7d': 0.4,
  '30d': 1,
};

function mulOf(range: string) {
  return RANGE_MUL[range] ?? 1;
}

function buildMarketingMetrics(factor: number, range: string): MarketingOverviewMetrics {
  const m = mulOf(range);
  const reachUsers = Math.floor(28600 * factor * m);
  const convertUsers = Math.floor(1680 * factor * m);
  return {
    marketingAmount: Number((428600 * factor * m).toFixed(2)),
    marketingTimes: Math.max(1, Math.floor(18 * factor * m)),
    convertUsers,
    reachUsers,
    convertRate: reachUsers > 0 ? Number(((convertUsers / reachUsers) * 100).toFixed(2)) : 0,
  };
}

function buildTopActivities(factor: number, range: string): TopActivityRow[] {
  const m = mulOf(range);
  const seeds: { id: string; name: string; channel: string; activityTime: string; base: number }[] = [
    {
      id: 'ACT202603',
      name: '中秋团圆礼遇触达',
      channel: '短信+企微',
      activityTime: '2026-05-28 ~ 2026-06-05',
      base: 12840,
    },
    {
      id: 'ACT202607',
      name: '沉默大会员唤醒',
      channel: '短信',
      activityTime: '2026-06-01 ~ 2026-06-15',
      base: 8600,
    },
    {
      id: 'ACT202605',
      name: '乐和乐都亲子年卡召回',
      channel: '企微',
      activityTime: '2026-06-08 ~ 2026-06-20',
      base: 5200,
    },
    {
      id: 'ACT202604',
      name: '高价值客户专属礼',
      channel: '短信+小程序发券',
      activityTime: '2026-06-10 ~ 2026-06-18',
      base: 3200,
    },
    {
      id: 'ACT202610',
      name: '国企优品会员日促销',
      channel: '短信+企微',
      activityTime: '2026-06-12 ~ 2026-06-22',
      base: 9100,
    },
    {
      id: 'ACT202612',
      name: '惠游重庆新客礼遇',
      channel: '短信',
      activityTime: '2026-06-15 ~ 2026-06-25',
      base: 4500,
    },
    {
      id: 'ACT202601',
      name: '亲子乐园年卡意向转化',
      channel: '企微',
      activityTime: '2026-06-18 ~ 2026-06-28',
      base: 6800,
    },
    {
      id: 'ACT202602',
      name: '国企优品复购激励',
      channel: '短信+企微',
      activityTime: '2026-06-20 ~ 2026-06-30',
      base: 7400,
    },
    {
      id: 'ACT202606',
      name: '文旅周末短途推送',
      channel: '短信',
      activityTime: '2026-07-01 ~ 2026-07-07',
      base: 3900,
    },
    {
      id: 'ACT202608',
      name: '会员日专属券包',
      channel: '小程序发券',
      activityTime: '2026-07-03 ~ 2026-07-10',
      base: 5600,
    },
    {
      id: 'ACT202609',
      name: '沉睡用户短信召回',
      channel: '短信',
      activityTime: '2026-07-05 ~ 2026-07-15',
      base: 10200,
    },
    {
      id: 'ACT202611',
      name: '企微社群运营触达',
      channel: '企微',
      activityTime: '2026-07-08 ~ 2026-07-18',
      base: 2800,
    },
  ];
  return seeds
    .map((s, i) => {
      const reachUsers = Math.floor(s.base * factor * m * (1 - i * 0.01));
      return {
        id: s.id,
        name: s.name,
        reachUsers,
        visitUsers: Math.floor(reachUsers * (0.28 + (i % 5) * 0.03)),
        cartUsers: Math.floor(reachUsers * (0.12 + (i % 4) * 0.02)),
        orderUsers: Math.floor(reachUsers * (0.06 + (i % 3) * 0.015)),
        channel: s.channel,
        activityTime: s.activityTime,
      };
    })
    .sort((a, b) => b.reachUsers - a.reachUsers);
}

/** 首页概览 Mock 数据（本地 mock / Pages demoApiRouter 共用） */
export function buildAnalyticsOverview(
  centersRaw: string,
  salesRange: string = '3d',
  topRange: string = '3d',
) {
  const centers = String(centersRaw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list =
    centers.length > 0 ? centers : ['长寿工惠', '山城工惠', '国企优品', '文旅惠'];
  const factor = Math.max(1, list.length);

  /** 资产 / 通道不跟营销总览时间联动，避免切换近 N 天误刷新其他板块 */
  const assetOverview: AssetOverviewRow[] = list.map((center, i) => {
    const potential = Math.floor((3200 + i * 480) * factor * 0.4);
    const active = Math.floor((5100 + i * 620) * factor * 0.4);
    const silent = Math.floor((1800 + i * 210) * factor * 0.4);
    const churned = Math.floor((900 + i * 95) * factor * 0.4);
    return {
      center,
      potential,
      active,
      silent,
      churned,
      total: potential + active + silent + churned,
    };
  });

  const channelUsage: ChannelUsage = {
    smsSent: Math.floor(42680 * factor),
    wecomPushes: Math.floor(12840 * factor),
  };

  const now = new Date();
  const updatedAt = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:00:00`;

  return {
    updatedAt,
    marketingOverview: buildMarketingMetrics(factor, salesRange),
    activityEntryCounts: {
      designing: 6 + factor,
      pendingApprove: Math.max(1, factor - 1),
      running: 2 + (factor % 3),
      finished: 3 + factor,
    },
    channelUsage,
    topActivities: buildTopActivities(factor, topRange),
    assetOverview,
  };
}
