import type { Request, Response } from 'express';
import {
  formatConditionsReadable,
  summarizeDimFilters,
} from '../src/utils/tagRuleTypes';

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

const maskPhone = (p: string) => `${p.slice(0, 3)}****${p.slice(-4)}`;
const maskId = (id: string) => `${id.slice(0, 1)}*****${id.slice(-1)}`;

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
    userType,
    availablePoints: userType === '非会员' ? 0 : 20 + ((i * 37) % 2000),
    orderCount: (i * 3) % 40,
    consumeAmount: Number((((i * 17) % 500) + i * 0.13).toFixed(2)),
    pointsExchangeOrderCount: i % 5 === 0 ? i % 4 : 0,
    enterWay: ['自动', '后台录入', '批量导入', '渠道同步'][i % 4],
    registeredAt: `2026-${String((i % 9) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')} ${String(10 + (i % 12)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`,
  };
});

export let crowds = [
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
  },
];

export function addCrowd(item: (typeof crowds)[number]) {
  crowds = [item, ...crowds];
}

function resolveCrowdCalc(c: (typeof crowds)[number]) {
  if (c.calcStatus !== 'calculating' || !c.calcStartedAt) {
    return {
      ...c,
      calcStatus: c.calcStatus || 'success',
    };
  }
  const started = Date.parse(c.calcStartedAt);
  if (Number.isNaN(started) || Date.now() - started < 4000) return c;
  if ((c.name || '').includes('失败')) {
    return {
      ...c,
      calcStatus: 'failed' as const,
      calcError: '中台查询超时，请稍后重试',
      canDelete: true,
    };
  }
  return {
    ...c,
    calcStatus: 'success' as const,
    calcError: undefined,
    count: c.count || 200,
    canDelete: true,
    canCopy: true,
    calcApplied: true,
  };
}

function mergePendingCrowds() {
  try {
    const { pendingCrowds } = require('./tagStore') as typeof import('./tagStore');
    while (pendingCrowds.length) {
      const item = pendingCrowds.shift();
      if (item) crowds = [item as (typeof crowds)[number], ...crowds];
    }
  } catch {
    /* ignore */
  }
}

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

function pageSlice<T>(list: T[], current = 1, pageSize = 20) {
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

export default {
  'GET /api/tag-center/campaigns': (req: Request, res: Response) => {
    const { current = 1, pageSize = 20 } = req.query as Record<string, string>;
    res.json(pageSlice(topicCampaigns, current, pageSize));
  },
  'GET /api/customer-asset/customers': (req: Request, res: Response) => {
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
    } = req.query as Record<string, string>;
    const { memberTagStore } = require('./tagStore') as typeof import('./tagStore');
    let list = customers.map((c, idx) => {
      const storeTags = memberTagStore[c.id] || [];
      const tagGroups: Record<string, string[]> = {};
      storeTags.forEach((t) => {
        tagGroups[t.group] = tagGroups[t.group] || [];
        if (!tagGroups[t.group].includes(t.tag)) tagGroups[t.group].push(t.tag);
      });
      return {
        ...c,
        oneId: (c as any).oneId || `OID20260812${String(idx + 1).padStart(4, '0')}`,
        centers: (c as any).centers || [
          ['长寿工惠', '山城工惠', '国企优品', '文旅惠'][idx % 4],
        ],
        tagInstances: storeTags,
        tags: Object.keys(tagGroups).map((group) => ({ group, tags: tagGroups[group] })),
      };
    });
    if (customerId) {
      list = list.filter(
        (x) => x.customerId.includes(customerId) || x.customerIdMasked.includes(customerId),
      );
    }
    if (phone) {
      list = list.filter((x) => x.phone.includes(phone) || x.phoneMasked.includes(phone));
    }
    if (name) {
      list = list.filter((x) => (x.name || '').includes(name));
    }
    if (oneId) {
      list = list.filter((x) => String((x as any).oneId || '').includes(oneId));
    }
    if (center) {
      list = list.filter((x) => ((x as any).centers || []).includes(center));
    }
    if (userType && userType !== '不限') {
      list = list.filter((x) => String((x as any).userType || '') === userType);
    }
    if (gender && gender !== '不限') {
      list = list.filter((x) => String(x.gender || '未知') === gender);
    }
    if (ageMin) {
      list = list.filter((x) => (x.age ?? -1) >= Number(ageMin));
    }
    if (ageMax) {
      list = list.filter((x) => (x.age ?? 999) <= Number(ageMax));
    }
    if (regionPath) {
      const paths = String(regionPath)
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (paths.length) {
        list = list.filter((x) => {
          const parts = [x.province, x.city, x.district];
          return paths.some((p) => p.split('/').every((seg, i) => parts[i] === seg));
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
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/customers/:id': (req: Request, res: Response) => {
    const item = customers.find((c) => c.id === req.params.id) || customers[0];
    res.json({
      success: true,
      data: {
        ...item,
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
    });
  },
  'GET /api/customer-asset/crowds': (req: Request, res: Response) => {
    mergePendingCrowds();
    crowds = crowds.map(resolveCrowdCalc);
    const { current = 1, pageSize = 20, keyword, type, catalog, onlyMine, creator, calcStatus } =
      req.query as Record<string, string>;
    let list = [...crowds];
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (creator) {
      list = list.filter((x) => x.creator.includes(creator));
    }
    if (type && type !== '不限') {
      list = list.filter((x) => x.type === type);
    }
    if (catalog && catalog !== '所有') {
      list = list.filter((x) => x.catalog === catalog);
    }
    if (calcStatus && calcStatus !== '不限') {
      list = list.filter((x) => ((x as any).calcStatus || 'success') === calcStatus);
    }
    if (onlyMine === 'true' || onlyMine === '1') {
      list = list.filter((x) => x.creator === 'demo');
    }
    res.json(pageSlice(list, current, pageSize));
  },
  'POST /api/customer-asset/crowds': (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, any>;
    const name = String(body.name || '').trim();
    if (!name) {
      res.json({ success: false, errorMessage: '请填写人群名称' });
      return;
    }
    if (crowds.some((c) => c.name === name)) {
      res.json({ success: false, errorMessage: '人群名称已存在，请换一个名称' });
      return;
    }
    const tags = Array.isArray(body.tags) ? body.tags : [];
    if (!tags.length) {
      res.json({ success: false, errorMessage: '请至少选择一个标签' });
      return;
    }
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
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
      centers: Array.isArray(body.centers) ? body.centers.map(String) : undefined,
      calcStatus: 'calculating' as const,
      calcStartedAt: new Date().toISOString(),
      calcApplied: false,
      conditions: body.conditions,
      tags,
    };
    crowds = [crowd as any, ...crowds];
    res.json({ success: true, data: crowd });
  },
  'DELETE /api/customer-asset/crowds/:id': (req: Request, res: Response) => {
    const hit = crowds.find((c) => c.id === req.params.id);
    if (!hit) {
      res.json({ success: false, errorMessage: '人群不存在' });
      return;
    }
    if ((hit as any).calcStatus === 'calculating') {
      res.json({ success: false, errorMessage: '计算中不可删除' });
      return;
    }
    crowds = crowds.filter((c) => c.id !== req.params.id);
    res.json({ success: true });
  },
  'POST /api/customer-asset/crowds/:id/recalculate': (req: Request, res: Response) => {
    const idx = crowds.findIndex((c) => c.id === req.params.id);
    if (idx < 0) {
      res.json({ success: false, errorMessage: '人群不存在' });
      return;
    }
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    crowds[idx] = {
      ...crowds[idx],
      calcStatus: 'calculating',
      calcStartedAt: new Date().toISOString(),
      calcError: undefined,
      calcApplied: false,
      count: 0,
      canDelete: false,
      canCopy: false,
      updatedAt: ts,
    } as any;
    res.json({ success: true, data: crowds[idx] });
  },
  'GET /api/customer-asset/crowds/:id': (req: Request, res: Response) => {
    const item = crowds.find((c) => c.id === req.params.id) || crowds[0];
    const tagPart = ((item as any).tags || [])
      .map((t: any) => t?.tag || t?.name || '')
      .filter(Boolean)
      .map((n: string) => `标签「${n}」`)
      .join(' 且 ');
    const dimPart = formatConditionsReadable((item as any).conditions);
    const conditionsText =
      [tagPart, dimPart !== '未配置维度筛选' ? dimPart : ''].filter(Boolean).join(' 且 ') ||
      '标签「高价值」 且 行为「近90天有互动」';
    res.json({
      success: true,
      data: {
        ...item,
        conditions: conditionsText,
        conditionGroups: summarizeDimFilters((item as any).conditions),
        members: customers.slice(0, 12).map((c, i) => ({
          id: c.id,
          oneId: `OID20260812${String(i + 1).padStart(4, '0')}`,
          memberId: c.memberId,
          name: c.name || ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
          phoneMasked: c.phoneMasked,
          centers: [['长寿工惠', '山城工惠', '国企优品', '文旅惠'][i % 4]],
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
    });
  },
  'POST /api/customer-asset/crowds/sync': (_req: Request, res: Response) => {
    res.json({ success: true });
  },
  'GET /api/customer-asset/tags/shop': (req: Request, res: Response) => {
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
    } = req.query as Record<string, string>;
    let list = [...shopTags];
    if (group && group !== '全部') {
      list = list.filter((x) => x.group === group);
    }
    if (operateTypeSearch && operateTypeSearch !== '全部') {
      list = list.filter((x) => x.operateType === operateTypeSearch);
    }
    if (tagId) {
      list = list.filter((x) => x.id.includes(tagId));
    }
    if (tagName) {
      list = list.filter((x) => x.name.includes(tagName));
    }
    if (typeSearch) {
      list = list.filter((x) => x.type === typeSearch);
    }
    if (creatorSearch) {
      list = list.filter((x) => x.creator.includes(creatorSearch));
    }
    if (createdStart) {
      list = list.filter((x) => x.createdAt >= createdStart);
    }
    if (createdEnd) {
      list = list.filter((x) => x.createdAt <= `${createdEnd} 23:59:59`);
    }
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/tags/omnichannel': (req: Request, res: Response) => {
    res.json(pageSlice(omniTags, req.query.current as string, req.query.pageSize as string));
  },
  'GET /api/customer-asset/tags/import': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, level } = req.query as Record<string, string>;
    const list = level ? importBatches.filter((x) => x.level === level) : importBatches;
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/tags/wecom': (req: Request, res: Response) => {
    res.json(pageSlice(wecomTags, req.query.current as string, req.query.pageSize as string));
  },
  'GET /api/customer-asset/tags/weimob': (req: Request, res: Response) => {
    res.json(pageSlice(weimobTags, req.query.current as string, req.query.pageSize as string));
  },
  'GET /api/customer-asset/tags/activity': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, group, keyword, syncSearch } = req.query as Record<
      string,
      string
    >;
    let list = [...activityTags];
    if (group && group !== '全部') list = list.filter((x) => x.group === group);
    if (keyword) list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    if (syncSearch && syncSearch !== '全部') list = list.filter((x) => x.syncStatus === syncSearch);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/products/summary': (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        productCount: 128,
        skuCount: 356,
        productTotal: 128,
        skuTotal: 356,
      },
    });
  },
  'GET /api/customer-asset/products': (req: Request, res: Response) => {
    res.json(pageSlice(products, req.query.current as string, req.query.pageSize as string));
  },
  'GET /api/customer-asset/product-tags': (req: Request, res: Response) => {
    res.json(pageSlice(productTags, req.query.current as string, req.query.pageSize as string));
  },
  'GET /api/customer-asset/product-tagging-tasks': (req: Request, res: Response) => {
    res.json(pageSlice(taggingTasks, req.query.current as string, req.query.pageSize as string));
  },
};
