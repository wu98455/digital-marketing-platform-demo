import { systemAdminHandlers } from './systemAdminHandlers';
import { appendAudit, validateActivityApprover } from './systemAdminStore';
import {
  beginCalculating,
  loadPersistedJson,
  LS_CROWDS,
  LS_TAG_RULES,
  resolveCalcFields,
  savePersistedJson,
} from './asyncCalc';
import {
  estimateCount as estimateTagCount,
  samplesFromConditions,
  summarizeDimFilters,
  normalizeTagRuleConditions,
  formatConditionsReadable,
} from './tagRuleTypes';
import { mockOneId } from './centers';
import { buildAnalyticsOverview } from './analyticsOverview';

function pageSlice<T>(list: T[], current: string | number = 1, pageSize: string | number = 20) {
  const c = Number(current) || 1;
  const p = Number(pageSize) || 20;
  const start = (c - 1) * p;
  return {
    data: list.slice(start, start + p),
    total: list.length,
    success: true,
    pageSize: p,
    current: c,
  };
}

function pageSliceMarketing<T>(list: T[], current: string | number = 1, pageSize: string | number = 10) {
  const c = Number(current) || 1;
  const p = Number(pageSize) || 10;
  const start = (c - 1) * p;
  return {
    data: list.slice(start, start + p),
    total: list.length,
    success: true,
    pageSize: p,
    current: c,
  };
}

const maskPhone = (p: string) => `${p.slice(0, 3)}****${p.slice(-4)}`;
const maskId = (id: string) => `${id.slice(0, 1)}*****${id.slice(-1)}`;

const CENTER_SEED = ['长寿工惠', '山城工惠', '国企优品', '文旅惠'] as const;
/** 按行循环分配平台；偶发两值便于列表展示 */
const seedCenters = (i: number): string[] => {
  const a = CENTER_SEED[i % CENTER_SEED.length];
  if (i % 7 === 0) {
    const b = CENTER_SEED[(i + 1) % CENTER_SEED.length];
    return a === b ? [a] : [a, b];
  }
  return [a];
};

const topicCampaigns = [
  {
    id: 'A1001',
    name: '金刀峡暑期亲子专题',
    type: '专题',
    channel: '小程序',
    startAt: '2026-07-01',
    endAt: '2026-08-31',
    status: '进行中',
    centers: seedCenters(0),
  },
  {
    id: 'A1002',
    name: '国企优品会员日投放',
    type: '渠道投放',
    channel: '短信',
    startAt: '2026-06-01',
    endAt: '2026-06-30',
    status: '已结束',
    centers: seedCenters(1),
  },
  {
    id: 'A1003',
    name: '中秋景区联票节',
    type: '节日',
    channel: '小程序',
    startAt: '2026-09-10',
    endAt: '2026-09-18',
    status: '未开始',
    centers: seedCenters(2),
  },
  {
    id: 'A1004',
    name: '文创市集线下召回',
    type: '专题',
    channel: '线下',
    startAt: '2026-05-01',
    endAt: '2026-05-07',
    status: '已结束',
    centers: seedCenters(3),
  },
  {
    id: 'A1005',
    name: '沉默大会员站内信唤醒',
    type: '渠道投放',
    channel: '站内信',
    startAt: '2026-07-15',
    endAt: '2026-08-15',
    status: '进行中',
    centers: seedCenters(4),
  },
];

const customers = Array.from({ length: 48 }).map((_, i) => {
  const rawId = `00017c7b8bdaa3de01cb1cda607ee2${String(i).padStart(2, '0')}`;
  const phone = `13${String(400000000 + i * 17).slice(0, 9)}`;
  const regionSeeds = [
    { province: '重庆市', city: '渝中区', district: '解放碑街道' },
    { province: '重庆市', city: '江北区', district: '观音桥街道' },
    { province: '四川省', city: '成都市', district: '武侯区' },
    { province: '贵州省', city: '贵阳市', district: '南明区' },
  ];
  const region = regionSeeds[i % regionSeeds.length];
  const userType = i % 3 === 0 ? '非会员' : '会员';
  return {
    id: `c${i + 1}`,
    customerId: rawId,
    customerIdMasked: maskId(rawId),
    name: i % 5 === 0 ? ['张三', '李四', '王五'][i % 3] : '',
    age: i % 4 === 0 ? 20 + (i % 40) : undefined,
    phone,
    phoneMasked: maskPhone(phone),
    memberPhone: i % 3 === 0 ? maskPhone(phone) : '',
    email: i % 6 === 0 ? `user${i}@example.com` : '',
    province: region.province,
    city: region.city,
    district: region.district,
    gender: ['未知', '男', '女', '未知'][i % 4],
    birthday: i % 7 === 0 ? '1990-05-12' : '',
    constellation: i % 7 === 0 ? '金牛座' : '',
    status: i % 8 === 0 ? '潜在客户' : '正式客户',
    memberId: `M${10000 + i}`,
    memberLevel: ['VIP001', 'VIP002', 'VIP003', 'VIP004', 'VIP005'][i % 5],
    centers: seedCenters(i),
    /** 用户类型：会员 / 非会员 */
    userType,
    availablePoints: userType === '非会员' ? 0 : 20 + ((i * 37) % 2000),
    orderCount: (i * 3) % 40,
    consumeAmount: Number((((i * 17) % 500) + i * 0.13).toFixed(2)),
    pointsExchangeOrderCount: i % 5 === 0 ? (i % 4) : 0,
    enterWay: ['自动', '后台录入', '批量导入', '渠道同步'][i % 4],
    registeredAt: `2026-${String((i % 9) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')} ${String(10 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`,
  };
});

const memberTagStore: Record<string, { group: string; tag: string; source: string }[]> = {};

let tagRules: {
  id: string;
  name: string;
  targetTag: { group: string; tag: string };
  description?: string;
  conditions: Record<string, any>;
  centers?: string[];
  enabled: boolean;
  lastRunAt?: string;
  lastRunCount?: number;
  creator?: string;
  updatedAt: string;
  createdAt: string;
  calcStatus?: 'calculating' | 'success' | 'failed';
  calcStartedAt?: string;
  calcError?: string;
  calcApplied?: boolean;
}[] = loadPersistedJson(LS_TAG_RULES, [
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    centers: seedCenters(0),
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
      campaign: { groups: [{}] },
      coupon: {
        groups: [{ status: '启用', name: '召回券', discountType: '减免', useStatuses: ['未使用'] }],
      },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    centers: seedCenters(1),
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: {
        groups: [{ timeNode: '近7天', behaviorActions: ['登录'] }],
      },
    },
    centers: seedCenters(2),
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: {
        groups: [{ balance: { op: 'GREATER_THAN', value: 100 } }],
      },
      userBehavior: { groups: [{}] },
    },
    centers: seedCenters(3),
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
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
    centers: seedCenters(4),
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
      product: { groups: [{}] },
      combo: { groups: [{}] },
      campaign: { groups: [{}] },
      coupon: { groups: [{}] },
      points: { groups: [{}] },
      storedValue: { groups: [{}] },
      userBehavior: { groups: [{}] },
    },
    centers: seedCenters(0),
    enabled: true,
    creator: 'WangSiyi',
    createdAt: '2026-07-15 08:00:00',
    updatedAt: '2026-07-15 08:10:00',
    lastRunCount: 42,
    lastRunAt: '2026-07-15 08:10:00',
    calcStatus: 'success',
    calcApplied: true,
  },
]);
tagRules = tagRules.map((r) => ({
  ...r,
  conditions: normalizeTagRuleConditions(r.conditions),
}));

const persistTagRules = () => savePersistedJson(LS_TAG_RULES, tagRules);

const resolveTagRule = (rule: (typeof tagRules)[number]) =>
  resolveCalcFields(rule, (draft) => {
    const result = applyTagsToMembers(draft.targetTag, `规则:${draft.name}`, draft.conditions);
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return {
      ...draft,
      lastRunAt: ts,
      lastRunCount: result.count,
      updatedAt: ts,
      enabled: true,
    };
  });

const resolveAllTagRules = () => {
  let changed = false;
  tagRules = tagRules.map((r) => {
    const next = resolveTagRule(r);
    if (next !== r && next.calcStatus !== r.calcStatus) changed = true;
    else if (next.calcApplied !== r.calcApplied) changed = true;
    return next;
  });
  if (changed) persistTagRules();
};

function mergeMemberTag(id: string, inst: { group: string; tag: string; source: string }) {
  const prev = memberTagStore[id] || [];
  const key = `${inst.group}::${inst.tag}`;
  const next = prev.filter((t) => `${t.group}::${t.tag}` !== key);
  next.push(inst);
  memberTagStore[id] = next;
}

function applyTagsToMembers(
  targetTag: { group: string; tag: string },
  source: string,
  conditions: Record<string, any>,
) {
  const count = estimateTagCount(conditions);
  const ids = Array.from({ length: count }, (_, i) => `c${i + 1}`);
  ids.forEach((id) => mergeMemberTag(id, { ...targetTag, source }));
  return { count, ids };
}

let crowds: {
  id: string;
  name: string;
  count: number;
  type: string;
  creator: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  catalog: string;
  canDelete?: boolean;
  canCopy?: boolean;
  centers?: string[];
  calcStatus?: 'calculating' | 'success' | 'failed';
  calcStartedAt?: string;
  calcError?: string;
  calcApplied?: boolean;
  conditions?: Record<string, any>;
  tags?: any[];
}[] = loadPersistedJson(LS_CROWDS, null as any);

if (!crowds) {
  crowds = [
  {
    id: '241075',
    name: '国企优品高价值客户',
    count: 12840,
    type: '静态人群',
    creator: 'JiangYajuan',
    source: '人群工坊',
    createdAt: '2026-03-12 14:22:01',
    updatedAt: '2026-06-01 09:11:20',
    syncStatus: '未同步',
    catalog: '文旅人群',
    canDelete: false,
    canCopy: false,
    centers: seedCenters(0),
  },
  {
    id: '241076',
    name: '近7天浏览金刀峡门票',
    count: 3260,
    type: '临时人群',
    creator: 'demo',
    source: '规则计算',
    createdAt: '2026-07-28 11:00:00',
    updatedAt: '2026-07-28 11:05:00',
    syncStatus: '未同步',
    catalog: '文旅人群',
    canDelete: true,
    canCopy: true,
    centers: seedCenters(1),
  },
  {
    id: '241077',
    name: '金刀峡购后关怀',
    count: 890,
    type: '条件人群',
    creator: 'WangSiyi',
    source: '人群工坊',
    createdAt: '2026-06-18 09:20:00',
    updatedAt: '2026-07-01 16:00:00',
    syncStatus: '同步成功',
    catalog: '业务目录',
    canDelete: true,
    canCopy: true,
    centers: seedCenters(2),
  },
  {
    id: '237295',
    name: '亲子乐园年卡意向客',
    count: 5621,
    type: '条件人群',
    creator: 'WangSiyi',
    source: '人群工坊',
    createdAt: '2026-02-08 10:05:33',
    updatedAt: '2026-05-20 16:40:12',
    syncStatus: '同步成功',
    catalog: '文旅人群',
    canDelete: false,
    canCopy: true,
    centers: seedCenters(3),
  },
  {
    id: '230001',
    name: '游轮航次关注客群',
    count: 932,
    type: '静态人群',
    creator: 'demo',
    source: '人群工坊',
    createdAt: '2026-01-15 11:20:00',
    updatedAt: '2026-04-02 08:00:00',
    syncStatus: '未同步',
    catalog: '未分类',
    canDelete: true,
    canCopy: true,
    centers: seedCenters(4),
  },
  {
    id: '229880',
    name: '惠游重庆新客礼遇',
    count: 3102,
    type: '条件人群',
    creator: 'WangSiyi',
    source: '人群工坊',
    createdAt: '2025-12-01 09:00:00',
    updatedAt: '2026-03-18 12:30:00',
    syncStatus: '同步成功',
    catalog: '文旅人群',
    canDelete: false,
    canCopy: true,
    centers: seedCenters(5),
  },
  {
    id: '228100',
    name: '重宾粽礼意向客群',
    count: 12,
    type: '静态人群',
    creator: 'demo',
    source: '人群工坊',
    createdAt: '2026-07-01 18:00:00',
    updatedAt: '2026-07-01 18:00:00',
    syncStatus: '未同步',
    catalog: '未分类',
    canDelete: true,
    canCopy: true,
    centers: seedCenters(6),
  },
];
  crowds = crowds.map((c) => ({
    ...c,
    calcStatus: c.calcStatus || 'success',
    calcApplied: c.calcApplied ?? true,
  }));
  savePersistedJson(LS_CROWDS, crowds);
}

const persistCrowds = () => savePersistedJson(LS_CROWDS, crowds);

const resolveCrowd = (crowd: (typeof crowds)[number]) =>
  resolveCalcFields(crowd, (draft) => {
    const count = estimateTagCount(draft.conditions || {}) || draft.count || 200;
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    return {
      ...draft,
      count,
      updatedAt: ts,
      canDelete: draft.canDelete !== false,
      canCopy: true,
    };
  });

const resolveAllCrowds = () => {
  let changed = false;
  crowds = crowds.map((c) => {
    const next = resolveCrowd(c);
    if (next.calcStatus !== c.calcStatus || next.count !== c.count || next.calcError !== c.calcError) {
      changed = true;
    }
    return next;
  });
  if (changed) persistCrowds();
};

const shopTags = Array.from({ length: 12 }).map((_, i) => ({
  id: `st${1000 + i}`,
  name:
    ['亲子家庭', '复购顾客', '高价值会员', '节庆礼赠', '景区打卡', '新客礼遇'][i % 6] +
    (i > 5 ? `-${i}` : ''),
  type: ['手工标签', '规则标签'][i % 2],
  group: ['惠游重庆', '国企优品', '文旅惠', '重庆文旅集团大会员'][i % 4],
  operateType: ['自营', '三方'][i % 2],
  syncStatus: ['未同步', '同步成功', '未同步'][i % 3],
  desc: ['消费偏好客群识别', '新客识别', '沉默客召回', '营销互动识别'][i % 4],
  valid: ['永久', '2026-12-31', '2027-06-30'][i % 3],
  perm: ['仅自己', '本部门', '全员'][i % 3],
  taggedCount: 100 + i * 37,
  creator: ['demo', 'WangSiyi', 'JiangYajuan'][i % 3],
  createdAt: `2026-0${(i % 6) + 1}-12 10:00:00`,
}));

const activityTags = Array.from({ length: 8 }).map((_, i) => ({
  id: `at${200 + i}`,
  name: ['金刀峡专题', '暑期游', '夜游重庆', '会员日', '新客礼', '渠道投放A'][i % 6] + (i > 5 ? `-${i}` : ''),
  type: ['手工标签', '规则标签'][i % 2],
  group: ['专题活动', '渠道投放', '节日营销'][i % 3],
  object: '活动',
  syncStatus: ['未同步', '同步成功'][i % 2],
  taggedCount: 3 + i * 2,
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 6) + 1}-08 10:00:00`,
}));

const omniTags = Array.from({ length: 10 }).map((_, i) => ({
  id: `ot${2000 + i}`,
  name: ['RFM-高活', '全渠道新客', '跨店复购', '会员等级A', '潜客'][i % 5] + (i > 4 ? `-${i}` : ''),
  type: ['手工标签', '规则标签'][i % 2],
  group: ['RFM', '生命周期', '行为'][i % 3],
  taggedCount: 200 + i * 51,
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 5) + 1}-08 15:20:00`,
  hasChild: i % 3 === 0,
}));

const importBatches = Array.from({ length: 8 }).map((_, i) => ({
  id: `ib${i + 1}`,
  batchNo: `IMP202607${String(10 + i).padStart(2, '0')}`,
  level: ['店铺标签', '全渠道标签'][i % 2],
  platform: ['全部平台', '文旅惠', '惠游重庆'][i % 3],
  store: ['乐和乐都旗舰店', '惠游重庆', '--'][i % 3],
  group: ['惠游重庆', '国企优品', '文旅惠', '重庆文旅集团大会员'][i % 4],
  matchKey: ['手机号', '全渠道客户ID', '平台账号'][i % 3],
  status: ['成功', '失败', '处理中', '成功'][i % 4],
  successCount: 100 + i * 10,
  failCount: i % 4 === 1 ? 5 + i : 0,
  createdAt: `2026-07-${String(10 + i).padStart(2, '0')} 11:00:00`,
}));

const wecomTags = Array.from({ length: 8 }).map((_, i) => ({
  id: `wc${i + 1}`,
  customerId: customers[i].customerIdMasked,
  tagName: ['意向客户', '已成交', '待跟进', 'VIP'][i % 4],
  nickname: `微信用户${i + 1}`,
  openId: `ox_${1000 + i}`,
  group: ['销售跟进', '会员运营'][i % 2],
  corp: '重庆文旅企微',
}));

const weimobTags = Array.from({ length: 8 }).map((_, i) => ({
  id: `wm${i + 1}`,
  customerId: customers[i].customerIdMasked,
  shop: ['惠游重庆', '国企优品'][i % 2],
  tagName: ['微盟会员', '积分活跃', '优惠券敏感'][i % 3],
  tagValue: ['是', '高', '中'][i % 3],
  wid: `WID${9000 + i}`,
}));

const products = Array.from({ length: 20 }).map((_, i) => ({
  id: `p${i + 1}`,
  name: [
    '乐和乐都双主题乐园年卡',
    '抚仙湖旅居大巴6日游',
    '重庆市歌舞团成人夜校艺术课程',
    '啄木鸟多功能登机箱20英寸',
    '五粮液普五第八代52度500ml',
    '黄金游轮重庆-宜昌豪华标间4天3晚',
    '天友百特轻酸奶250g*10',
    '金刀峡景区大门票',
    '千年金山红178纪念茶100g',
    '奇趣动物来敲门图书套装',
    '洞利萨柬埔寨茉莉香米5KG',
    '统景两江假日酒店',
    '长江奇迹神龙架航次五天四晚',
    '重庆国际马戏城门票',
    '川西小环线4天3晚',
    '重宾粽礼寻香蒲',
  ][i % 16],
  sku: `SKU${10000 + i}`,
  platform: ['惠游重庆', '国企优品', '文旅惠'][i % 3],
  store: ['惠游重庆', '国企优品', '乐和乐都旗舰店'][i % 3],
  status: ['上架', '下架'][i % 2],
  category: ['门票', '住宿', '服务', '零售'][i % 4],
  price: (99 + i * 13).toFixed(2),
  syncedAt: `2026-07-${String((i % 15) + 1).padStart(2, '0')} 09:00:00`,
  tagValues: i % 3 === 0 ? '热销爆款,亲子家庭' : '--',
  centers: seedCenters(i),
}));

const productTags = Array.from({ length: 10 }).map((_, i) => ({
  id: `pt${i + 1}`,
  name: ['热销爆款', '会员专享', '季节限定', '亲子家庭', '企业礼赠'][i % 5] + (i > 4 ? `组${i}` : ''),
  status: ['启用', '停用'][i % 2],
  type: ['手工', '规则'][i % 2],
  productCount: 5 + i * 3,
  group: ['营销属性', '品类属性'][i % 2],
}));

const taggingTasks = Array.from({ length: 6 }).map((_, i) => ({
  id: `tt${i + 1}`,
  tagName: productTags[i % 5].name,
  status: ['执行中', '已完成', '已终止', '待执行'][i % 4],
  startAt: `2026-07-${String(10 + i).padStart(2, '0')} 08:00:00`,
  creator: ['demo', 'WangSiyi'][i % 2],
  batchNo: `IMP202607${String(10 + i).padStart(2, '0')}`,
}));

const ACTIVITY_STATUSES = ['草稿', '待审批', '已通过', '进行中', '已暂停', '已结束', '已驳回'] as const;
const APPROVER_POOL = ['demo', 'WangSiyi', 'JiangYajuan'];

type ActivityRow = {
  id: string;
  name: string;
  status: string;
  catalog: string;
  creator: string;
  createdAt: string;
  /** 正式执行时间；未执行则为空 */
  executedAt?: string;
  periodic: boolean;
  mine: boolean;
  approver: string;
  canEdit: boolean;
  canDelete: boolean;
  pinned: boolean;
  centers: string[];
};

/** 中秋团圆礼遇触达（ACT202603）及置顶副本（ACT202600 / 中秋团圆礼遇触达-1）：选人后双分支（60%/40%）短信→等待→是否购买 */
function isFestivalCare4(item?: { id?: string; name?: string; activityId?: string; activityName?: string } | null) {
  if (!item) return false;
  const id = item.id || item.activityId || '';
  const name = item.name || item.activityName || '';
  return (
    id === 'ACT202603' ||
    id === 'ACT202600' ||
    name === '中秋团圆礼遇触达' ||
    name === '中秋团圆礼遇触达-1' ||
    name === '端午重宾粽礼触达'
  );
}

/** 沉默大会员唤醒（ACT202607）：开始 → 选人 → 发短信 → 发优惠券 → 结束 */
function isSilentWake8(item?: { id?: string; name?: string; activityId?: string; activityName?: string } | null) {
  if (!item) return false;
  const id = item.id || item.activityId || '';
  const name = item.name || item.activityName || '';
  return id === 'ACT202607' || name === '沉默大会员唤醒';
}

const FESTIVAL_SMS_A =
  '【文旅惠】中秋快乐！团圆月饼礼盒限时满减，精选中秋伴手礼打开小程序立即选购。拒收请回复 R';
const FESTIVAL_SMS_B =
  '【文旅惠】中秋佳节至，会员专享月饼券已到账，到店/小程序核销享优惠。详情见活动页。拒收请回复 R';

function festivalCare4DesignNodes() {
  /** 上下分支加大间距；开始(72)与选人(92)按中心对齐，避免连线倾斜 */
  const rowA = 40;
  const rowB = 440;
  const spineCenterY = (rowA + 46 + rowB + 46) / 2;
  const startY = spineCenterY - 36;
  const pickY = spineCenterY - 46;
  return [
    { id: 'n1', name: '开始', type: '开始', config: '即时执行', x: 80, y: startY },
    {
      id: 'n2',
      name: '选人',
      type: '人群',
      config: '目标人群：中秋意向客',
      meta: { audienceSource: 'crowd', crowdName: '中秋意向客' },
      x: 260,
      y: pickY,
    },
    // 分支1 · 60%
    {
      id: 'n3a',
      name: '随机抽取',
      type: '处理',
      config: '按比例抽取 60%',
      meta: { sampleMode: 'ratio', sampleRatio: '60' },
      x: 460,
      y: rowA,
    },
    {
      id: 'n4a',
      name: '发短信',
      type: '触达',
      config: FESTIVAL_SMS_A,
      meta: {
        smsChannel: 'normal',
        smsFreqMode: 'slot',
        smsFreqStart: '09:00',
        smsFreqEnd: '21:00',
        smsFreqAt: '10:00',
        smsTemplateKey: 'A',
        smsContent: FESTIVAL_SMS_A,
        smsPublishAt: '2026-09-15 10:00:00',
      },
      x: 640,
      y: rowA,
    },
    {
      id: 'n5a',
      name: '等待',
      type: '等待',
      config: '等待 3 天',
      meta: { waitAmount: '3', waitUnit: 'day' },
      x: 820,
      y: rowA,
    },
    {
      id: 'n5va',
      name: '是否访问',
      type: '判断',
      config: '是否访问（浏览、活动访问）',
      meta: { visitBehaviorActions: '浏览,活动访问' },
      x: 1000,
      y: rowA,
    },
    {
      id: 'n6a',
      name: '是否购买',
      type: '判断',
      config: '已购买 / 未购买',
      meta: { purchaseScope: 'any' },
      x: 1180,
      y: rowA,
    },
    {
      id: 'n7a',
      name: '小程序发券',
      type: '触达',
      config: '发券·中秋满减券 ×1',
      meta: { couponName: '中秋满减券', couponCount: '1' },
      x: 1360,
      y: rowA,
    },
    { id: 'n8a', name: '结束', type: '结束', config: '完成', x: 1360, y: rowA + 160 },
    // 分支2 · 40%
    {
      id: 'n3b',
      name: '随机抽取',
      type: '处理',
      config: '按比例抽取 40%',
      meta: { sampleMode: 'ratio', sampleRatio: '40' },
      x: 460,
      y: rowB,
    },
    {
      id: 'n4b',
      name: '发短信',
      type: '触达',
      config: FESTIVAL_SMS_B,
      meta: {
        smsChannel: 'normal',
        smsFreqMode: 'slot',
        smsFreqStart: '09:00',
        smsFreqEnd: '21:00',
        smsFreqAt: '10:00',
        smsTemplateKey: 'B',
        smsContent: FESTIVAL_SMS_B,
        smsPublishAt: '2026-09-15 10:00:00',
      },
      x: 640,
      y: rowB,
    },
    {
      id: 'n5b',
      name: '等待',
      type: '等待',
      config: '等待 3 天',
      meta: { waitAmount: '3', waitUnit: 'day' },
      x: 820,
      y: rowB,
    },
    {
      id: 'n5vb',
      name: '是否访问',
      type: '判断',
      config: '是否访问（浏览、活动访问）',
      meta: { visitBehaviorActions: '浏览,活动访问' },
      x: 1000,
      y: rowB,
    },
    {
      id: 'n6b',
      name: '是否购买',
      type: '判断',
      config: '已购买 / 未购买',
      meta: { purchaseScope: 'any' },
      x: 1180,
      y: rowB,
    },
    {
      id: 'n7b',
      name: '小程序发券',
      type: '触达',
      config: '发券·中秋满减券 ×1',
      meta: { couponName: '中秋满减券', couponCount: '1' },
      x: 1360,
      y: rowB,
    },
    { id: 'n8b', name: '结束', type: '结束', config: '完成', x: 1360, y: rowB + 160 },
  ];
}

function festivalCare4DesignEdges() {
  const link = (
    from: string,
    to: string,
    extra?: { label?: string; sourceSide?: string; targetSide?: string },
  ) => ({
    id: `e_${from}_${to}${extra?.label ? `_${extra.label}` : ''}`,
    source: from,
    target: to,
    sourceSide: extra?.sourceSide || 'right',
    targetSide: extra?.targetSide || 'left',
    ...(extra?.label ? { label: extra.label } : {}),
  });
  return [
    /** 开始→选人：同中心水平连线 */
    link('n1', 'n2', { sourceSide: 'right', targetSide: 'left' }),
    /** 选人右端口扇出到上下分支，避免 top/bottom 折线显得歪 */
    link('n2', 'n3a', { sourceSide: 'right', targetSide: 'left' }),
    link('n2', 'n3b', { sourceSide: 'right', targetSide: 'left' }),
    link('n3a', 'n4a'),
    link('n4a', 'n5a'),
    link('n5a', 'n5va'),
    link('n5va', 'n6a'),
    link('n6a', 'n7a', { label: '未购买' }),
    link('n6a', 'n8a', { label: '已购买', sourceSide: 'bottom', targetSide: 'top' }),
    link('n7a', 'n8a', { sourceSide: 'bottom', targetSide: 'top' }),
    link('n3b', 'n4b'),
    link('n4b', 'n5b'),
    link('n5b', 'n5vb'),
    link('n5vb', 'n6b'),
    link('n6b', 'n7b', { label: '未购买' }),
    link('n6b', 'n8b', { label: '已购买', sourceSide: 'bottom', targetSide: 'top' }),
    link('n7b', 'n8b', { sourceSide: 'bottom', targetSide: 'top' }),
  ];
}

function silentWake8DesignNodes() {
  return [
    { id: 'n1', name: '开始', type: '开始', config: '活动触发' },
    { id: 'n2', name: '选人', type: '人群', config: '目标人群包 / 人群标签' },
    { id: 'n3', name: '发短信', type: '触达', config: '沉默唤醒短信' },
    { id: 'n4', name: '发优惠券', type: '触达', config: '唤醒满减券' },
    { id: 'n5', name: '结束', type: '结束', config: '完成' },
  ];
}

function resolveDesignNodes(item?: { id?: string; name?: string; activityId?: string; activityName?: string } | null) {
  if (isFestivalCare4(item)) return festivalCare4DesignNodes();
  if (isSilentWake8(item)) return silentWake8DesignNodes();
  return defaultDesignNodes();
}

function resolveDesignEdges(item?: { id?: string; name?: string; activityId?: string; activityName?: string } | null) {
  if (isFestivalCare4(item)) return festivalCare4DesignEdges();
  return null;
}

function festivalCare4ReportNodes(input?: {
  entered?: number;
  reachSuccess?: number;
  reachFail?: number;
  benefitIssued?: number;
}) {
  const entered = input?.entered ?? 12840;
  const branchA = Math.floor(entered * 0.6);
  const branchB = entered - branchA;
  const smsAOk = Math.floor(branchA * 0.94);
  const smsBOk = Math.floor(branchB * 0.93);
  const convertA = Math.floor(smsAOk * 0.28);
  const convertB = Math.floor(smsBOk * 0.26);
  const failA = smsAOk - convertA;
  const failB = smsBOk - convertB;
  const couponOk = Math.floor((failA + failB) * 0.92);
  return [
    { id: '1', nodeName: '开始', nodeType: '开始', entered: 0, success: 0, failed: 0, duration: '-' },
    { id: '2', nodeName: '选人', nodeType: '人群', entered, success: entered, failed: 0, duration: '30s' },
    {
      id: '3',
      nodeName: '随机抽取',
      nodeType: '处理',
      entered,
      success: entered,
      failed: 0,
      duration: '20s',
    },
    {
      id: '4',
      nodeName: '发短信',
      nodeType: '触达',
      entered,
      success: smsAOk + smsBOk,
      failed: entered - smsAOk - smsBOk,
      duration: '2m',
    },
    {
      id: '5',
      nodeName: '是否购买',
      nodeType: '判断',
      entered: smsAOk + smsBOk,
      success: convertA + convertB,
      failed: failA + failB,
      duration: '3d',
    },
    {
      id: '6',
      nodeName: '小程序发券',
      nodeType: '触达',
      entered: failA + failB,
      success: couponOk,
      failed: failA + failB - couponOk,
      duration: '1m',
    },
    {
      id: '7',
      nodeName: '结束',
      nodeType: '结束',
      entered: convertA + convertB + couponOk,
      success: convertA + convertB + couponOk,
      failed: 0,
      duration: '1s',
    },
  ];
}

/** 节日关怀：漏斗口径——触达成功 = 转换成功 + 转换失败 */
function festivalCare4ReportSummary(entered = 12840) {
  const nodes = festivalCare4ReportNodes({ entered });
  const sms = nodes.find((n) => n.nodeName === '发短信');
  const judge = nodes.find((n) => n.nodeName === '是否购买');
  const coupon = nodes.find((n) => n.nodeName === '小程序发券');
  const convertSuccess = judge?.success ?? 0;
  const convertFail = judge?.failed ?? 0;
  return {
    entered,
    /** 进入「是否购买」的人数，等于转换成功+转换失败 */
    reachSuccess: convertSuccess + convertFail,
    reachFail: sms?.failed ?? 0,
    convertSuccess,
    convertFail,
    benefitIssued: coupon?.success ?? 0,
    hasConvert: true,
  };
}

function silentWake8ReportNodes(input?: {
  entered?: number;
  reachSuccess?: number;
  reachFail?: number;
  benefitIssued?: number;
}) {
  /** 串行：选人 → 短信 → 发券 → 结束；仅成功下流 */
  const entered = input?.entered ?? 9600;
  const smsSuccess = Math.floor(entered * 0.9);
  const smsFail = entered - smsSuccess;
  const couponIn = smsSuccess;
  const couponSuccess = Math.min(couponIn, Math.floor(couponIn * 0.92));
  const couponFail = couponIn - couponSuccess;
  return [
    {
      id: '1',
      nodeName: '开始',
      nodeType: '开始',
      entered: 0,
      success: 0,
      failed: 0,
      duration: '-',
    },
    {
      id: '2',
      nodeName: '选人',
      nodeType: '人群',
      entered,
      success: entered,
      failed: 0,
      duration: '30s',
    },
    {
      id: '3',
      nodeName: '发短信',
      nodeType: '触达',
      entered,
      success: smsSuccess,
      failed: smsFail,
      duration: '2m',
    },
    {
      id: '4',
      nodeName: '发优惠券',
      nodeType: '触达',
      entered: couponIn,
      success: couponSuccess,
      failed: couponFail,
      duration: '1m',
    },
    {
      id: '5',
      nodeName: '结束',
      nodeType: '结束',
      entered: couponSuccess,
      success: couponSuccess,
      failed: 0,
      duration: '1s',
    },
  ];
}

function silentWake8ReportSummary(entered = 9600) {
  const nodes = silentWake8ReportNodes({ entered });
  const sms = nodes.find((n) => n.nodeName === '发短信');
  const coupon = nodes.find((n) => n.nodeName === '发优惠券');
  return {
    entered,
    reachSuccess: sms?.success ?? 0,
    reachFail: sms?.failed ?? 0,
    benefitIssued: coupon?.success ?? 0,
    hasConvert: false,
  };
}

function resolveReportNodes(
  item?: { id?: string; name?: string; activityId?: string; activityName?: string } | null,
  input?: {
    entered?: number;
    reachSuccess?: number;
    reachFail?: number;
    benefitIssued?: number;
  },
) {
  if (isFestivalCare4(item)) return festivalCare4ReportNodes(input);
  if (isSilentWake8(item)) return silentWake8ReportNodes(input);
  if (input?.entered != null) {
    const entered = input.entered;
    const reachSuccess = input.reachSuccess ?? Math.floor(entered * 0.8);
    const reachFail = input.reachFail ?? Math.floor(entered * 0.03);
    return [
      {
        id: '1',
        nodeName: '开始',
        nodeType: '开始',
        entered: 0,
        success: 0,
        failed: 0,
        duration: '-',
      },
      {
        id: '2',
        nodeName: '人群圈选',
        nodeType: '人群',
        entered,
        success: entered,
        failed: 0,
        duration: '45s',
      },
      {
        id: '3',
        nodeName: '小程序站内信',
        nodeType: '触达',
        entered,
        success: reachSuccess,
        failed: reachFail,
        duration: '2m',
      },
      {
        id: '4',
        nodeName: '结束',
        nodeType: '结束',
        entered: reachSuccess,
        success: reachSuccess,
        failed: 0,
        duration: '1s',
      },
    ];
  }
  return defaultReportNodes();
}

function defaultDesignNodes() {
  return [
    { id: 'n1', name: '开始', type: '开始', config: '活动触发' },
    {
      id: 'n2',
      name: '选人',
      type: '人群',
      config: '目标人群 · 高价值客户',
    },
    { id: 'n3', name: '发短信', type: '触达', config: '召回短信模板 A' },
    { id: 'n4', name: '等待', type: '等待', config: '等待 3 天' },
    { id: 'n5', name: '是否购买', type: '判断', config: '已购买 / 未购买' },
    { id: 'n6', name: '小程序发券', type: '触达', config: '酒店满减券' },
    { id: 'n7', name: '结束', type: '结束', config: '完成' },
  ];
}

function defaultReportNodes() {
  return [
    { id: '1', nodeName: '开始', nodeType: '开始', entered: 0, success: 0, failed: 0, duration: '-' },
    { id: '2', nodeName: '人群圈选', nodeType: '人群', entered: 12840, success: 12840, failed: 0, duration: '45s' },
    { id: '3', nodeName: '行为触发', nodeType: '行为', entered: 4200, success: 4180, failed: 20, duration: '实时' },
    { id: '4', nodeName: '小程序站内信', nodeType: '触达', entered: 4180, success: 3900, failed: 280, duration: '2m' },
    { id: '5', nodeName: '发券', nodeType: '优惠', entered: 860, success: 860, failed: 0, duration: '30s' },
    { id: '6', nodeName: '结束', nodeType: '结束', entered: 12600, success: 12600, failed: 0, duration: '1s' },
  ];
}

let activities: ActivityRow[] = Array.from({ length: 16 }).map((_, i) => {
  const status = ACTIVITY_STATUSES[i % ACTIVITY_STATUSES.length];
  const creator = APPROVER_POOL[i % 3];
  const approver = APPROVER_POOL[(i + 1) % 3];
  const createdAt = `2026-0${(i % 6) + 1}-${String(10 + (i % 15)).padStart(2, '0')} 10:00:00`;
  const executed =
    status === '进行中' || status === '已暂停' || status === '已结束'
      ? `2026-0${(i % 6) + 1}-${String(12 + (i % 10)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:30:00`
      : undefined;
  return {
    id: `ACT${202600 + i}`,
    name: ['乐和乐都亲子年卡召回', '国企优品会员日促销', '沉默大会员唤醒', '中秋团圆礼遇触达', '高价值客户专属礼'][i % 5],
    status,
    catalog: ['文旅营销', '业务目录', '未分类'][i % 3],
    creator,
    createdAt,
    executedAt: executed,
    periodic: i % 4 === 0,
    mine: creator === 'demo',
    approver: status === '待审批' && i % 7 === 1 ? 'demo' : approver,
    canEdit: ['草稿', '已驳回', '已通过'].includes(status),
    canDelete: !['进行中', '已暂停'].includes(status),
    pinned: i === 0,
    centers: seedCenters(i),
  };
});

(() => {
  /** 演示：至少一条待我（demo）审批；另保留一条非 demo 审批人，便于对比可见性 */
  const pendings = activities.filter((a) => a.status === '待审批');
  if (pendings[0]) pendings[0].approver = 'demo';
  if (pendings[1]) pendings[1].approver = 'WangSiyi';
  const draft = activities.find((a) => a.status === '草稿');
  if (draft) {
    draft.approver = 'WangSiyi';
    draft.creator = 'demo';
    draft.mine = true;
  }
  const approved = activities.find((a) => a.status === '已通过');
  if (approved) {
    approved.approver = 'WangSiyi';
    approved.creator = 'demo';
    approved.mine = true;
  }
  const paused = activities.find((a) => a.status === '已暂停');
  if (paused) {
    paused.canEdit = false;
    paused.canDelete = false;
  }
  const silentWake8 = activities.find((a) => a.id === 'ACT202607' || a.name === '沉默大会员唤醒');
  if (silentWake8) {
    silentWake8.status = '已结束';
    silentWake8.canEdit = false;
    silentWake8.canDelete = true;
  }
  /** 置顶活动：同中秋画布内容，仅改名，不改状态 */
  const pinnedAct = activities.find((a) => a.pinned) || activities.find((a) => a.id === 'ACT202600');
  if (pinnedAct) {
    pinnedAct.name = '中秋团圆礼遇触达-1';
  }
  /** 已结束活动必须有执行时间 */
  activities.forEach((a) => {
    if (a.status === '已结束' && !a.executedAt) {
      a.executedAt = a.createdAt?.replace('10:00:00', '09:30:00') || '2026-07-08 10:00:00';
    }
  });
})();

function findActivityRow(id: string) {
  return activities.find((a) => a.id === id);
}

function patchActivityRow(id: string, patch: Partial<ActivityRow>) {
  const idx = activities.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  activities[idx] = { ...activities[idx], ...patch };
  return activities[idx];
}

function isExecutedActivityStatus(status: string) {
  return ['进行中', '已暂停', '已结束'].includes(status);
}

let localTemplates = Array.from({ length: 10 }).map((_, i) => ({
  id: `TPL${100 + i}`,
  name: ['亲子乐园欢迎流程', '游轮复购激励', '会员生日关怀', '沉默会员召回'][i % 4],
  catalog: ['文旅营销', '业务目录', '未分类'][i % 3],
  target: ['全渠道会员', '店铺会员', '潜客'][i % 3],
  category: ['召回', '促活', '关怀'][i % 3],
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 5) + 1}-15 14:00:00`,
  mine: i % 2 === 0,
  periodic: i % 3 === 0,
  centers: seedCenters(i),
}));

const activityExecRecords = Array.from({ length: 20 }).map((_, i) => {
  const status = ['待执行', '执行中', '成功', '失败', '部分成功'][i % 5];
  const targetCount = 8000 + i * 137;
  const reachSuccess = status === '待执行' ? 0 : Math.floor(targetCount * (0.7 + (i % 5) * 0.04));
  const reachFail = status === '待执行' ? 0 : Math.floor(targetCount * (0.02 + (i % 4) * 0.01));
  const day = String(20 - (i % 15)).padStart(2, '0');
  const hour = String(8 + (i % 10)).padStart(2, '0');
  return {
    id: `AER${i + 1}`,
    activityId: `ACT${202600 + (i % 8)}`,
    activityName: ['乐和乐都亲子年卡召回', '国企优品会员日促销', '沉默大会员唤醒', '中秋团圆礼遇触达'][i % 4],
    periodic: i % 3 === 0,
    status,
    startAt: status === '待执行' ? '' : `2026-07-${day} ${hour}:05:00`,
    endAt: ['待执行', '执行中'].includes(status) ? '' : `2026-07-${day} ${hour}:40:00`,
    targetCount,
    reachSuccess,
    reachFail,
    centers: seedCenters(i),
  };
});

type RouteContext = {
  params: Record<string, any>;
  pathParams: Record<string, string>;
  data?: any;
};

type RouteDef = {
  method: string;
  path: string;
  handler: (ctx: RouteContext) => any;
};

function parseUrl(url?: string): { pathname: string; query: Record<string, string> } {
  if (!url) {
    return { pathname: '', query: {} };
  }

  let pathname = url;
  const query: Record<string, string> = {};

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      pathname = parsed.pathname;
      parsed.searchParams.forEach((value, key) => {
        query[key] = value;
      });
      return { pathname, query };
    } catch {
      /* fall through */
    }
  }

  const qIndex = url.indexOf('?');
  if (qIndex >= 0) {
    pathname = url.slice(0, qIndex);
    const search = url.slice(qIndex + 1);
    new URLSearchParams(search).forEach((value, key) => {
      query[key] = value;
    });
  }

  return { pathname, query };
}

function matchPath(pathname: string, template: string): Record<string, string> | null {
  const normalize = (p: string) => p.replace(/\/+$/, '').split('/').filter(Boolean);
  const pathSegs = normalize(pathname);
  const tplSegs = normalize(template);

  if (pathSegs.length !== tplSegs.length) {
    return null;
  }

  const pathParams: Record<string, string> = {};
  for (let i = 0; i < tplSegs.length; i += 1) {
    const tpl = tplSegs[i];
    const seg = pathSegs[i];
    if (tpl.startsWith(':')) {
      pathParams[tpl.slice(1)] = decodeURIComponent(seg);
    } else if (tpl !== seg) {
      return null;
    }
  }
  return pathParams;
}

const routes: RouteDef[] = [
  {
    method: 'GET',
    path: '/api/analytics/overview',
    handler: ({ params }) => ({
      success: true,
      data: buildAnalyticsOverview(
        String(params.centers || ''),
        String(params.salesRange || params.range || '3d'),
        String(params.topRange || params.range || '3d'),
      ),
    }),
  },
  {
    method: 'GET',
    path: '/api/tag-center/campaigns',
    handler: ({ params }) => pageSlice(topicCampaigns, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/customers',
    handler: ({ params }) => {
      const {
        current = 1,
        pageSize = 20,
        customerId,
        phone,
        name,
        tagKey,
        tagKeys,
        oneId,
        center,
        userType,
        gender,
        ageMin,
        ageMax,
        regionPath,
      } = params;
      let list = customers.map((c, idx) => {
        const storeTags = memberTagStore[c.id] || [];
        const tagGroups: Record<string, string[]> = {};
        storeTags.forEach((t) => {
          tagGroups[t.group] = tagGroups[t.group] || [];
          if (!tagGroups[t.group].includes(t.tag)) tagGroups[t.group].push(t.tag);
        });
        return {
          ...c,
          oneId: (c as any).oneId || mockOneId(idx + 1),
          centers: (c as any).centers?.length ? (c as any).centers : seedCenters(idx),
          tagInstances: storeTags,
          tags: Object.keys(tagGroups).map((group) => ({ group, tags: tagGroups[group] })),
        };
      });
      if (customerId) {
        list = list.filter(
          (x) =>
            x.customerId.includes(String(customerId)) ||
            x.customerIdMasked.includes(String(customerId)),
        );
      }
      if (phone) {
        list = list.filter(
          (x) => x.phone.includes(String(phone)) || x.phoneMasked.includes(String(phone)),
        );
      }
      if (name) {
        list = list.filter((x) => (x.name || '').includes(String(name)));
      }
      if (oneId) {
        list = list.filter((x) => String((x as any).oneId || '').includes(String(oneId)));
      }
      if (center) {
        list = list.filter((x) => ((x as any).centers || []).includes(String(center)));
      }
      if (userType && userType !== '不限') {
        list = list.filter((x) => String((x as any).userType || '') === String(userType));
      }
      if (gender && gender !== '不限') {
        list = list.filter((x) => String(x.gender || '未知') === String(gender));
      }
      if (ageMin !== undefined && ageMin !== '') {
        list = list.filter((x) => (x.age ?? -1) >= Number(ageMin));
      }
      if (ageMax !== undefined && ageMax !== '') {
        list = list.filter((x) => (x.age ?? 999) <= Number(ageMax));
      }
      if (regionPath) {
        const paths = String(regionPath)
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean);
        if (paths.length) {
          list = list.filter((x) => {
            const full = [x.province, x.city, x.district].filter(Boolean).join('/');
            return paths.some((p) => full.startsWith(p) || p.split('/').every((seg, i) => [x.province, x.city, x.district][i] === seg));
          });
        }
      }
      const keyList = [
        ...(tagKey ? [String(tagKey)] : []),
        ...(tagKeys
          ? String(tagKeys)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []),
      ];
      if (keyList.length) {
        list = list.filter((x) =>
          keyList.every((k) => {
            const [g, t] = k.split('::');
            return (x.tagInstances || []).some((ti) => ti.group === g && ti.tag === t);
          }),
        );
      }
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/customers/:id',
    handler: ({ pathParams }) => {
      const idx = customers.findIndex((c) => c.id === pathParams.id);
      const item = (idx >= 0 ? customers[idx] : customers[0]) as any;
      const storeTags = memberTagStore[item.id] || [];
      return {
        success: true,
        data: {
          ...item,
          oneId: item.oneId || mockOneId(idx >= 0 ? idx + 1 : 1),
          centers: item.centers?.length ? item.centers : seedCenters(idx >= 0 ? idx : 0),
          tagInstances: storeTags,
          customerIdFull: item.customerId,
          customTags: [
            { group: '基础属性', tags: ['VIP001会员'] },
            { group: '消费类', tags: ['近90天订单金额大于等于500'] },
            { group: '行为类', tags: ['近7天有登录'] },
          ],
          platformMembers: [
            {
              platform: '重庆文旅集团大会员',
              level: 'VIP001',
              memberId: '7b9477fee9b5c6c66648cf7ac5f7514b',
            },
            {
              platform: '惠游重庆',
              level: 'VIP002',
              memberId: 'a1b2c3d4e5f6789012345678abcdef01',
            },
            {
              platform: '国企优品',
              level: 'VIP003',
              memberId: 'c9d8e7f6a5b432109876543210fedcba',
            },
          ],
          marketingEvents: [
            {
              activityId: 'ACT202603',
              activityName: '中秋团圆礼遇触达',
              crowdName: '重宾粽礼意向客群',
              channel: '小程序发券',
              result: '成功',
              executedAt: '2026-07-08 10:00:00',
            },
            {
              activityId: 'ACT202607',
              activityName: '沉默大会员唤醒',
              crowdName: '惠游重庆新客礼遇',
              channel: '发优惠券',
              result: '成功',
              executedAt: '2026-07-05 09:30:00',
            },
            {
              activityId: 'ACT202605',
              activityName: '乐和乐都亲子年卡召回',
              crowdName: '亲子乐园年卡意向客',
              channel: '短信',
              result: '成功',
              executedAt: '2026-06-28 14:00:00',
            },
            {
              activityId: 'ACT202604',
              activityName: '高价值客户专属礼',
              crowdName: '国企优品高价值客户',
              channel: '企微发消息',
              result: '成功',
              executedAt: '2026-06-20 11:00:00',
            },
          ],
          dynamics: [
            {
              id: 'd1',
              time: '2026-07-12 08:15:00',
              type: '登录',
              content: '登录惠游重庆小程序',
            },
            {
              id: 'd2',
              time: '2026-07-11 18:00:00',
              type: '评价',
              content: '对订单 O20260710001 评分 5 分：体验很好',
            },
            {
              id: 'd3',
              time: '2026-07-10 12:05:00',
              type: '积分',
              content: '下单获得积分 +198',
            },
            {
              id: 'd4',
              time: '2026-07-10 12:00:00',
              type: '优惠券',
              content: '核销优惠券「召回券」（订单 O20260710001）',
            },
            {
              id: 'd5',
              time: '2026-07-10 09:10:00',
              type: '订单',
              content: '购买「金刀峡景区大门票」×1，金额 198 元，惠游重庆；使用优惠券：召回券',
            },
            {
              id: 'd6',
              time: '2026-07-08 10:00:00',
              type: '优惠券',
              content: '领取优惠券「节日满减券」',
              activityId: 'ACT202603',
              activityName: '中秋团圆礼遇触达',
            },
            {
              id: 'd6b',
              time: '2026-07-05 09:30:00',
              type: '优惠券',
              content: '领取优惠券「唤醒满减券」',
              activityId: 'ACT202607',
              activityName: '沉默大会员唤醒',
            },
            {
              id: 'd7',
              time: '2026-07-03 16:20:00',
              type: '加购',
              content: '加购「乐和乐都双主题乐园年卡」',
            },
            {
              id: 'd8',
              time: '2026-07-02 11:05:00',
              type: '浏览',
              content: '浏览「金刀峡景区大门票」详情',
            },
            {
              id: 'd9',
              time: '2026-07-01 10:00:00',
              type: '优惠券',
              content: '领取优惠券「新人券」',
            },
            {
              id: 'd10',
              time: '2026-06-20 09:00:00',
              type: '等级',
              content: '会员等级 VIP001 → VIP002（惠游重庆）',
            },
            {
              id: 'd11',
              time: '2026-06-15 20:00:00',
              type: '优惠券',
              content: '优惠券「景区门票满减」已过期',
            },
            {
              id: 'd12',
              time: '2026-06-10 14:30:00',
              type: '积分',
              content: '积分兑换消耗 −500',
            },
          ],
          orders: [
            {
              orderNo: 'O20260710001',
              store: '惠游重庆',
              productName: '金刀峡景区大门票',
              amount: 198,
              status: '已完成',
              time: '2026-07-10 09:10:00',
              couponName: '召回券',
              reviewScore: 5,
              reviewContent: '体验很好',
            },
            {
              orderNo: 'O20260615002',
              store: '乐和乐都旗舰店',
              productName: '乐和乐都双主题乐园年卡',
              amount: 699,
              status: '已完成',
              time: '2026-06-15 15:40:00',
            },
            {
              orderNo: 'O20260520003',
              store: '国企优品',
              productName: '重宾粽礼寻香蒲',
              amount: 128,
              status: '已完成',
              time: '2026-05-20 11:20:00',
              couponName: '新人券',
              reviewScore: 4,
              reviewContent: '包装精美',
            },
          ],
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/crowds',
    handler: ({ params }) => {
      resolveAllCrowds();
      const {
        current = 1,
        pageSize = 20,
        keyword,
        type,
        catalog,
        onlyMine,
        creator,
        center,
        createdAtRange,
        calcStatus,
      } = params;
      let list = [...crowds];
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (creator) {
        list = list.filter((x) => x.creator.includes(String(creator)));
      }
      if (type && type !== '不限') {
        list = list.filter((x) => x.type === type);
      }
      if (catalog && catalog !== '所有') {
        list = list.filter((x) => x.catalog === catalog);
      }
      if (center) {
        list = list.filter((x) => (x.centers || []).includes(String(center)));
      }
      if (calcStatus && calcStatus !== '不限') {
        list = list.filter((x) => (x.calcStatus || 'success') === String(calcStatus));
      }
      if (createdAtRange) {
        const range = String(createdAtRange).split(',');
        if (range.length === 2) {
          const [from, to] = range;
          list = list.filter((x) => {
            const d = (x.createdAt || '').slice(0, 10);
            return d >= from && d <= to;
          });
        }
      }
      if (onlyMine === 'true' || onlyMine === '1') {
        list = list.filter((x) => x.creator === 'demo');
      }
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'POST',
    path: '/api/customer-asset/crowds',
    handler: ({ data }) => {
      const body = (data || {}) as Record<string, any>;
      const name = String(body.name || '').trim();
      if (!name) return { success: false, errorMessage: '请填写人群名称' };
      if (crowds.some((c) => c.name === name)) {
        return { success: false, errorMessage: '人群名称已存在，请换一个名称' };
      }
      const tags = Array.isArray(body.tags) ? body.tags : [];
      if (!tags.length) {
        return { success: false, errorMessage: '请至少选择一个标签' };
      }
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const calc = beginCalculating();
      const crowd = {
        id: String(240000 + (Date.now() % 10000)),
        name,
        count: 0,
        type: body.type || '条件人群',
        creator: 'demo',
        source: '标签圈选',
        createdAt: ts,
        updatedAt: ts,
        syncStatus: '未同步',
        catalog: '文旅人群',
        canDelete: false,
        canCopy: false,
        centers: Array.isArray(body.centers) ? body.centers.map(String) : seedCenters(crowds.length),
        conditions: body.conditions || {},
        tags,
        ...calc,
      };
      crowds = [crowd, ...crowds];
      persistCrowds();
      appendAudit('demo', '创建', `创建目标人群「${name}」`);
      return { success: true, data: crowd };
    },
  },
  {
    method: 'DELETE',
    path: '/api/customer-asset/crowds/:id',
    handler: ({ pathParams }) => {
      const hit = crowds.find((c) => c.id === pathParams.id);
      if (!hit) return { success: false, errorMessage: '人群不存在' };
      if (hit.calcStatus === 'calculating') {
        return { success: false, errorMessage: '计算中不可删除' };
      }
      crowds = crowds.filter((c) => c.id !== pathParams.id);
      persistCrowds();
      return { success: true };
    },
  },
  {
    method: 'POST',
    path: '/api/customer-asset/crowds/:id/recalculate',
    handler: ({ pathParams }) => {
      const idx = crowds.findIndex((c) => c.id === pathParams.id);
      if (idx < 0) return { success: false, errorMessage: '人群不存在' };
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      crowds[idx] = {
        ...crowds[idx],
        ...beginCalculating(),
        count: 0,
        canDelete: false,
        canCopy: false,
        updatedAt: ts,
      };
      persistCrowds();
      return { success: true, data: crowds[idx] };
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/crowds/:id',
    handler: ({ pathParams }) => {
      const item = crowds.find((c) => c.id === pathParams.id) || crowds[0];
      const tagPart = (item.tags || [])
        .map((t: any) => t?.tag || t?.name || '')
        .filter(Boolean)
        .map((n: string) => `标签「${n}」`)
        .join(' 且 ');
      const dimPart = formatConditionsReadable(item.conditions);
      const conditionsText = [tagPart, dimPart !== '未配置维度筛选' ? dimPart : '']
        .filter(Boolean)
        .join(' 且 ') || '标签圈选（演示）';
      return {
        success: true,
        data: {
          ...item,
          conditions: conditionsText,
          conditionGroups: summarizeDimFilters(item.conditions),
          members: customers.slice(0, 12).map((c, i) => ({
            id: c.id,
            oneId: mockOneId(i + 1),
            memberId: c.memberId,
            name: c.name || ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
            phoneMasked: c.phoneMasked,
            centers: c.centers,
            source:
              i % 3 === 0 ? '标签圈选' : i % 3 === 1 ? '维度筛选' : '标签+维度',
          })),
          portrait: {
            gender: [
              { name: '男', value: 42 },
              { name: '女', value: 38 },
              { name: '未知', value: 20 },
            ],
            age: [
              { name: '18-24', value: 15 },
              { name: '25-34', value: 40 },
              { name: '35-44', value: 30 },
              { name: '45+', value: 15 },
            ],
          },
        },
      };
    },
  },
  {
    method: 'POST',
    path: '/api/customer-asset/crowds/sync',
    handler: () => ({ success: true }),
  },
  {
    method: 'GET',
    path: '/api/tag-center/person-tags',
    handler: () => {
      resolveAllTagRules();
      const map = new Map<
        string,
        {
          group: string;
          tag: string;
          count: number;
          ruleId?: string;
          ruleName?: string;
          description?: string;
          creator?: string;
          createdAt?: string;
          updatedAt?: string;
          lastRunAt?: string;
          centers?: string[];
          calcStatus?: string;
          calcError?: string;
          enabled?: boolean;
        }
      >();
      tagRules.forEach((r, idx) => {
        const key = `${r.targetTag.group}::${r.targetTag.tag}`;
        map.set(key, {
          group: r.targetTag.group,
          tag: r.targetTag.tag,
          count: r.lastRunCount || 0,
          ruleId: r.id,
          ruleName: r.name,
          description: r.description,
          creator: r.creator || 'demo',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastRunAt: r.lastRunAt,
          centers: r.centers?.length ? r.centers : seedCenters(idx),
          calcStatus: r.calcStatus || 'success',
          calcError: r.calcError,
          enabled: r.enabled,
        });
      });
      const counts: Record<string, number> = {};
      Object.values(memberTagStore).forEach((list) => {
        list.forEach((t) => {
          const key = `${t.group}::${t.tag}`;
          counts[key] = (counts[key] || 0) + 1;
        });
      });
      const data = Array.from(map.values()).map((row) => ({
        ...row,
        count:
          row.calcStatus === 'calculating' || row.calcStatus === 'failed'
            ? 0
            : counts[`${row.group}::${row.tag}`] || row.count || 0,
        centers: (row as any).centers || ['山城工惠'],
      }));
      Object.keys(counts).forEach((key, idx) => {
        if (!map.has(key)) {
          const [group, tag] = key.split('::');
          data.push({
            group,
            tag,
            count: counts[key],
            centers: seedCenters(idx),
            calcStatus: 'success',
            enabled: true,
          });
        }
      });
      return { success: true, data };
    },
  },
  {
    method: 'GET',
    path: '/api/tag-center/rules',
    handler: ({ params }) => {
      resolveAllTagRules();
      const { current = 1, pageSize = 10, keyword, enabled } = params;
      let list = [...tagRules].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      if (keyword) {
        list = list.filter(
          (x) =>
            x.name.includes(String(keyword)) ||
            x.targetTag.tag.includes(String(keyword)) ||
            x.id.includes(String(keyword)),
        );
      }
      if (enabled === 'true') list = list.filter((x) => x.enabled);
      if (enabled === 'false') list = list.filter((x) => !x.enabled);
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/tag-center/rules/:id',
    handler: ({ pathParams }) => {
      const item = tagRules.find((r) => r.id === pathParams.id);
      if (!item) return { success: false, errorMessage: '规则不存在' };
      return { success: true, data: item };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/rules',
    handler: ({ data }) => {
      let body = data as any;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      body = body?.targetTag || body?.name ? body : body?.data || body || {};
      const targetTag = body.targetTag;
      const autoName = targetTag?.tag ? `${targetTag.tag}打标规则` : '';
      const name = String(body.name || autoName || '').trim();
      if (!name) return { success: false, errorMessage: '请填写规则名称' };
      if (!targetTag?.group || !targetTag?.tag) {
        return { success: false, errorMessage: '请选择目标标签' };
      }
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const calc = body.startCalc !== false ? beginCalculating() : { calcStatus: 'success' as const, calcApplied: true, enabled: true };
      const item = {
        id: `RULE${Date.now() % 100000}`,
        name,
        targetTag,
        description: body.description ? String(body.description) : undefined,
        conditions: body.conditions || {},
        centers: Array.isArray(body.centers) ? body.centers.map(String) : seedCenters(0),
        creator: body.creator || 'demo',
        createdAt: ts,
        updatedAt: ts,
        lastRunCount: 0,
        ...calc,
        enabled: calc.enabled === false ? false : body.enabled !== false,
      };
      tagRules = [item, ...tagRules];
      persistTagRules();
      return { success: true, data: item };
    },
  },
  {
    method: 'PUT',
    path: '/api/tag-center/rules/:id',
    handler: ({ pathParams, data }) => {
      const idx = tagRules.findIndex((r) => r.id === pathParams.id);
      if (idx < 0) return { success: false, errorMessage: '规则不存在' };
      const body = (data || {}) as any;
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const calc = body.startCalc ? beginCalculating() : {};
      tagRules[idx] = {
        ...tagRules[idx],
        ...body,
        id: tagRules[idx].id,
        targetTag: body.targetTag || tagRules[idx].targetTag,
        conditions: body.conditions ?? tagRules[idx].conditions,
        centers: Array.isArray(body.centers)
          ? body.centers.map(String)
          : tagRules[idx].centers || seedCenters(idx),
        updatedAt: ts,
        ...calc,
        lastRunCount: body.startCalc ? 0 : tagRules[idx].lastRunCount,
      };
      persistTagRules();
      return { success: true, data: tagRules[idx] };
    },
  },
  {
    method: 'DELETE',
    path: '/api/tag-center/rules/:id',
    handler: ({ pathParams }) => {
      tagRules = tagRules.filter((r) => r.id !== pathParams.id);
      persistTagRules();
      return { success: true };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/rules/preview',
    handler: ({ data }) => {
      const body = data || {};
      const conditions = body.conditions || {};
      const centers = Array.isArray(body.centers) ? body.centers.map(String) : undefined;
      const count = estimateTagCount(conditions);
      return {
        success: true,
        data: { count, samples: samplesFromConditions(conditions, centers) },
      };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/rules/apply',
    handler: ({ data }) => {
      const body = (data || {}) as any;
      if (!body.targetTag?.group || !body.targetTag?.tag) {
        return { success: false, errorMessage: '请选择目标标签' };
      }
      const result = applyTagsToMembers(
        body.targetTag,
        body.source || '一次性打标',
        body.conditions || {},
      );
      return { success: true, data: result };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/rules/:id/run',
    handler: ({ pathParams }) => {
      const idx = tagRules.findIndex((r) => r.id === pathParams.id);
      if (idx < 0) return { success: false, errorMessage: '规则不存在' };
      const rule = tagRules[idx];
      tagRules[idx] = {
        ...rule,
        ...beginCalculating(),
        lastRunCount: 0,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      persistTagRules();
      return { success: true, data: { started: true, rule: tagRules[idx] } };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/tags/create-crowd',
    handler: ({ data }) => {
      const body = (data || {}) as any;
      const group = body.group || '';
      const tag = body.tag || '';
      let count = 0;
      Object.values(memberTagStore).forEach((list) => {
        if (list.some((t) => t.group === group && t.tag === tag)) count += 1;
      });
      if (!count) count = estimateTagCount({});
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const crowd = {
        id: String(240000 + (Date.now() % 10000)),
        name: body.name || `标签「${tag}」人群`,
        count,
        type: '静态人群',
        creator: 'demo',
        source: body.ruleId ? '打标规则' : '人群标签',
        createdAt: ts,
        updatedAt: ts,
        syncStatus: '未同步',
        catalog: '文旅人群',
        canDelete: true,
        canCopy: true,
        centers: Array.isArray(body.centers) ? body.centers.map(String) : seedCenters(crowds.length),
      };
      crowds = [crowd, ...crowds];
      return { success: true, data: crowd };
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/shop',
    handler: ({ params }) => {
      const {
        current = 1,
        pageSize = 10,
        group,
        tagId,
        tagName,
        typeSearch,
        creatorSearch,
        createdStart,
        createdEnd,
        operateTypeSearch,
      } = params;
      let list = [...shopTags];
      if (group && group !== '全部') {
        list = list.filter((x) => x.group === group);
      }
      if (operateTypeSearch && operateTypeSearch !== '全部') {
        list = list.filter((x) => x.operateType === operateTypeSearch);
      }
      if (tagId) {
        list = list.filter((x) => x.id.includes(String(tagId)));
      }
      if (tagName) {
        list = list.filter((x) => x.name.includes(String(tagName)));
      }
      if (typeSearch) {
        list = list.filter((x) => x.type === typeSearch);
      }
      if (creatorSearch) {
        list = list.filter((x) => x.creator.includes(String(creatorSearch)));
      }
      if (createdStart) {
        list = list.filter((x) => x.createdAt >= String(createdStart));
      }
      if (createdEnd) {
        list = list.filter((x) => x.createdAt <= `${createdEnd} 23:59:59`);
      }
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/omnichannel',
    handler: ({ params }) => pageSlice(omniTags, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/import',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, level } = params;
      const list = level ? importBatches.filter((x) => x.level === level) : importBatches;
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/wecom',
    handler: ({ params }) => pageSlice(wecomTags, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/weimob',
    handler: ({ params }) => pageSlice(weimobTags, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/products/summary',
    handler: () => ({
      success: true,
      data: {
        productCount: 128,
        skuCount: 356,
        productTotal: 128,
        skuTotal: 356,
      },
    }),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/products',
    handler: ({ params }) => pageSlice(products, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/product-tags',
    handler: ({ params }) => pageSlice(productTags, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/customer-asset/product-tagging-tasks',
    handler: ({ params }) => pageSlice(taggingTasks, params.current, params.pageSize),
  },
  {
    method: 'GET',
    path: '/api/system/users',
    handler: (ctx) => systemAdminHandlers.listUsers(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/users',
    handler: (ctx) => systemAdminHandlers.createUser(ctx),
  },
  {
    method: 'PUT',
    path: '/api/system/users/:id',
    handler: (ctx) => systemAdminHandlers.updateUser(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/users/:id/reset-password',
    handler: (ctx) => systemAdminHandlers.resetPassword(ctx),
  },
  {
    method: 'DELETE',
    path: '/api/system/users/:id',
    handler: (ctx) => systemAdminHandlers.deleteUser(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/users/:username/approver-options',
    handler: (ctx) => systemAdminHandlers.approverOptions(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/roles',
    handler: (ctx) => systemAdminHandlers.listRoles(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/roles',
    handler: (ctx) => systemAdminHandlers.createRole(ctx),
  },
  {
    method: 'PUT',
    path: '/api/system/roles/:id',
    handler: (ctx) => systemAdminHandlers.updateRole(ctx),
  },
  {
    method: 'DELETE',
    path: '/api/system/roles/:id',
    handler: (ctx) => systemAdminHandlers.deleteRole(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/roles/:id/copy',
    handler: (ctx) => systemAdminHandlers.copyRole(ctx),
  },

  {
    method: 'GET',
    path: '/api/system/menus',
    handler: () => systemAdminHandlers.getMenus(),
  },
  {
    method: 'POST',
    path: '/api/system/menus',
    handler: (ctx) => systemAdminHandlers.createMenu(ctx),
  },
  {
    method: 'PUT',
    path: '/api/system/menus/:key',
    handler: (ctx) => systemAdminHandlers.updateMenu(ctx),
  },
  {
    method: 'DELETE',
    path: '/api/system/menus/:key',
    handler: (ctx) => systemAdminHandlers.deleteMenu(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/menus/reset',
    handler: (ctx) => systemAdminHandlers.resetMenus(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/audit-logs',
    handler: (ctx) => systemAdminHandlers.listAudit(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/org/tree',
    handler: (ctx) => systemAdminHandlers.getOrgTree(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/org/nodes',
    handler: (ctx) => systemAdminHandlers.upsertOrg(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/org/nodes/:key/check-delete',
    handler: (ctx) => systemAdminHandlers.checkDeleteOrg(ctx),
  },
  {
    method: 'DELETE',
    path: '/api/system/org/nodes/:key',
    handler: (ctx) => systemAdminHandlers.deleteOrg(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/org/persons',
    handler: (ctx) => systemAdminHandlers.listOrgPersons(ctx),
  },
  {
    method: 'POST',
    path: '/api/system/org/persons',
    handler: (ctx) => systemAdminHandlers.upsertOrgPerson(ctx),
  },
  {
    method: 'PUT',
    path: '/api/system/org/persons/:id',
    handler: (ctx) => systemAdminHandlers.upsertOrgPerson(ctx),
  },
  {
    method: 'DELETE',
    path: '/api/system/org/persons/:id',
    handler: (ctx) => systemAdminHandlers.deleteOrgPerson(ctx),
  },

  {
    method: 'GET',
    path: '/api/crowd-marketing/coupons',
    handler: ({ params }) => {
      /** 对齐分中心小程序券库示意（仅本平台可领） */
      const all = [
        {
          id: 'cp_sc_summer',
          name: '暑期满减券',
          tip: '满100减20',
          center: '山城工惠',
          type: '满减',
        },
        {
          id: 'cp_sc_scenic',
          name: '景区联票券',
          tip: '指定景区可用',
          center: '山城工惠',
          type: '兑换',
        },
        {
          id: 'cp_cs_new',
          name: '新客专享券',
          tip: '无门槛5元',
          center: '长寿工惠',
          type: '满减',
        },
        {
          id: 'cp_cs_member',
          name: '会员日券',
          tip: '会员专享',
          center: '长寿工惠',
          type: '折扣',
        },
        {
          id: 'cp_gq_freight',
          name: '国企优品运费券',
          tip: '满包邮',
          center: '国企优品',
          type: '运费',
        },
        {
          id: 'cp_gq_brand',
          name: '品牌满减券',
          tip: '满200减30',
          center: '国企优品',
          type: '满减',
        },
        {
          id: 'cp_wl_tour',
          name: '文旅惠联票券',
          tip: '周末可用',
          center: '文旅惠',
          type: '兑换',
        },
        {
          id: 'cp_wl_hotel',
          name: '酒店立减券',
          tip: '满300减50',
          center: '文旅惠',
          type: '满减',
        },
      ];
      const center = params.center ? String(params.center) : '';
      const list = center ? all.filter((c) => c.center === center) : all;
      return { success: true, data: list };
    },
  },

  {
    method: 'GET',
    path: '/api/crowd-marketing/activities',
    handler: ({ params }) => {
      const {
        current = 1,
        pageSize = 10,
        catalog,
        keyword,
        status,
        creator,
        periodic,
        onlyPeriodic,
        onlyMine,
        pendingApprove,
        currentUser = 'demo',
        center,
        createdAtRange,
        executedAtRange,
      } = params;
      let list = [...activities];
      if (catalog && catalog !== '所有' && catalog !== '全部') {
        list = list.filter((x) => x.catalog === catalog);
      }
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)));
      }
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (creator) list = list.filter((x) => x.creator.includes(String(creator)));
      if (center) list = list.filter((x) => (x.centers || []).includes(String(center)));
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
      if (onlyPeriodic === 'true') list = list.filter((x) => x.periodic);
      if (onlyMine === 'true') {
        list = list.filter((x) => x.mine || x.creator === currentUser);
      }
      if (pendingApprove === 'true') {
        const me = String(currentUser || '');
        list = list.filter(
          (x) => x.status === '待审批' && String(x.approver || '') === me,
        );
      }
      const inRange = (value: string | undefined, rangeRaw?: unknown) => {
        if (!rangeRaw) return true;
        const range = Array.isArray(rangeRaw)
          ? rangeRaw.map(String)
          : String(rangeRaw).split(',');
        if (!range[0] || !range[1]) return true;
        const day = (value || '').slice(0, 10);
        if (!day) return false;
        return day >= range[0] && day <= range[1];
      };
      if (createdAtRange) list = list.filter((x) => inRange(x.createdAt, createdAtRange));
      if (executedAtRange) list = list.filter((x) => inRange(x.executedAt, executedAtRange));
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities',
    handler: ({ data }) => {
      const body = (data || {}) as Record<string, any>;
      const creator = String(body.currentUser || body.creator || 'demo');
      const approver = String(body.approver || '');
      const err = validateActivityApprover(creator, approver);
      if (err) return { success: false, errorMessage: err };
      const item: ActivityRow = {
        id: `ACT${Date.now() % 1000000}`,
        name: body.name || '未命名活动',
        status: '草稿',
        catalog: body.category || body.catalog || '未分类',
        creator,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        periodic: !!body.periodic,
        mine: true,
        approver,
        canEdit: true,
        canDelete: true,
        pinned: false,
        centers: Array.isArray(body.centers) ? body.centers.map(String) : seedCenters(activities.length),
      };
      activities = [item, ...activities];
      appendAudit(creator, '创建活动', item.name);
      return { success: true, data: item };
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/activities/:id',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id) || activities[0];
      return {
        success: true,
        data: {
          ...item,
          nodes: resolveDesignNodes(item),
          edges: resolveDesignEdges(item) || undefined,
        },
      };
    },
  },
  {
    method: 'PUT',
    path: '/api/crowd-marketing/activities/:id',
    handler: ({ pathParams, data }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      const body = (data || {}) as any;
      if (!['草稿', '已驳回'].includes(item.status)) {
        return { success: false, errorMessage: `当前状态「${item.status}」不可修改活动信息` };
      }
      const name = String(body.name || '').trim();
      if (!name) return { success: false, errorMessage: '请填写活动名称' };
      const patched = patchActivityRow(item.id, { name });
      return { success: true, data: patched };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/submit-approve',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (!['草稿', '已驳回'].includes(item.status)) {
        return { success: false, errorMessage: `当前状态「${item.status}」不可提交审批` };
      }
      if (!item.approver) return { success: false, errorMessage: '请先指定审批人' };
      return { success: true, data: patchActivityRow(item.id, { status: '待审批', canEdit: false }) };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/approve',
    handler: ({ pathParams, data, params }) => {
      const currentUser = String(data?.currentUser || params.currentUser || 'demo');
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (item.status !== '待审批') return { success: false, errorMessage: '仅待审批活动可通过' };
      if (String(item.approver || '') !== currentUser) {
        return { success: false, errorMessage: '仅指定审批人可通过' };
      }
      const patched = patchActivityRow(item.id, { status: '已通过', canEdit: true, canDelete: true });
      appendAudit(currentUser, '审批通过', item.name);
      return { success: true, data: patched };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/reject',
    handler: ({ pathParams, data, params }) => {
      const currentUser = String(data?.currentUser || params.currentUser || 'demo');
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (item.status !== '待审批') return { success: false, errorMessage: '仅待审批活动可驳回' };
      if (String(item.approver || '') !== currentUser) {
        return { success: false, errorMessage: '仅指定审批人可驳回' };
      }
      const patched = patchActivityRow(item.id, { status: '已驳回', canEdit: true, canDelete: true });
      appendAudit(currentUser, '审批驳回', item.name);
      return {
        success: true,
        data: patched,
        remark: data?.remark,
      };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/formal-run',
    handler: ({ pathParams, data }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      const actor = String((data as any)?.currentUser || 'demo');
      if (item.status === '已暂停') {
        const patched = patchActivityRow(item.id, {
          status: '进行中',
          canEdit: false,
          canDelete: false,
        });
        appendAudit(actor, '正式执行', `${item.name}（恢复）`);
        return { success: true, data: patched };
      }
      if (item.status !== '已通过') {
        return { success: false, errorMessage: '须审批通过后才能正式执行' };
      }
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const patched = patchActivityRow(item.id, {
        status: '进行中',
        executedAt: item.executedAt || ts,
        canEdit: false,
        canDelete: false,
      });
      appendAudit(actor, '正式执行', item.name);
      return { success: true, data: patched };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/pause',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (item.status !== '进行中') return { success: false, errorMessage: '仅进行中的活动可暂停' };
      return {
        success: true,
        data: patchActivityRow(item.id, { status: '已暂停', canEdit: false, canDelete: false }),
      };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/invalidate-approve',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (!['已通过', '进行中', '已暂停'].includes(item.status)) {
        return { success: true, data: item, changed: false };
      }
      return { success: true, data: patchActivityRow(item.id, { status: '草稿' }), changed: true };
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/activities/:id/report',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id) || activities[0];
      const executed = isExecutedActivityStatus(item.status);
      if (!executed) {
        return {
          success: true,
          data: {
            id: item.id,
            name: item.name,
            status: item.status,
            executed: false,
            execStatus: '未执行',
          },
        };
      }
      return {
        success: true,
        data: {
          id: item.id,
          name: item.name,
          status: item.status,
          executed: true,
          execStatus: item.status === '进行中' ? '执行中' : '执行完成',
          startAt: '2026-07-20 10:00:00',
          endAt: '2026-07-20 12:30:00',
          summary: isSilentWake8(item)
            ? silentWake8ReportSummary(9600)
            : isFestivalCare4(item)
              ? festivalCare4ReportSummary(12840)
              : {
                  entered: 12840,
                  reachSuccess: 10211,
                  reachFail: 329,
                  benefitIssued: 860,
                  hasConvert: false,
                },
          nodes: resolveReportNodes(
            item,
            isSilentWake8(item)
              ? { entered: 9600 }
              : isFestivalCare4(item)
                ? { entered: 12840 }
                : {
                    entered: 12840,
                    reachSuccess: 10211,
                    reachFail: 329,
                    benefitIssued: 860,
                  },
          ),
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/tags/activity',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, group, keyword, syncSearch } = params;
      let list = [...activityTags];
      if (group && group !== '全部') list = list.filter((x) => x.group === group);
      if (keyword) list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      if (syncSearch && syncSearch !== '全部') list = list.filter((x) => x.syncStatus === syncSearch);
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/templates/local',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, catalog, keyword, onlyMine, periodic, center } = params;
      let list = [...localTemplates];
      if (catalog && catalog !== '所有' && catalog !== '全部') {
        list = list.filter((x) => x.catalog === catalog);
      }
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)));
      }
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
      if (center) list = list.filter((x) => (x.centers || []).includes(String(center)));
      if (onlyMine === 'true') list = list.filter((x) => x.mine);
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/templates/local',
    handler: ({ data }) => {
      const body = (data || {}) as Record<string, any>;
      const item = {
        id: `TPL${Date.now() % 100000}`,
        name: body.name || '未命名模板',
        catalog: body.catalog || '未分类',
        target: body.target || '全渠道会员',
        category: body.category || '促活',
        creator: 'demo',
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        mine: true,
        periodic: !!body.periodic,
        centers: Array.isArray(body.centers)
          ? body.centers.map(String)
          : seedCenters(localTemplates.length),
      };
      localTemplates = [item, ...localTemplates];
      return { success: true, data: item };
    },
  },
  {
    method: 'DELETE',
    path: '/api/crowd-marketing/templates/local/:id',
    handler: ({ pathParams }) => {
      localTemplates = localTemplates.filter((t) => t.id !== pathParams.id);
      return { success: true };
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/templates/local/:id',
    handler: ({ pathParams }) => {
      const item = localTemplates.find((t) => t.id === pathParams.id) || localTemplates[0];
      return {
        success: true,
        data: {
          ...item,
          nodes: [
            { id: 'n1', name: '开始', type: '开始' },
            { id: 'n2', name: '人群', type: '人群' },
            { id: 'n3', name: '触达', type: '触达' },
            { id: 'n4', name: '结束', type: '结束' },
          ],
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/node-records',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, activityName, status, periodic, startAtRange, center } =
        params;
      let list = [...activityExecRecords].sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
      if (activityName) list = list.filter((x) => x.activityName.includes(String(activityName)));
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
      if (center) list = list.filter((x) => (x.centers || []).includes(String(center)));
      if (startAtRange) {
        const range = String(startAtRange).split(',');
        if (range.length === 2) {
          const [from, to] = range;
          list = list.filter((x) => {
            if (!x.startAt) return false;
            const d = x.startAt.slice(0, 10);
            return d >= from && d <= to;
          });
        }
      }
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/node-records/:id/report',
    handler: ({ pathParams }) => {
      const item =
        activityExecRecords.find((r) => r.id === pathParams.id) || activityExecRecords[0];
      const canShow = ['成功', '失败', '部分成功', '执行中'].includes(item.status);
      if (!canShow) {
        return {
          success: true,
          data: {
            id: item.id,
            activityId: item.activityId,
            name: item.activityName,
            status: item.status,
            executed: false,
            execStatus: item.status,
            centers: item.centers,
          },
        };
      }
      const entered = item.targetCount;
      const reachSuccess = item.reachSuccess;
      const reachFail = item.reachFail;
      const summary = isSilentWake8(item)
        ? silentWake8ReportSummary(entered)
        : isFestivalCare4(item)
          ? festivalCare4ReportSummary(entered)
          : {
              entered,
              reachSuccess,
              reachFail,
              benefitIssued: Math.floor(reachSuccess * 0.08),
              hasConvert: false,
            };
      return {
        success: true,
        data: {
          id: item.id,
          activityId: item.activityId,
          name: item.activityName,
          status: item.status,
          executed: true,
          execStatus: item.status === '执行中' ? '执行中' : '执行完成',
          startAt: item.startAt || '2026-07-20 10:00:00',
          endAt: item.endAt || (item.status === '执行中' ? '' : '2026-07-20 12:30:00'),
          centers: item.centers,
          summary,
          nodes: resolveReportNodes(item, { entered }),
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/api/tag-center/person-tags/detail',
    handler: ({ params }) => {
      const group = String(params.group || '');
      const tag = String(params.tag || '');
      const rule = tagRules.find((r) => r.targetTag.group === group && r.targetTag.tag === tag);
      const count = rule?.lastRunCount || 128 + (group.length + tag.length) * 7;
      const centers = rule?.centers?.length ? rule.centers : seedCenters(group.length);
      const members = Array.from({ length: Math.min(count, 40) }, (_, i) => ({
        id: `tm${i + 1}`,
        oneId: mockOneId(i + 17),
        name: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九'][i % 7],
        phoneMasked: `139****${String(2000 + i).slice(-4)}`,
        centers: [centers[i % centers.length]],
        source: i % 3 === 0 ? '规则打标' : i % 3 === 1 ? '活动二次打标' : '导入',
        taggedAt: `2026-0${(i % 6) + 1}-${String(10 + (i % 15)).padStart(2, '0')} 11:${String(
          (i * 3) % 60,
        ).padStart(2, '0')}:00`,
      }));
      return {
        success: true,
        data: {
          group,
          tag,
          count,
          creator: rule?.creator || 'demo',
          createdAt: rule?.createdAt || '2026-03-12 10:00:00',
          updatedAt: rule?.updatedAt || rule?.lastRunAt || '2026-07-18 16:20:00',
          centers,
          ruleId: rule?.id,
          members,
        },
      };
    },
  },
];

export function resolveDemoApi(input: {
  url?: string;
  method?: string;
  params?: Record<string, any>;
  data?: any;
}): any | null {
  const method = (input.method || 'GET').toUpperCase();
  const { pathname, query } = parseUrl(input.url);
  const params = { ...query, ...(input.params || {}) };

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }
    const pathParams = matchPath(pathname, route.path);
    if (pathParams === null) {
      continue;
    }
    return route.handler({ params, pathParams, data: input.data });
  }

  return null;
}
