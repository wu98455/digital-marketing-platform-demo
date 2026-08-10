import { systemAdminHandlers } from './systemAdminHandlers';
import { appendAudit, validateActivityApprover } from './systemAdminStore';
import {
  emptyTagRuleConditions,
  estimateCount as estimateTagCount,
  samplesFromConditions,
} from './tagRuleTypes';

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

const stores = [
  {
    id: 's1',
    name: '测试店铺',
    storeId: '10001',
    platform: '测试平台',
    type: '普通单店',
    area: '重庆市渝中区',
    attr: '线上',
    operateType: '自营',
  },
  {
    id: 's2',
    name: '国企优品',
    storeId: '10002',
    platform: '国企优品',
    type: '普通单店',
    operateType: '自营',
    area: '重庆市江北区',
    attr: '线上',
  },
  {
    id: 's3',
    name: '重庆文旅集团大会员',
    storeId: '10003',
    platform: '重庆文旅集团大会员',
    type: '普通单店',
    area: '重庆市渝北区',
    attr: '线上',
    operateType: '自营',
  },
  {
    id: 's4',
    name: '惠游重庆',
    storeId: '10004',
    platform: '惠游重庆',
    type: '普通单店',
    area: '重庆市南岸区',
    attr: '线上',
    operateType: '自营',
  },
  {
    id: 's5',
    name: '惠游向导',
    storeId: '10005',
    platform: '惠游重庆',
    type: '普通单店',
    area: '--',
    attr: '线下',
    operateType: '三方',
  },
];

const topicCampaigns = [
  {
    id: 'A1001',
    name: '金刀峡暑期亲子专题',
    type: '专题',
    channel: '小程序',
    startAt: '2026-07-01',
    endAt: '2026-08-31',
    status: '进行中',
  },
  {
    id: 'A1002',
    name: '国企优品会员日投放',
    type: '渠道投放',
    channel: '短信',
    startAt: '2026-06-01',
    endAt: '2026-06-30',
    status: '已结束',
  },
  {
    id: 'A1003',
    name: '中秋景区联票节',
    type: '节日',
    channel: '小程序',
    startAt: '2026-09-10',
    endAt: '2026-09-18',
    status: '未开始',
  },
  {
    id: 'A1004',
    name: '文创市集线下召回',
    type: '专题',
    channel: '线下',
    startAt: '2026-05-01',
    endAt: '2026-05-07',
    status: '已结束',
  },
  {
    id: 'A1005',
    name: '沉默大会员站内信唤醒',
    type: '渠道投放',
    channel: '站内信',
    startAt: '2026-07-15',
    endAt: '2026-08-15',
    status: '进行中',
  },
];

const customers = Array.from({ length: 48 }).map((_, i) => {
  const rawId = `00017c7b8bdaa3de01cb1cda607ee2${String(i).padStart(2, '0')}`;
  const phone = `13${String(400000000 + i * 17).slice(0, 9)}`;
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
    province: ['重庆', '四川', '贵州', ''][i % 4],
    city: ['渝中区', '成都市', '贵阳市', ''][i % 4],
    district: ['解放碑', '武侯区', '南明区', ''][i % 4],
    gender: ['未知', '男', '女', '未知'][i % 4],
    birthday: i % 7 === 0 ? '1990-05-12' : '',
    constellation: i % 7 === 0 ? '金牛座' : '',
    status: i % 8 === 0 ? '潜在客户' : '正式客户',
    memberId: `M${10000 + i}`,
    memberLevel: ['普通', '银卡', '金卡', '黑金'][i % 4],
  };
});

const memberTagStore: Record<string, { group: string; tag: string; source: string }[]> = {};

let tagRules: {
  id: string;
  name: string;
  targetTag: { group: string; tag: string };
  conditions: Record<string, any>;
  enabled: boolean;
  lastRunAt?: string;
  lastRunCount?: number;
  creator?: string;
  updatedAt: string;
  createdAt: string;
}[] = [
  {
    id: 'RULE001',
    name: '高价值活跃会员',
    targetTag: { group: '客户价值', tag: '高价值' },
    conditions: {
      ...emptyTagRuleConditions(),
      member: { groups: [{ levelId: '金卡', customerCompany: '乐和乐都' }] },
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
      coupon: { groups: [{ status: '已领取未核销', name: '召回券' }] },
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

let crowds = [
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
  },
  {
    id: '241076',
    name: '近7天浏览门票临时圈选',
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
  },
  {
    id: '237295',
    name: '近90天互动活跃用户',
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
  },
  {
    id: '230001',
    name: '大会员沉默召回',
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
  },
  {
    id: '229880',
    name: '惠游重庆新客',
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
  },
  {
    id: '228100',
    name: '测试人群-可删除',
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
  },
];

const shopTags = Array.from({ length: 12 }).map((_, i) => ({
  id: `st${1000 + i}`,
  name:
    ['标签一', '标签测试', '复购顾客', '测试标签组', '高价值', '新客'][i % 6] +
    (i > 5 ? `-${i}` : ''),
  type: ['手工标签', '规则标签'][i % 2],
  group: ['测试平台', '惠游重庆', '国企优品', '重庆文旅集团大会员'][i % 4],
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
  platform: ['全部平台', '测试平台', '惠游重庆'][i % 3],
  store: ['测试店铺', '惠游重庆', '--'][i % 3],
  group: ['测试平台', '惠游重庆', '国企优品', '重庆文旅集团大会员'][i % 4],
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
  name: ['文旅年卡', '景区门票', '酒店套餐', '向导服务', '文创礼盒'][i % 5] + `-${i + 1}`,
  sku: `SKU${10000 + i}`,
  platform: ['惠游重庆', '国企优品', '测试平台'][i % 3],
  store: ['惠游重庆', '国企优品', '测试店铺'][i % 3],
  status: ['上架', '下架'][i % 2],
  category: ['门票', '住宿', '服务', '零售'][i % 4],
  price: (99 + i * 13).toFixed(2),
  syncedAt: `2026-07-${String((i % 15) + 1).padStart(2, '0')} 09:00:00`,
  tagValues: i % 3 === 0 ? '热销,推荐' : '--',
}));

const productTags = Array.from({ length: 10 }).map((_, i) => ({
  id: `pt${i + 1}`,
  name: ['热销', '推荐', '季节限定', '亲子', '高端'][i % 5] + (i > 4 ? `组${i}` : ''),
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
  periodic: boolean;
  mine: boolean;
  approver: string;
  canEdit: boolean;
  canDelete: boolean;
  pinned: boolean;
};

let activities: ActivityRow[] = Array.from({ length: 16 }).map((_, i) => {
  const status = ACTIVITY_STATUSES[i % ACTIVITY_STATUSES.length];
  const creator = APPROVER_POOL[i % 3];
  const approver = APPROVER_POOL[(i + 1) % 3];
  return {
    id: `ACT${202600 + i}`,
    name: ['文旅新客召回', '会员日促销', '沉默客唤醒', '节日关怀触达', '高价值专属礼'][i % 5] + `-${i + 1}`,
    status,
    catalog: ['文旅营销', '业务目录', '未分类'][i % 3],
    creator,
    createdAt: `2026-0${(i % 6) + 1}-${String(10 + (i % 15)).padStart(2, '0')} 10:00:00`,
    periodic: i % 4 === 0,
    mine: creator === 'demo',
    approver: status === '待审批' && i % 7 === 1 ? 'demo' : approver,
    canEdit: status !== '已结束',
    canDelete: status !== '进行中',
    pinned: i === 0,
  };
});

(() => {
  const pending = activities.find((a) => a.status === '待审批');
  if (pending) pending.approver = 'demo';
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
  name: ['新客欢迎流程', '复购激励', '生日关怀', '沉默召回'][i % 4] + `模板${i + 1}`,
  catalog: ['文旅营销', '业务目录', '未分类'][i % 3],
  target: ['全渠道会员', '店铺会员', '潜客'][i % 3],
  category: ['召回', '促活', '关怀'][i % 3],
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 5) + 1}-15 14:00:00`,
  mine: i % 2 === 0,
  periodic: i % 3 === 0,
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
    activityName: ['文旅新客召回', '会员日促销', '沉默客唤醒', '节日关怀触达'][i % 4] + `-${(i % 8) + 1}`,
    periodic: i % 3 === 0,
    status,
    startAt: status === '待执行' ? '' : `2026-07-${day} ${hour}:05:00`,
    endAt: ['待执行', '执行中'].includes(status) ? '' : `2026-07-${day} ${hour}:40:00`,
    targetCount,
    reachSuccess,
    reachFail,
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
    path: '/api/customer-asset/stores',
    handler: () => ({ data: stores, total: stores.length, success: true }),
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
      const { current = 1, pageSize = 20, customerId, phone, name, tagKey } = params;
      let list = customers.map((c) => {
        const storeTags = memberTagStore[c.id] || [];
        const tagGroups: Record<string, string[]> = {};
        storeTags.forEach((t) => {
          tagGroups[t.group] = tagGroups[t.group] || [];
          if (!tagGroups[t.group].includes(t.tag)) tagGroups[t.group].push(t.tag);
        });
        return {
          ...c,
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
      if (tagKey) {
        const [g, t] = String(tagKey).split('::');
        list = list.filter((x) =>
          (x.tagInstances || []).some((ti) => ti.group === g && ti.tag === t),
        );
      }
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/customers/:id',
    handler: ({ pathParams }) => {
      const item = customers.find((c) => c.id === pathParams.id) || customers[0];
      return {
        success: true,
        data: {
          ...item,
          customerIdFull: item.customerId,
          accounts: [
            {
              name: '重庆文旅集团大会员',
              accountId: '7b9477fee9b5c6c66648cf7ac5f7514b',
            },
            {
              name: '惠游重庆',
              accountId: 'a1b2c3d4e5f6789012345678abcdef01',
            },
          ],
          rfm: {
            r: 4,
            f: 3,
            m: 5,
            lifecycle: '重要保持客户',
            platforms: [
              { platform: '惠游重庆', r: 4, f: 3, m: 5 },
              { platform: '国企优品', r: 2, f: 1, m: 2 },
            ],
            stores: [
              { store: '惠游重庆', r: 4, f: 3, m: 5 },
              { store: '测试店铺', r: 1, f: 1, m: 1 },
            ],
          },
          customTags: [
            { group: '客户价值', tags: ['高价值', '大会员'] },
            { group: '兴趣偏好', tags: [] },
          ],
          member: {
            cardName: '文旅大会员卡',
            level: '黄金会员',
            points: 2580,
          },
          dynamics: [
            {
              time: '2026-07-10 12:00:00',
              type: '营销互动',
              content: '领取优惠券「景区门票满减」',
            },
            { time: '2026-06-02 09:20:00', type: '订单', content: '下单景区门票 x2' },
          ],
          orders: [
            {
              orderNo: 'O20260710001',
              store: '惠游重庆',
              amount: 198,
              status: '已完成',
              time: '2026-07-10 09:10:00',
            },
          ],
          reviews: [
            {
              store: '惠游重庆',
              score: 5,
              content: '体验很好',
              time: '2026-07-11 18:00:00',
            },
          ],
          benefits: {
            count: 3,
            lastTime: '2026-07-01 10:00:00',
            list: [
              {
                name: '新人券',
                store: '惠游重庆',
                time: '2026-07-01 10:00:00',
              },
            ],
          },
        },
      };
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/crowds',
    handler: ({ params }) => {
      const { current = 1, pageSize = 20, keyword, type, catalog, onlyMine, creator } = params;
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
      if (onlyMine === 'true' || onlyMine === '1') {
        list = list.filter((x) => x.creator === 'demo');
      }
      return pageSlice(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/customer-asset/crowds/:id',
    handler: ({ pathParams }) => {
      const item = crowds.find((c) => c.id === pathParams.id) || crowds[0];
      return {
        success: true,
        data: {
          ...item,
          conditions: '标签「高价值」 且 行为「近90天有互动」',
          members: customers.slice(0, 5).map((c) => ({
            customerId: c.customerIdMasked,
            name: c.name || '--',
            phone: c.phoneMasked,
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
      const map = new Map<
        string,
        {
          group: string;
          tag: string;
          count: number;
          ruleId?: string;
          ruleName?: string;
          creator?: string;
          createdAt?: string;
          updatedAt?: string;
          lastRunAt?: string;
        }
      >();
      tagRules.forEach((r) => {
        const key = `${r.targetTag.group}::${r.targetTag.tag}`;
        map.set(key, {
          group: r.targetTag.group,
          tag: r.targetTag.tag,
          count: r.lastRunCount || 0,
          ruleId: r.id,
          ruleName: r.name,
          creator: r.creator || 'demo',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          lastRunAt: r.lastRunAt,
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
        count: counts[`${row.group}::${row.tag}`] || row.count || 0,
      }));
      Object.keys(counts).forEach((key) => {
        if (!map.has(key)) {
          const [group, tag] = key.split('::');
          data.push({ group, tag, count: counts[key] });
        }
      });
      return { success: true, data };
    },
  },
  {
    method: 'GET',
    path: '/api/tag-center/rules',
    handler: ({ params }) => {
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
      const body = (data || {}) as any;
      if (!body.name?.trim()) return { success: false, errorMessage: '请填写规则名称' };
      if (!body.targetTag?.group || !body.targetTag?.tag) {
        return { success: false, errorMessage: '请选择目标标签' };
      }
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const item = {
        id: `RULE${Date.now() % 100000}`,
        name: String(body.name).trim(),
        targetTag: body.targetTag,
        conditions: body.conditions || {},
        enabled: body.enabled !== false,
        creator: body.creator || 'demo',
        createdAt: ts,
        updatedAt: ts,
      };
      tagRules = [item, ...tagRules];
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
      tagRules[idx] = {
        ...tagRules[idx],
        ...body,
        id: tagRules[idx].id,
        targetTag: body.targetTag || tagRules[idx].targetTag,
        conditions: body.conditions ?? tagRules[idx].conditions,
        updatedAt: ts,
      };
      return { success: true, data: tagRules[idx] };
    },
  },
  {
    method: 'DELETE',
    path: '/api/tag-center/rules/:id',
    handler: ({ pathParams }) => {
      tagRules = tagRules.filter((r) => r.id !== pathParams.id);
      return { success: true };
    },
  },
  {
    method: 'POST',
    path: '/api/tag-center/rules/preview',
    handler: ({ data }) => {
      const conditions = (data || {}).conditions || {};
      const count = estimateTagCount(conditions);
      return { success: true, data: { count, samples: samplesFromConditions(conditions) } };
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
      if (!rule.enabled) return { success: false, errorMessage: '规则已停用' };
      const result = applyTagsToMembers(rule.targetTag, `规则:${rule.name}`, rule.conditions);
      const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
      tagRules[idx] = {
        ...rule,
        lastRunAt: ts,
        lastRunCount: result.count,
        updatedAt: ts,
      };
      return { success: true, data: { ...result, rule: tagRules[idx] } };
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
    method: 'GET',
    path: '/api/system/users/:username/approver-options',
    handler: (ctx) => systemAdminHandlers.approverOptions(ctx),
  },
  {
    method: 'GET',
    path: '/api/system/roles',
    handler: () => systemAdminHandlers.listRoles(),
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
      } = params;
      let list = [...activities];
      if (catalog && catalog !== '所有' && catalog !== '全部') {
        list = list.filter((x) => x.catalog === catalog);
      }
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (creator) list = list.filter((x) => x.creator.includes(String(creator)));
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
      if (onlyPeriodic === 'true') list = list.filter((x) => x.periodic);
      if (onlyMine === 'true') {
        list = list.filter((x) => x.mine || x.creator === currentUser);
      }
      if (pendingApprove === 'true') {
        list = list.filter((x) => x.status === '待审批' && x.approver === currentUser);
      }
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
          nodes: [
            { id: 'n1', name: '开始', type: '开始', config: '活动触发' },
            { id: 'n2', name: '人群圈选', type: '人群', config: '静态人群 · 高价值客户' },
            { id: 'n3', name: '合并去重', type: '处理', config: '按客户ID去重' },
            { id: 'n4', name: '短信触达', type: '触达', config: '普通短信模板 A' },
            { id: 'n5', name: '结束', type: '结束', config: '完成' },
          ],
        },
      };
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
      return { success: true, data: patchActivityRow(item.id, { status: '待审批' }) };
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
      if (item.approver !== currentUser) return { success: false, errorMessage: '仅指定审批人可通过' };
      const patched = patchActivityRow(item.id, { status: '已通过' });
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
      if (item.approver !== currentUser) return { success: false, errorMessage: '仅指定审批人可驳回' };
      const patched = patchActivityRow(item.id, { status: '已驳回' });
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
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (item.status === '已暂停') {
        return { success: true, data: patchActivityRow(item.id, { status: '进行中' }) };
      }
      if (item.status !== '已通过') {
        return { success: false, errorMessage: '须审批通过后才能正式执行' };
      }
      return { success: true, data: patchActivityRow(item.id, { status: '进行中' }) };
    },
  },
  {
    method: 'POST',
    path: '/api/crowd-marketing/activities/:id/pause',
    handler: ({ pathParams }) => {
      const item = findActivityRow(pathParams.id);
      if (!item) return { success: false, errorMessage: '活动不存在' };
      if (item.status !== '进行中') return { success: false, errorMessage: '仅进行中的活动可暂停' };
      return { success: true, data: patchActivityRow(item.id, { status: '已暂停' }) };
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
          summary: {
            entered: 12840,
            reachSuccess: 10211,
            reachFail: 329,
            benefitIssued: 860,
          },
          nodes: [
            { id: '1', nodeName: '开始', nodeType: '开始', entered: 12840, success: 12840, failed: 0, duration: '1s' },
            { id: '2', nodeName: '人群圈选', nodeType: '人群', entered: 12840, success: 12600, failed: 240, duration: '45s' },
            { id: '3', nodeName: '行为触发', nodeType: '行为', entered: 4200, success: 4180, failed: 20, duration: '实时' },
            { id: '4', nodeName: '小程序站内信', nodeType: '触达', entered: 4180, success: 3900, failed: 280, duration: '2m' },
            { id: '5', nodeName: '发券', nodeType: '优惠', entered: 860, success: 860, failed: 0, duration: '30s' },
            { id: '6', nodeName: '结束', nodeType: '结束', entered: 12600, success: 12600, failed: 0, duration: '1s' },
          ],
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
      const { current = 1, pageSize = 10, catalog, keyword, onlyMine, periodic } = params;
      let list = [...localTemplates];
      if (catalog && catalog !== '所有' && catalog !== '全部') {
        list = list.filter((x) => x.catalog === catalog);
      }
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
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
      const { current = 1, pageSize = 10, activityName, status, periodic, startAtRange } = params;
      let list = [...activityExecRecords].sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
      if (activityName) list = list.filter((x) => x.activityName.includes(String(activityName)));
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (periodic === '是') list = list.filter((x) => x.periodic);
      if (periodic === '否') list = list.filter((x) => !x.periodic);
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
