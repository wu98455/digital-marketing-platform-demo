import type { Request, Response } from 'express';

const stores = [
  {
    id: 's1',
    name: '测试店铺',
    storeId: '10001',
    platform: '测试平台',
    type: '普通单店',
    area: '重庆市渝中区',
    attr: '线上',
  },
  {
    id: 's2',
    name: '国企优品',
    storeId: '10002',
    platform: '国企优品',
    type: '普通单店',
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
  },
  {
    id: 's4',
    name: '惠游重庆',
    storeId: '10004',
    platform: '惠游重庆',
    type: '普通单店',
    area: '重庆市南岸区',
    attr: '线上',
  },
  {
    id: 's5',
    name: '惠游向导',
    storeId: '10005',
    platform: '惠游重庆',
    type: '普通单店',
    area: '--',
    attr: '线下',
  },
];

const maskPhone = (p: string) => `${p.slice(0, 3)}****${p.slice(-4)}`;
const maskId = (id: string) => `${id.slice(0, 1)}*****${id.slice(-1)}`;

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
  };
});

const crowds = [
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
  desc: ['消费偏好客群识别', '新客识别', '沉默客召回', '营销互动识别'][i % 4],
  valid: ['永久', '2026-12-31', '2027-06-30'][i % 3],
  perm: ['仅自己', '本部门', '全员'][i % 3],
  taggedCount: 100 + i * 37,
  creator: ['demo', 'WangSiyi', 'JiangYajuan'][i % 3],
  createdAt: `2026-0${(i % 6) + 1}-12 10:00:00`,
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
  'GET /api/customer-asset/stores': (_req: Request, res: Response) => {
    res.json({ data: stores, total: stores.length, success: true });
  },
  'GET /api/customer-asset/customers': (req: Request, res: Response) => {
    const { current = 1, pageSize = 20, customerId, phone, name } = req.query as Record<
      string,
      string
    >;
    let list = [...customers];
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
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/customers/:id': (req: Request, res: Response) => {
    const item = customers.find((c) => c.id === req.params.id) || customers[0];
    res.json({
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
    });
  },
  'GET /api/customer-asset/crowds': (req: Request, res: Response) => {
    const { current = 1, pageSize = 20, keyword, type, catalog, onlyMine, creator } =
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
    // 演示账号 demo：勾选「只显示我创建的」后仅本人创建的 2 条
    if (onlyMine === 'true' || onlyMine === '1') {
      list = list.filter((x) => x.creator === 'demo');
    }
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/customer-asset/crowds/:id': (req: Request, res: Response) => {
    const item = crowds.find((c) => c.id === req.params.id) || crowds[0];
    res.json({
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
    } = req.query as Record<string, string>;
    let list = [...shopTags];
    if (group && group !== '全部') {
      list = list.filter((x) => x.group === group);
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
