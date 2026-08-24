/** 经营分析概览 Mock 数据（本地 mock / Pages demoApiRouter 共用） */
export function buildAnalyticsOverview(centersRaw: string, range = '30d') {
  const centers = String(centersRaw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const list =
    centers.length > 0 ? centers : ['长寿工惠', '山城工惠', '国企优品', '文旅惠'];
  const factor = Math.max(1, list.length);
  const rangeDays = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const highValue = 820 * factor;
  const untouched = Math.floor(highValue * 0.35);
  const unit = 0.05;
  const trendDays = Math.min(rangeDays, 14);
  const trend = Array.from({ length: trendDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (trendDays - 1 - i));
    const day = d.toISOString().slice(0, 10);
    const base = 800 * factor + i * 12;
    return {
      date: day,
      browse: base + 120,
      cart: Math.floor(base * 0.32),
      share: Math.floor(base * 0.11),
      order: Math.floor(base * 0.06),
    };
  });
  return {
    kpi: {
      activeOneId: 12600 * factor,
      highValue,
      reached: 4300 * factor,
      reachRate: 72.5,
      estimatedCost: Number((untouched * unit).toFixed(2)),
      deltas: { activeOneId: 4.2, highValue: 1.8, reached: -2.1 },
    },
    valueLayers: [
      { name: '高价值', count: highValue },
      { name: '中价值', count: 2100 * factor },
      { name: '低价值', count: 3600 * factor },
      { name: '沉睡召回', count: 1500 * factor },
      { name: '新客', count: 980 * factor },
    ],
    opportunities: [
      {
        name: '高价值未触达·30天',
        centers: list.slice(0, 2),
        oneIdCount: untouched,
        estimatedCost: Number((untouched * unit).toFixed(2)),
      },
      {
        name: '沉睡召回·亲子游',
        centers: [list[0]],
        oneIdCount: 620 * factor,
        estimatedCost: Number((620 * factor * unit).toFixed(2)),
      },
      {
        name: '新客首单转化',
        centers: list.slice(0, 1),
        oneIdCount: 410 * factor,
        estimatedCost: Number((410 * factor * unit).toFixed(2)),
      },
    ],
    funnel: [
      { name: '浏览', count: 28000 * factor },
      { name: '加购', count: 9200 * factor },
      { name: '分享', count: 3100 * factor },
      { name: '下单', count: 1800 * factor },
      { name: '核销', count: 1260 * factor },
    ],
    trend,
    centerCompare: list.map((center, i) => ({
      center,
      highValue: Math.floor(highValue / list.length) + i * 40,
      activeOneId: Math.floor((12600 * factor) / list.length) + i * 120,
    })),
    recentActivities: [
      {
        id: 'ACT202603',
        name: '文旅新客召回-演示',
        centers: [list[0]],
        entered: 5000,
        success: 3600,
        failed: 400,
      },
      {
        id: 'ACT202604',
        name: '高价值会员关怀',
        centers: list.slice(0, 2),
        entered: 3200,
        success: 2500,
        failed: 180,
      },
    ],
    costBreakdown: [
      { channel: '短信', amount: Number((untouched * unit * 0.55).toFixed(2)) },
      { channel: '企微发消息', amount: Number((untouched * unit * 0.2).toFixed(2)) },
      { channel: '小程序发券', amount: Number((untouched * 2.5).toFixed(2)) },
    ],
  };
}
