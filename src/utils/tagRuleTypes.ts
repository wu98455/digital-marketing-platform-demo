/**
 * 打标规则：图中 8 分析对象为维度；字段对齐旅游云可搜条件。
 * 每维含多组条件：组内且、组间或；多维之间且。
 */

export type MemberTagInstance = {
  group: string;
  tag: string;
  source: string;
};

/** 数值/日期比较 */
export type OpValue = {
  op?: string;
  value?: string | number;
  min?: number | string;
  max?: number | string;
};

export type MemberGroupFields = {
  phone?: string;
  gender?: string[];
  birthdayMonths?: string[];
  starSign?: string[];
  age?: OpValue;
  region?: string;
  customerCompany?: string;
  buyCompany?: string[];
  buyType?: string[];
  firstBuyCompany?: string[];
  latestBuyCompany?: string[];
  registrationRange?: [string, string];
  levelId?: string;
  vipCard?: string;
  createOrderNoType?: string;
  userType?: string;
  realNameType?: string;
};

export type OrderGroupFields = {
  ticketOrderPaymentId?: string;
  orderCode?: string;
  orderStatus?: string[];
  userType?: string;
  buyTicketPhone?: string;
  salesMethod?: string;
  sessionType?: string;
  projectName?: string;
  categorysId?: string;
  supplierId?: string;
  createTimeRange?: [string, string];
  refuseTimeRange?: [string, string];
  verificationRange?: [string, string];
  moveOrder?: string;
  sourceProject?: string;
  orderTypeParent?: string;
  orderType?: string;
  activityType?: string;
  isDistributionNew?: string;
  distributionUserName?: string;
  distributionUserCode?: string;
  /** RFM / 行为 */
  lifeCycle?: string[];
  amount?: OpValue;
  frequency?: OpValue;
  avgUnitPrice?: OpValue;
  customerBuyGoodsName?: string;
  latestOrderDate?: OpValue;
  latestCheckDate?: OpValue;
  latestRefundDate?: OpValue;
  purchaseProductNum?: OpValue;
  behaviorOrderStatus?: string[];
};

export type ProductGroupFields = {
  projectName?: string;
  buyType?: string[];
  buyCompany?: string[];
  supplierId?: string;
  categorysId?: string;
  projectTypeId?: string;
  recentBuyApprox?: OpValue;
};

export type ComboGroupFields = {
  projectName?: string;
  buyType?: string[];
  isPackageTicket?: string;
};

export type CampaignGroupFields = {
  channelName?: string;
  promoteType?: string;
  activityType?: string;
  activityStatus?: string;
  hasOrder?: string;
};

export type CouponGroupFields = {
  name?: string;
  discountType?: string;
  status?: string;
};

export type PointsGroupFields = {
  projectName?: string;
  integralMin?: number;
  integralMax?: number;
  salesMethod?: string;
  pointsAction?: string;
};

export type StoredValueGroupFields = {
  orderNumber?: string;
  prodName?: string;
  userPhone?: string;
  status?: string;
  supplierId?: string;
  categoryId?: string;
  isMember?: string;
  tagRef?: string;
  orderDateRange?: [string, string];
  companyName?: string;
  balanceLevel?: string;
  vipCard?: string;
  cardName?: string;
  familyApprox?: string;
};

export type UserBehaviorGroupFields = {
  timeNode?: string;
  eventCondition?: string;
  dataFeedback?: string;
  interactionBehavior?: string;
};

export type ConditionGroupMap = {
  member: MemberGroupFields;
  order: OrderGroupFields;
  product: ProductGroupFields;
  combo: ComboGroupFields;
  campaign: CampaignGroupFields;
  coupon: CouponGroupFields;
  points: PointsGroupFields;
  storedValue: StoredValueGroupFields;
  userBehavior: UserBehaviorGroupFields;
};

export type DimKey = keyof ConditionGroupMap;

export type DimConditions<K extends DimKey = DimKey> = {
  groups: ConditionGroupMap[K][];
};

export type TagRuleConditions = {
  [K in DimKey]: DimConditions<K>;
};

export type TagRule = {
  id: string;
  name: string;
  targetTag: { group: string; tag: string };
  conditions: TagRuleConditions;
  enabled: boolean;
  lastRunAt?: string;
  lastRunCount?: number;
  creator?: string;
  updatedAt: string;
  createdAt: string;
};

export type PreviewSample = {
  id: string;
  memberId: string;
  name: string;
  phoneMasked: string;
  /** 命中来源说明 */
  source: string;
};

export const CONDITION_OPS = [
  { label: '等于', value: 'EQUAL' },
  { label: '不等于', value: 'NOT_EQUAL' },
  { label: '大于', value: 'GREATER_THAN' },
  { label: '大于等于', value: 'GREATER_THAN_OR_EQUAL' },
  { label: '小于', value: 'LESS_THAN' },
  { label: '小于等于', value: 'LESS_THAN_OR_EQUAL' },
  { label: '介于', value: 'BETWEEN' },
];

export function emptyGroup<K extends DimKey>(_key: K): ConditionGroupMap[K] {
  return {} as ConditionGroupMap[K];
}

export function emptyTagRuleConditions(): TagRuleConditions {
  return {
    member: { groups: [{}] },
    order: { groups: [{}] },
    product: { groups: [{}] },
    combo: { groups: [{}] },
    campaign: { groups: [{}] },
    coupon: { groups: [{}] },
    points: { groups: [{}] },
    storedValue: { groups: [{}] },
    userBehavior: { groups: [{}] },
  };
}

function filledCount(obj: Record<string, unknown> | undefined): number {
  if (!obj) return 0;
  return Object.values(obj).filter((v) => {
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return filledCount(v as Record<string, unknown>) > 0;
    return true;
  }).length;
}

export function estimateCount(conditions?: TagRuleConditions | Record<string, unknown>): number {
  const c = (conditions || {}) as Partial<TagRuleConditions>;
  let n = 160;
  (Object.keys(emptyTagRuleConditions()) as DimKey[]).forEach((dim) => {
    const groups = c[dim]?.groups || [];
    const active = groups.filter((g) => filledCount(g as Record<string, unknown>) > 0);
    if (!active.length) return;
    let best = 0.35;
    active.forEach((g) => {
      const cnt = filledCount(g as Record<string, unknown>);
      best = Math.max(best, Math.max(0.2, 1 - cnt * 0.08));
    });
    n = Math.floor(n * best * (1 + (active.length - 1) * 0.12));
  });
  return Math.max(3, Math.min(500, n));
}

/** 根据条件生成演示「来源」文案 */
export function describeConditionSources(
  conditions?: TagRuleConditions | Record<string, unknown>,
): string[] {
  const labels: Record<DimKey, string> = {
    member: '会员',
    order: '订单',
    product: '商品与供应商',
    combo: '联票与策略',
    campaign: '活动专题',
    coupon: '优惠券',
    points: '积分商城',
    storedValue: '优品/储值卡',
    userBehavior: '用户行为',
  };
  const c = (conditions || {}) as Partial<TagRuleConditions>;
  const out: string[] = [];
  (Object.keys(labels) as DimKey[]).forEach((dim) => {
    const groups = c[dim]?.groups || [];
    groups.forEach((g, i) => {
      const keys = Object.keys(g as object).filter((k) => {
        const v = (g as Record<string, unknown>)[k];
        if (v === undefined || v === null || v === '') return false;
        if (Array.isArray(v)) return v.length > 0;
        return true;
      });
      if (!keys.length) return;
      out.push(`${labels[dim]}·条件组${i + 1}(${keys.slice(0, 2).join('/')})`);
    });
  });
  return out.length ? out : ['未配置条件'];
}

export function nowStr() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function tagKeyOf(group: string, tag: string) {
  return `${group}::${tag}`;
}

export function samplesFromConditions(
  conditions?: TagRuleConditions | Record<string, unknown>,
): PreviewSample[] {
  const count = Math.min(5, estimateCount(conditions));
  const sources = describeConditionSources(conditions);
  const sourceStr = sources.join('；');
  const names = ['张三', '李四', '王五', '赵六', '钱七'];
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    memberId: `M${10000 + i}`,
    name: names[i] || `会员${i + 1}`,
    phoneMasked: `138****${String(1000 + i).slice(-4)}`,
    source: sourceStr,
  }));
}
