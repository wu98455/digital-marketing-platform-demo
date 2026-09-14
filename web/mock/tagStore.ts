import type {
  MemberTagInstance,
  TagRule,
  TagRuleConditions,
} from '../src/utils/tagRuleTypes';
import {
  estimateCount,
  nowStr,
  samplesFromConditions,
  tagKeyOf,
  normalizeTagRuleConditions,
  emptyTagRuleConditions,
} from '../src/utils/tagRuleTypes';

/** 会员标签实例（规则/手工打标结果） */
export const memberTagStore: Record<string, MemberTagInstance[]> = {};

const baseDims = () => ({
  product: { groups: [{}] },
  combo: { groups: [{}] },
});

export let tagRules: TagRule[] = [
  {
    id: 'RULE001',
    name: '近90天订单金额大于等于500打标规则',
    targetTag: { group: '消费类', tag: '近90天订单金额大于等于500' },
    description: '近 90 天订单成交金额大于等于 500',
    conditions: {
      member: { groups: [{}] },
      order: {
        groups: [{ amount: { op: 'GREATER_THAN_OR_EQUAL', value: 500 }, salesMethod: '正常售卖' }],
      },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    enabled: true,
    creator: 'demo',
    lastRunAt: '2026-08-01 10:00:00',
    lastRunCount: 18,
    createdAt: '2026-07-20 09:00:00',
    updatedAt: '2026-08-01 10:00:00',
    calcStatus: 'success',
    calcApplied: true,
  },
  {
    id: 'RULE002',
    name: '领取过召回券未核销打标规则',
    targetTag: { group: '消费类', tag: '领取过召回券未核销' },
    description: '领取召回券且使用状态为未使用',
    conditions: {
      member: { groups: [{}] },
      order: { groups: [{}] },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: {
        groups: [{ status: '启用', name: '召回券', discountType: '减免', useStatuses: ['未使用'] }],
      },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    enabled: true,
    creator: 'WangSiyi',
    createdAt: '2026-07-28 15:00:00',
    updatedAt: '2026-07-28 15:00:00',
    lastRunCount: 12,
    calcStatus: 'success',
    calcApplied: true,
  },
  {
    id: 'RULE003',
    name: '近7天登录次数大于3次打标规则',
    targetTag: { group: '行为类', tag: '近7天登录次数大于3次' },
    description: '近 7 天登录行为次数大于 3',
    conditions: {
      member: { groups: [{}] },
      order: { groups: [{}] },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: {
        groups: [{ timeNode: '近7天', behaviorActions: ['登录'] }],
      },
    },
    enabled: true,
    creator: 'demo',
    createdAt: '2026-08-02 09:00:00',
    updatedAt: '2026-08-02 09:30:00',
    lastRunCount: 26,
    lastRunAt: '2026-08-02 09:30:00',
    calcStatus: 'success',
    calcApplied: true,
  },
  {
    id: 'RULE004',
    name: '优品卡余额大于100打标规则',
    targetTag: { group: '消费类', tag: '优品卡余额大于100' },
    description: '优品/储值卡余额大于 100',
    conditions: {
      member: { groups: [{}] },
      order: { groups: [{}] },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: {
        groups: [{ balance: { op: 'GREATER_THAN', value: 100 } }],
      },
      userBehavior: { groups: [{}] },
    },
    enabled: true,
    creator: 'JiangYajuan',
    createdAt: '2026-08-03 11:00:00',
    updatedAt: '2026-08-03 11:20:00',
    lastRunCount: 9,
    lastRunAt: '2026-08-03 11:20:00',
    calcStatus: 'success',
    calcApplied: true,
  },
  {
    id: 'RULE005',
    name: '端午重宾粽礼意向打标规则',
    targetTag: { group: '节日', tag: '端午重宾粽礼意向' },
    description: '浏览或加购重宾粽礼相关商品（端午场景）',
    conditions: {
      member: { groups: [{}] },
      order: { groups: [{}] },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: {
        groups: [
          {
            behaviorActions: ['浏览', '加购'],
            cartProducts: [['电商类', '重宾粽礼寻香蒲']],
          },
        ],
      },
    },
    enabled: true,
    creator: 'demo',
    createdAt: '2026-08-05 10:00:00',
    updatedAt: '2026-08-05 10:15:00',
    lastRunCount: 15,
    lastRunAt: '2026-08-05 10:15:00',
    calcStatus: 'success',
    calcApplied: true,
  },
  {
    id: 'RULE006',
    name: 'VIP001会员打标规则',
    targetTag: { group: '基础属性', tag: 'VIP001会员' },
    description: '会员等级等于 VIP001',
    conditions: {
      member: { groups: [{ levelId: 'VIP001' }] },
      order: { groups: [{}] },
      ...baseDims(),
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    enabled: true,
    creator: 'WangSiyi',
    createdAt: '2026-07-15 08:00:00',
    updatedAt: '2026-07-15 08:10:00',
    lastRunCount: 42,
    lastRunAt: '2026-07-15 08:10:00',
    calcStatus: 'success',
    calcApplied: true,
  },
].map((r) => ({ ...r, conditions: normalizeTagRuleConditions(r.conditions) })) as TagRule[];

/** 由 tagCenter 生成、供人群列表追加的队列 */
export const pendingCrowds: Record<string, any>[] = [];

export function mergeMemberTag(id: string, inst: MemberTagInstance) {
  const prev = memberTagStore[id] || [];
  const key = tagKeyOf(inst.group, inst.tag);
  const next = prev.filter((t) => tagKeyOf(t.group, t.tag) !== key);
  next.push(inst);
  memberTagStore[id] = next;
}

export function applyTagToMembers(
  targetTag: { group: string; tag: string },
  source: string,
  conditions: TagRuleConditions,
) {
  const count = estimateCount(conditions);
  const ids = Array.from({ length: count }, (_, i) => `c${i + 1}`);
  ids.forEach((id) => mergeMemberTag(id, { ...targetTag, source }));
  return { count, ids };
}

export {
  estimateCount,
  nowStr,
  samplesFromConditions,
  normalizeTagRuleConditions,
  emptyTagRuleConditions,
};
