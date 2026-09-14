import type { ActiveDimKey, DimKey } from '@/utils/tagRuleTypes';

export type FilterOption = { key: string; label: string };

/** 各维度可选筛选项（不含行为动作的联动附属字段；不含已下线 product/combo） */
export const DIM_FILTER_CATALOG: Record<ActiveDimKey, FilterOption[]> = {
  member: [
    { key: 'customerCompany', label: '数据范围/公司' },
    { key: 'gender', label: '性别' },
    { key: 'birthdayMonths', label: '生日月份' },
    { key: 'age', label: '年龄' },
    { key: 'region', label: '地区' },
    { key: 'buyCompany', label: '买过的公司' },
    { key: 'buyType', label: '买过的产品类型' },
    { key: 'firstBuyCompany', label: '首次购买公司' },
    { key: 'latestBuyCompany', label: '最后购买公司' },
    { key: 'registrationRange', label: '注册时间' },
    { key: 'levelId', label: '成长值等级' },
    { key: 'vipCard', label: '会员卡' },
    { key: 'createOrderNoType', label: '下单次数档' },
    { key: 'userType', label: '账户类型' },
    { key: 'phone', label: '手机号' },
  ],
  order: [
    { key: 'ticketOrderPaymentId', label: '主订单编号' },
    { key: 'orderCode', label: '订单编号' },
    { key: 'orderStatus', label: '订单状态' },
    { key: 'userType', label: '用户类型' },
    { key: 'buyTicketPhone', label: '手机号' },
    { key: 'salesMethod', label: '售卖方式' },
    { key: 'sessionType', label: '规格类型' },
    { key: 'projectName', label: '商品名称' },
    { key: 'categorysId', label: '分类' },
    { key: 'supplierId', label: '供应商' },
    { key: 'productTags', label: '商品标签' },
    { key: 'supplierTags', label: '供应商标签' },
    { key: 'createTimeRange', label: '下单日期' },
    { key: 'refuseTimeRange', label: '退单日期' },
    { key: 'verificationRange', label: '完成日期' },
    { key: 'sourceProject', label: '商品来源' },
    { key: 'orderType', label: '销售渠道' },
    { key: 'activityType', label: '订单类型' },
    { key: 'isDistributionNew', label: '是否分销订单' },
    { key: 'distributionUserName', label: '分销人姓名' },
    { key: 'lifeCycle', label: '客户生命周期' },
    { key: 'amount', label: '购买金额' },
    { key: 'frequency', label: '购买次数' },
    { key: 'avgUnitPrice', label: '平均客单价' },
    { key: 'customerBuyGoodsName', label: '购买商品名称' },
  ],
  campaign: [
    { key: 'channelName', label: '渠道名称' },
    { key: 'promoteType', label: '推广类型' },
    { key: 'activityType', label: '活动类型' },
    { key: 'campaignTags', label: '活动标签' },
    { key: 'hasOrder', label: '是否成交' },
  ],
  coupon: [
    { key: 'name', label: '券名称' },
    { key: 'discountType', label: '券类型' },
    { key: 'status', label: '券状态' },
  ],
  points: [
    { key: 'projectName', label: '积分商品' },
    { key: 'integralBalance', label: '可用积分' },
    { key: 'hasPointsAccount', label: '是否有积分账户' },
    { key: 'salesMethod', label: '售卖方式' },
  ],
  storedValue: [
    { key: 'orderNumber', label: '优品订单号' },
    { key: 'prodName', label: '商品名称' },
    { key: 'userPhone', label: '手机号' },
    { key: 'status', label: '订单状态' },
    { key: 'isMember', label: '是否会员' },
    { key: 'companyName', label: '单位名称' },
    { key: 'balanceLevel', label: '卡余额' },
    { key: 'vipCard', label: '会员卡' },
    { key: 'cardName', label: '卡名称关键词' },
  ],
  userBehavior: [
    { key: 'timeNode', label: '时间节点' },
    { key: 'behaviorActions', label: '行为动作' },
    { key: 'eventCondition', label: '事件条件' },
    { key: 'dataFeedback', label: '数据反馈' },
    { key: 'interactionBehavior', label: '互动行为' },
  ],
};

/** 行为动作联动附属字段（不进弹窗清单，随行为动作出现） */
export const USER_BEHAVIOR_LINKED_KEYS = [
  'browsePages',
  'browseDuration',
  'cartProducts',
  'shareActivities',
  'loginChannels',
  'visitChannels',
  'joinSpecials',
  'searchQuery',
  'detailProducts',
] as const;

export function getGroupKeys(g: Record<string, unknown> | undefined): string[] {
  if (!g) return [];
  if (Array.isArray(g.__keys)) return (g.__keys as string[]).filter(Boolean);
  return Object.keys(g).filter((k) => {
    if (k.startsWith('__')) return false;
    const v = g[k];
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v as object).length > 0;
    return true;
  });
}

export function labelOfFilter(dim: ActiveDimKey | DimKey, key: string): string {
  const list = (DIM_FILTER_CATALOG as Record<string, FilterOption[]>)[dim];
  return list?.find((x) => x.key === key)?.label || key;
}
