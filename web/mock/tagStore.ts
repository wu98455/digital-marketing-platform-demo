import type {
  MemberTagInstance,
  TagRule,
  TagRuleConditions,
} from '../src/utils/tagRuleTypes';
import {
  emptyTagRuleConditions,
  estimateCount,
  nowStr,
  samplesFromConditions,
  tagKeyOf,
} from '../src/utils/tagRuleTypes';

/** 会员标签实例（规则/手工打标结果） */
export const memberTagStore: Record<string, MemberTagInstance[]> = {};

export let tagRules: TagRule[] = [
  {
    id: 'RULE001',
    name: '高价值活跃会员',
    targetTag: { group: '客户价值', tag: '高价值' },
    conditions: {
      ...emptyTagRuleConditions(),
      member: {
        groups: [{ levelId: '金卡', customerCompany: '乐和乐都' }],
      },
      order: {
        groups: [{ amount: { op: 'GREATER_THAN_OR_EQUAL', value: 500 }, salesMethod: '正常售卖' }],
      },
    },
    enabled: true,
    creator: 'demo',
    lastRunAt: '2026-08-01 10:00:00',
    lastRunCount: 18,
    createdAt: '2026-07-20 09:00:00',
    updatedAt: '2026-08-01 10:00:00',
  },
  {
    id: 'RULE002',
    name: '领券未核销召回',
    targetTag: { group: '生命周期', tag: '沉默' },
    conditions: {
      ...emptyTagRuleConditions(),
      coupon: {
        groups: [{ status: '已领取未核销', name: '召回券' }],
      },
      member: {
        groups: [{ createOrderNoType: '1次' }, { createOrderNoType: '0次' }],
      },
    },
    enabled: true,
    creator: 'WangSiyi',
    createdAt: '2026-07-28 15:00:00',
    updatedAt: '2026-07-28 15:00:00',
  },
];

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
  ids.forEach((id) => {
    mergeMemberTag(id, { ...targetTag, source });
  });
  return { count, ids };
}

export { estimateCount, nowStr, samplesFromConditions, emptyTagRuleConditions };
