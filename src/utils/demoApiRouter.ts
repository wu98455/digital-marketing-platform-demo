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

const activities = Array.from({ length: 16 }).map((_, i) => ({
  id: `ACT${202600 + i}`,
  name: ['文旅新客召回', '会员日促销', '沉默客唤醒', '节日关怀触达', '高价值专属礼'][i % 5] + `-${i + 1}`,
  status: ['草稿', '进行中', '已结束', '待审批', '已暂停'][i % 5],
  catalog: ['文旅营销', '业务目录', '未分类'][i % 3],
  creator: ['demo', 'WangSiyi', 'JiangYajuan'][i % 3],
  createdAt: `2026-0${(i % 6) + 1}-${String(10 + (i % 15)).padStart(2, '0')} 10:00:00`,
  periodic: i % 4 === 0,
  mine: i % 3 === 0,
  pendingApprove: i % 5 === 3,
  canEdit: i % 5 !== 2,
  canDelete: i % 5 !== 1,
  pinned: i === 0,
}));

const localTemplates = Array.from({ length: 10 }).map((_, i) => ({
  id: `TPL${100 + i}`,
  name: ['新客欢迎流程', '复购激励', '生日关怀', '沉默召回'][i % 4] + `模板${i + 1}`,
  catalog: ['所有', '业务目录', '未分类'][i % 3],
  target: ['全渠道会员', '店铺会员', '潜客'][i % 3],
  category: ['召回', '促活', '关怀'][i % 3],
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 5) + 1}-15 14:00:00`,
  mine: i % 2 === 0,
}));

const cloudTemplates = Array.from({ length: 8 }).map((_, i) => ({
  id: `CT${200 + i}`,
  name: ['行业通用召回', '会员升级礼遇', '积分预到期提醒', '入会欢迎'][i % 4] + `-${i + 1}`,
  scene: ['召回', '升级', '积分', '入会'][i % 4],
  type: ['云模板', '专属模板'][i % 2],
  receivedAt: `2026-06-${String(10 + i).padStart(2, '0')} 09:00:00`,
}));

const nodeRecords = Array.from({ length: 20 }).map((_, i) => ({
  id: `NR${i + 1}`,
  activityId: `ACT${202600 + (i % 8)}`,
  activityName: ['文旅新客召回', '会员日促销', '沉默客唤醒'][i % 3],
  periodic: i % 3 === 0,
  nodeId: `N${1000 + i}`,
  nodeName: ['开始', '人群圈选', '短信触达', '等待', '结束'][i % 5],
  nodeType: ['开始', '人群', '触达', '等待', '结束'][i % 5],
  status: ['待执行', '执行中', '成功', '失败', '已跳过'][i % 5],
  planAt: `2026-07-${String(20 - (i % 15)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:00:00`,
  startAt: `2026-07-${String(20 - (i % 15)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:05:00`,
  endAt: `2026-07-${String(20 - (i % 15)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:10:00`,
}));

const careScenarios = [
  {
    id: 'sc1',
    category: '入会绑定',
    name: '新会员入会关怀',
    desc: '首次注册入会触发，不含退会后再入会',
  },
  {
    id: 'sc2',
    category: '入会绑定',
    name: '会员绑定关怀',
    desc: '同会员卡跨店铺卡入会触发',
  },
  {
    id: 'sc3',
    category: '等级变更',
    name: '会员等级升级关怀',
    desc: '会员等级升级时触发关怀',
  },
  {
    id: 'sc4',
    category: '等级变更',
    name: '会员等级降级提醒',
    desc: '会员等级降级时发送提醒',
  },
  {
    id: 'sc5',
    category: '积分变更',
    name: '会员积分到账通知',
    desc: '积分到账后通知会员',
  },
  {
    id: 'sc6',
    category: '积分变更',
    name: '会员积分消耗通知',
    desc: '积分消耗后通知会员',
  },
  {
    id: 'sc7',
    category: '积分变更',
    name: '积分预到期提醒',
    desc: '积分即将过期前提醒',
  },
  {
    id: 'sc8',
    category: '生日关怀',
    name: '生日关怀',
    desc: '按全渠道会员生日定时触达',
  },
];

const carePlans = Array.from({ length: 12 }).map((_, i) => ({
  id: `PL${3000 + i}`,
  name: ['入会欢迎计划', '升级礼遇计划', '积分到期提醒', '生日祝福'][i % 4] + `-${i + 1}`,
  memberCard: ['文旅大会员卡', '惠游会员卡', '不限会员卡'][i % 3],
  scene: careScenarios[i % 8].name,
  status: ['启用', '停用', '草稿'][i % 3],
  triggerType: ['即时', '定时', '周期'][i % 3],
  execTime: ['始终', '30天', '自定义'][i % 3],
  creator: ['demo', 'WangSiyi'][i % 2],
  createdAt: `2026-0${(i % 6) + 1}-18 11:20:00`,
  mine: i % 2 === 0,
}));

const careRecords = Array.from({ length: 18 }).map((_, i) => ({
  id: `CR${i + 1}`,
  channel: ['普通短信', '淘宝短信', '微信', '企微', '权益发放', '积分发放'][i % 6],
  memberCard: ['文旅大会员卡', '惠游会员卡'][i % 2],
  scene: careScenarios[i % 8].name,
  planId: `PL${3000 + (i % 6)}`,
  planName: ['入会欢迎计划', '升级礼遇计划'][i % 2],
  ruleName: `规则${i + 1}`,
  memberName: ['张三', '李四', '王五', '--'][i % 4],
  memberPhone: `138****${String(1000 + i).slice(-4)}`,
  account: `acc_${1000 + i}`,
  status: ['成功', '失败', '发送中', '已取消'][i % 4],
  submitAt: `2026-07-${String(15 + (i % 10)).padStart(2, '0')} 09:00:00`,
  sendAt: `2026-07-${String(15 + (i % 10)).padStart(2, '0')} 09:05:00`,
  cost: (0.05 * ((i % 5) + 1)).toFixed(2),
}));

type RouteContext = {
  params: Record<string, any>;
  pathParams: Record<string, string>;
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
    path: '/api/customer-asset/customers',
    handler: ({ params }) => {
      const { current = 1, pageSize = 20, customerId, phone, name } = params;
      let list = [...customers];
      if (customerId) {
        list = list.filter(
          (x) => x.customerId.includes(String(customerId)) || x.customerIdMasked.includes(String(customerId)),
        );
      }
      if (phone) {
        list = list.filter((x) => x.phone.includes(String(phone)) || x.phoneMasked.includes(String(phone)));
      }
      if (name) {
        list = list.filter((x) => (x.name || '').includes(String(name)));
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
      } = params;
      let list = [...shopTags];
      if (group && group !== '全部') {
        list = list.filter((x) => x.group === group);
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
    path: '/api/crowd-marketing/activities',
    handler: ({ params }) => {
      const {
        current = 1,
        pageSize = 10,
        catalog,
        keyword,
        status,
        onlyPeriodic,
        onlyMine,
        pendingApprove,
      } = params;
      let list = [...activities];
      if (catalog && catalog !== '所有') list = list.filter((x) => x.catalog === catalog);
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (onlyPeriodic === 'true') list = list.filter((x) => x.periodic);
      if (onlyMine === 'true') list = list.filter((x) => x.mine);
      if (pendingApprove === 'true') list = list.filter((x) => x.pendingApprove);
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/activities/:id',
    handler: ({ pathParams }) => {
      const item = activities.find((a) => a.id === pathParams.id) || activities[0];
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
    method: 'GET',
    path: '/api/crowd-marketing/templates/local',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, catalog, keyword, onlyMine } = params;
      let list = [...localTemplates];
      if (catalog && catalog !== '所有') list = list.filter((x) => x.catalog === catalog);
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (onlyMine === 'true') list = list.filter((x) => x.mine);
      return pageSliceMarketing(list, current, pageSize);
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
    path: '/api/crowd-marketing/templates/cloud',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, keyword, type } = params;
      let list = [...cloudTemplates];
      if (keyword) {
        list = list.filter((x) => x.name.includes(String(keyword)) || x.id.includes(String(keyword)));
      }
      if (type && type !== '全部') list = list.filter((x) => x.type === type);
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/crowd-marketing/node-records',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, activityId, activityName, nodeStatus } = params;
      let list = [...nodeRecords].sort((a, b) => (a.planAt < b.planAt ? 1 : -1));
      if (activityId) list = list.filter((x) => x.activityId.includes(String(activityId)));
      if (activityName) list = list.filter((x) => x.activityName.includes(String(activityName)));
      if (nodeStatus && nodeStatus !== '全部') list = list.filter((x) => x.status === nodeStatus);
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/event-marketing/scenarios',
    handler: () => ({ success: true, data: careScenarios }),
  },
  {
    method: 'GET',
    path: '/api/event-marketing/plans',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, keyword, scene, status, onlyMine } = params;
      let list = [...carePlans];
      if (keyword) {
        list = list.filter(
          (x) =>
            x.name.includes(String(keyword)) ||
            x.id.includes(String(keyword)) ||
            x.scene.includes(String(keyword)),
        );
      }
      if (scene && scene !== '全部') list = list.filter((x) => x.scene === scene);
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      if (onlyMine === 'true') list = list.filter((x) => x.mine);
      return pageSliceMarketing(list, current, pageSize);
    },
  },
  {
    method: 'GET',
    path: '/api/event-marketing/records',
    handler: ({ params }) => {
      const { current = 1, pageSize = 10, channel, status } = params;
      let list = [...careRecords];
      if (channel && channel !== '全部') list = list.filter((x) => x.channel === channel);
      if (status && status !== '全部') list = list.filter((x) => x.status === status);
      const costTotal = list.reduce((sum, x) => sum + Number(x.cost), 0);
      return { ...pageSliceMarketing(list, current, pageSize), costTotal: costTotal.toFixed(2) };
    },
  },
  {
    method: 'GET',
    path: '/api/event-marketing/stats',
    handler: ({ params }) => {
      const category = (params.category as string) || '入会绑定';
      return {
        success: true,
        data: {
          category,
          cards: [
            { title: '执行次数', value: 128 },
            { title: '成功营销人数', value: 3560 },
            { title: '发放积分', value: 12800 },
            { title: '发放权益', value: 420 },
            { title: '沟通成本(元)', value: 86.5 },
          ],
          details: Array.from({ length: 8 }).map((_, i) => ({
            id: `ST${i + 1}`,
            date: `2026-07-${String(20 - i).padStart(2, '0')}`,
            scene: careScenarios.filter((s) => s.category === category)[i % 2]?.name || '—',
            execCount: 10 + i * 3,
            successCount: 80 + i * 12,
            points: 200 + i * 50,
            benefits: 5 + i,
          })),
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
    return route.handler({ params, pathParams });
  }

  return null;
}
