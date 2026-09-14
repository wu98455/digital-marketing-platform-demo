/**
 * 打标规则：七维筛选（已下线「商品与供应商」「联票与策略」）；
 * 字段对齐《全维度打标数据能力对照表》。每维含多组条件：组内且、组间或；多维之间且。
 * product / combo 仍保留在条件结构中，仅兼容历史数据，新建不再展示。
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
  /** 会员编号 member_no */
  memberNo?: string;
  gender?: string[];
  customerCompany?: string;
  buyCompany?: string[];
  buyType?: string[];
  firstBuyCompany?: string[];
  latestBuyCompany?: string[];
  registrationRange?: [string, string];
  levelId?: string;
  /** 下单次数（精确，OpFields） */
  orderNumber?: OpValue;
  /** 账户类型（多选） */
  userType?: string[];
  /** 年龄（OpFields） */
  age?: OpValue;
  /** DWD 可加：注册渠道 channel_code */
  regChannelCodes?: string[];
  /** DWD 可加：录入方式 enter_way */
  enterWays?: string[];
  /** DWD 可加：首次登录时间 login_time */
  firstLoginRange?: [string, string];
  /** DWD 可加：省市区（身份证派生） */
  regionPath?: string[][];
  /** DWD 可加：生日日期区间 */
  birthDateRange?: [string, string];
};

export type OrderGroupFields = {
  ticketOrderPaymentId?: string;
  orderCode?: string;
  /** 状态码 01200x */
  orderStatus?: string[];
  userType?: string;
  buyTicketPhone?: string;
  salesMethod?: string;
  sessionType?: string;
  projectName?: string;
  /** 商品类别（04b 五类） */
  categorysId?: string[];
  supplierId?: string;
  createTimeRange?: [string, string];
  refuseTimeRange?: [string, string];
  verificationRange?: [string, string];
  sourceProject?: string;
  /** 销售渠道 */
  orderType?: string[];
  /** 订单类型 普通/砍价/拼团 */
  orderTypeParent?: string;
  /** 活动类型码（弱化） */
  activityType?: string;
  isDistributionNew?: string;
  lifeCycle?: string[];
  amount?: OpValue;
  frequency?: OpValue;
  avgUnitPrice?: OpValue;
  customerBuyGoodsName?: string;
  /** DWD 可加 */
  payTypes?: string[];
  payStatuses?: string[];
  payTimeRange?: [string, string];
  discountMoney?: OpValue;
  couponMoney?: OpValue;
  playDateRange?: [string, string];
  verificationStatuses?: string[];
  refundMoney?: OpValue;
  bizCompanyIds?: string[];
  recvRegionPath?: string[][];
  storeIds?: string[];
  /** 订单关联的商品标签（多选） */
  productTags?: string[];
  /** 订单关联的供应商标签（多选） */
  supplierTags?: string[];
};

export type ProductGroupFields = {
  projectName?: string;
  buyType?: string[];
  buyCompany?: string[];
  supplierId?: string;
  recentBuyApprox?: OpValue;
  /** 商品分类（一二三级联级，对齐管理端 category 树示意） */
  categoryPath?: string[][];
  productSaleStatuses?: string[];
  sessionNames?: string[];
};

export type ComboGroupFields = {
  projectName?: string;
  buyType?: string[];
  isPackageTicket?: string;
};

export type CampaignGroupFields = {
  activityName?: string;
  /** 类型码 25600x */
  activityType?: string[];
  /** 状态码 25700x */
  activityStatus?: string[];
  hasOrder?: string;
  /** DWD 可加 */
  appTypes?: string[];
  /** 专题类型 specialType：02700x */
  specialTypes?: string[];
  /** 专题模式 specialMode：02900x */
  specialModes?: string[];
  specialProductIds?: string[];
  reachWays?: string[];
  channelLinkTypes?: string[];
  /** 活动/专题标签（多选） */
  campaignTags?: string[];
};

export type CouponGroupFields = {
  name?: string;
  discountType?: string;
  status?: string;
  /** DWD 可加 */
  validEndRange?: [string, string];
  receiveTimeRange?: [string, string];
  useStatuses?: string[];
  receiveTypes?: string[];
};

export type PointsGroupFields = {
  projectName?: string;
  /** 可用积分区间 */
  integralBalance?: OpValue;
  hasPointsAccount?: string;
  salesMethod?: string;
  pointsAction?: string;
};

export type StoredValueGroupFields = {
  cardName?: string;
  /** 卡类型码 19700x */
  cardType?: string[];
  /** 卡状态码 19800x */
  status?: string[];
  isMember?: string;
  companyName?: string;
  balance?: OpValue;
  orderNumber?: string;
  prodName?: string;
  userPhone?: string;
  /** DWD 可加 */
  collectTimeRange?: [string, string];
  expiryTimeRange?: [string, string];
  originalDenomination?: OpValue;
  issueCompanyIds?: string[];
  rechargeTypes?: string[];
  rechargeOperationTypes?: string[];
  operationMoney?: OpValue;
  consumeChannels?: string[];
};

export type UserBehaviorGroupFields = {
  timeNode?: string;
  /** 浏览 / 加购 / 分享（既有）+ 登录/活动访问/活动参与/搜索/商品详情点击（可加） */
  behaviorActions?: string[];
  /** 联级路径：如 ['商品','景区','商品详情'] */
  browsePages?: string[][];
  /** 联级路径：如 ['景区类','景区门票联票A'] */
  cartProducts?: string[][];
  /** 联级路径：如 ['节日活动','五一活动分享页'] */
  shareActivities?: string[][];
  /** 浏览附属：停留时长（秒），仅勾选「浏览」时生效 */
  browseDuration?: OpValue;
  loginChannels?: string[];
  visitChannels?: string[][];
  joinSpecials?: string[][];
  searchQuery?: string;
  detailProducts?: string[][];
  /** 组级可选：收窄行为发生渠道 */
  behaviorChannelCodes?: string[];
};

/** UI 用：条件组已选筛选项；以 `__` 开头的键不计入筛选摘要 */
type WithFilterKeys<T> = T & { __keys?: string[] };

export type ConditionGroupMap = {
  member: WithFilterKeys<MemberGroupFields>;
  order: WithFilterKeys<OrderGroupFields>;
  product: WithFilterKeys<ProductGroupFields>;
  combo: WithFilterKeys<ComboGroupFields>;
  campaign: WithFilterKeys<CampaignGroupFields>;
  coupon: WithFilterKeys<CouponGroupFields>;
  points: WithFilterKeys<PointsGroupFields>;
  storedValue: WithFilterKeys<StoredValueGroupFields>;
  userBehavior: WithFilterKeys<UserBehaviorGroupFields>;
};

export type DimKey = keyof ConditionGroupMap;

export type DimConditions<K extends DimKey = DimKey> = {
  groups: ConditionGroupMap[K][];
};

/** 多维度之间的逻辑；默认且 */
export type DimLogic = 'AND' | 'OR';

export type TagRuleConditions = {
  /** 维度与维度之间：且 / 或（默认且） */
  dimLogic?: DimLogic;
} & {
  [K in DimKey]: DimConditions<K>;
};

export type PreviewSample = {
  id: string;
  memberId: string;
  name: string;
  phoneMasked: string;
  oneId?: string;
  centers?: string[];
  source: string;
};

export type TagRule = {
  id: string;
  name: string;
  targetTag: { group: string; tag: string };
  /** 标签描述（新建/编辑时填写） */
  description?: string;
  conditions: TagRuleConditions;
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

/** 商品类别 projectCategory 字典 152（扁平，用于订单/商品「产品类型」） */
export const PRODUCT_CATEGORY_OPTIONS = [
  { label: '酒店类', value: '152001' },
  { label: '电商类', value: '152002' },
  { label: '景区类', value: '152003' },
  { label: '线路类', value: '152004' },
  { label: '露营类', value: '152005' },
];

/** 订单状态 03b */
export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: '012001' },
  { label: '待收货/待使用', value: '012002' },
  { label: '已完成', value: '012003' },
  { label: '取消交易', value: '012005' },
  { label: '退款中', value: '012006' },
  { label: '已退单', value: '012007' },
  { label: '待核销', value: '012008' },
  { label: '待评价', value: '012010' },
  { label: '待发货/待确认', value: '012011' },
];

/** 平台营销活动状态 25700x（管理端 platform/marketing/activity） */
export const CAMPAIGN_STATUS_OPTIONS = [
  { label: '待发布', value: '257001' },
  { label: '待启用', value: '257002' },
  { label: '启用', value: '257003' },
  { label: '停用', value: '257004' },
  { label: '已结束', value: '257005' },
  { label: '已废弃', value: '257006' },
];

/** 平台营销活动类型 25600x */
export const CAMPAIGN_TYPE_OPTIONS = [
  { label: '促销优惠类', value: '256001' },
  { label: '会员专属类', value: '256002' },
  { label: '互动营销类', value: '256003' },
  { label: '主题类', value: '256004' },
  { label: '节日类', value: '256005' },
  { label: '拉新类', value: '256006' },
  { label: '推广类', value: '256007' },
];

/**
 * 微信专栏·专题类型 specialType（管理端 columnOpt/tableList.vue）
 * 截图「添加专题」四选一
 */
export const SPECIAL_TYPE_OPTIONS = [
  { label: '项目专题', value: '027001' },
  { label: '优惠券专题', value: '027002' },
  { label: '营销活动专题', value: '027003' },
  { label: '内容专题', value: '027004' },
];

/**
 * 微信专栏·专题模式 specialMode（字典 pid=029）
 * 新建弹窗按专题类型过滤；打标筛选给全量中文名
 * 截图营销活动专题下含「专项福利」；「业务板块模式」现网仓库未见，Demo 保留便于对照截图
 */
export const SPECIAL_MODE_OPTIONS = [
  { label: '自定义模式', value: '029001' },
  { label: '标准模式', value: '029002' },
  { label: '导航模式', value: '029003' },
  { label: '砍价活动', value: '029004' },
  { label: '活动模式', value: '029005' },
  { label: '商品模式', value: '029006' },
  { label: '营销内容', value: '029007' },
  { label: '专项福利', value: '029008' },
  { label: '业务板块模式', value: '029009' },
];

export const CARD_TYPE_OPTIONS = [
  { label: '通用卡', value: '197001' },
  { label: '专属卡', value: '197002' },
  { label: '其他', value: '197003' },
];

/** 储值卡状态 19800x（prepaidCard） */
export const CARD_STATUS_OPTIONS = [
  { label: '进行中', value: '198001' },
  { label: '待启用', value: '198002' },
  { label: '待开始', value: '198003' },
  { label: '停用', value: '198004' },
  { label: '已过期', value: '198005' },
];

export const BROWSE_PAGE_OPTIONS = [
  '首页',
  '商品列表页',
  '商品详情页',
  '活动专题页',
  '优惠券中心',
  '积分商城',
  '个人中心',
  '购物车页',
].map((v) => ({ label: v, value: v }));

/** 浏览页面联级（对齐小程序 pageName / 业务层级） */
export type CascadeOption = { label: string; value: string; children?: CascadeOption[] };

export const BROWSE_PAGE_CASCADE: CascadeOption[] = [
  { label: '首页', value: '首页' },
  {
    label: '商品',
    value: '商品',
    children: [
      {
        label: '景区',
        value: '景区',
        children: [
          { label: '景区列表', value: '景区列表' },
          { label: '商品详情', value: '商品详情' },
        ],
      },
      {
        label: '酒店',
        value: '酒店',
        children: [
          { label: '酒店列表', value: '酒店列表' },
          { label: '商品详情', value: '商品详情' },
        ],
      },
      {
        label: '线路',
        value: '线路',
        children: [
          { label: '线路列表', value: '线路列表' },
          { label: '商品详情', value: '商品详情' },
        ],
      },
      {
        label: '电商',
        value: '电商',
        children: [{ label: '商品详情', value: '商品详情' }],
      },
    ],
  },
  {
    label: '活动',
    value: '活动',
    children: [
      { label: '活动专题页', value: '活动专题页' },
      { label: '五一活动分享页', value: '五一活动分享页' },
    ],
  },
  {
    label: '交易',
    value: '交易',
    children: [
      { label: '填写订单', value: '填写订单' },
      { label: '我的订单', value: '我的订单' },
      { label: '订单详情', value: '订单详情' },
      { label: '购物车', value: '购物车' },
    ],
  },
  {
    label: '个人中心',
    value: '个人中心',
    children: [
      { label: '常用人员', value: '常用人员' },
      { label: '搜索', value: '搜索' },
    ],
  },
  {
    label: '门店',
    value: '门店',
    children: [{ label: '门店详情', value: '门店详情' }],
  },
];

/** 加购商品联级：品类 → 商品名 */
export const CART_PRODUCT_CASCADE: CascadeOption[] = [
  {
    label: '景区类',
    value: '景区类',
    children: [
      { label: '金刀峡景区大门票', value: '金刀峡景区大门票' },
      { label: '重庆国际马戏城门票', value: '重庆国际马戏城门票' },
      { label: '乐和乐都双主题乐园年卡', value: '乐和乐都双主题乐园年卡' },
    ],
  },
  {
    label: '酒店类',
    value: '酒店类',
    children: [
      { label: '统景两江假日酒店', value: '统景两江假日酒店' },
      { label: '黄金游轮豪华标间', value: '黄金游轮豪华标间' },
      { label: '两江假日温泉房', value: '两江假日温泉房' },
    ],
  },
  {
    label: '线路类',
    value: '线路类',
    children: [
      { label: '川西小环线4天3晚', value: '川西小环线4天3晚' },
      { label: '抚仙湖旅居大巴6日游', value: '抚仙湖旅居大巴6日游' },
      { label: '长江奇迹神龙架航次', value: '长江奇迹神龙架航次' },
    ],
  },
  {
    label: '露营类',
    value: '露营类',
    children: [{ label: '露营套餐体验营', value: '露营套餐体验营' }],
  },
  {
    label: '电商类',
    value: '电商类',
    children: [
      { label: '重宾粽礼寻香蒲', value: '重宾粽礼寻香蒲' },
      { label: '千年金山红纪念茶', value: '千年金山红纪念茶' },
      { label: '天友百特轻酸奶', value: '天友百特轻酸奶' },
    ],
  },
];

/** 分享活动联级：活动类型 → 活动名 */
export const SHARE_ACTIVITY_CASCADE: CascadeOption[] = [
  {
    label: '节日活动',
    value: '节日活动',
    children: [
      { label: '五一活动分享页', value: '五一活动分享页' },
      { label: '国庆出游专题', value: '国庆出游专题' },
      { label: '中秋景区联票节', value: '中秋景区联票节' },
    ],
  },
  {
    label: '会员活动',
    value: '会员活动',
    children: [
      { label: '会员日专场', value: '会员日专场' },
      { label: '新客有礼专场', value: '新客有礼专场' },
    ],
  },
  {
    label: '促销活动',
    value: '促销活动',
    children: [
      { label: '暑期特惠推广活动', value: '暑期特惠推广活动' },
      { label: '周末打卡活动', value: '周末打卡活动' },
    ],
  },
];

export const CART_PRODUCT_OPTIONS = [
  '统景两江假日酒店',
  '黄金游轮豪华标间',
  '重宾粽礼寻香蒲',
  '两江假日温泉房',
  '金刀峡景区大门票',
  '乐和乐都双主题乐园年卡',
  '露营套餐体验营',
  '川西小环线4天3晚',
].map((v) => ({ label: v, value: v }));

export const SHARE_ACTIVITY_OPTIONS = [
  '暑期特惠推广活动',
  '周末打卡活动',
  '会员日专场',
  '新客有礼专场',
  '国庆出游专题',
].map((v) => ({ label: v, value: v }));

/** —— 以下为 DWD 可加项 Mock 枚举（只追加，不改既有常量）—— */

export const REG_CHANNEL_OPTIONS = [
  '小程序自然流量',
  '短信投放',
  '线下扫码',
  '渠道推广-五一专题',
  '渠道推广-会员日',
].map((v) => ({ label: v, value: v }));

export const ENTER_WAY_OPTIONS = ['自主注册', '后台录入', '批量导入', '渠道同步'].map((v) => ({
  label: v,
  value: v,
}));

export const REGION_CASCADE: CascadeOption[] = [
  {
    label: '重庆市',
    value: '重庆市',
    children: [
      {
        label: '渝中区',
        value: '渝中区',
        children: [
          { label: '解放碑街道', value: '解放碑街道' },
          { label: '上清寺街道', value: '上清寺街道' },
        ],
      },
      {
        label: '江北区',
        value: '江北区',
        children: [
          { label: '观音桥街道', value: '观音桥街道' },
          { label: '华新街街道', value: '华新街街道' },
        ],
      },
      {
        label: '南岸区',
        value: '南岸区',
        children: [
          { label: '南坪街道', value: '南坪街道' },
          { label: '弹子石街道', value: '弹子石街道' },
        ],
      },
    ],
  },
  {
    label: '四川省',
    value: '四川省',
    children: [
      {
        label: '成都市',
        value: '成都市',
        children: [
          { label: '武侯区', value: '武侯区' },
          { label: '锦江区', value: '锦江区' },
        ],
      },
    ],
  },
  {
    label: '贵州省',
    value: '贵州省',
    children: [
      {
        label: '贵阳市',
        value: '贵阳市',
        children: [
          { label: '南明区', value: '南明区' },
          { label: '云岩区', value: '云岩区' },
        ],
      },
    ],
  },
];

export const PAY_TYPE_OPTIONS = ['微信支付', '支付宝', '储值卡', '线下支付', '其它'].map((v) => ({
  label: v,
  value: v,
}));

export const PAY_STATUS_OPTIONS = ['未支付', '已支付', '支付中', '已关闭'].map((v) => ({
  label: v,
  value: v,
}));

export const VERIFICATION_STATUS_OPTIONS = [
  { label: '未核销', value: '132001' },
  { label: '已核销', value: '132002' },
  { label: '部分核销', value: '132003' },
];

export const STORE_OPTIONS = ['解放碑旗舰店', '观音桥体验店', '南坪门店', '景区自营点'].map(
  (v) => ({ label: v, value: v }),
);

/**
 * 商品分类联级（示意树：一级对齐字典152类别，二/三级对齐管理端 category 树常见文旅结构）
 * 生产应对接 GET /manager/category/table（categoryId + categoryName）
 */
export const PRODUCT_CATEGORY_PATH_CASCADE: CascadeOption[] = [
  {
    label: '景区类',
    value: '景区类',
    children: [
      {
        label: '景区门票',
        value: '景区门票',
        children: [
          { label: '成人票', value: '成人票' },
          { label: '儿童票', value: '儿童票' },
          { label: '亲子票', value: '亲子票' },
          { label: '联票', value: '联票' },
        ],
      },
      {
        label: '乐园/温泉',
        value: '乐园/温泉',
        children: [
          { label: '乐园门票', value: '乐园门票' },
          { label: '温泉票', value: '温泉票' },
          { label: '水世界', value: '水世界' },
        ],
      },
      {
        label: '漂流/溪降',
        value: '漂流/溪降',
        children: [
          { label: '漂流票', value: '漂流票' },
          { label: '溪降票', value: '溪降票' },
        ],
      },
    ],
  },
  {
    label: '酒店类',
    value: '酒店类',
    children: [
      {
        label: '酒店住宿',
        value: '酒店住宿',
        children: [
          { label: '标准间', value: '标准间' },
          { label: '大床房', value: '大床房' },
          { label: '套房', value: '套房' },
        ],
      },
      {
        label: '民宿',
        value: '民宿',
        children: [{ label: '整套房源', value: '整套房源' }],
      },
    ],
  },
  {
    label: '线路类',
    value: '线路类',
    children: [
      {
        label: '一日游',
        value: '一日游',
        children: [
          { label: '精品线路', value: '精品线路' },
          { label: '亲子线路', value: '亲子线路' },
        ],
      },
      {
        label: '多日游',
        value: '多日游',
        children: [{ label: '跟团游', value: '跟团游' }],
      },
    ],
  },
  {
    label: '电商类',
    value: '电商类',
    children: [
      {
        label: '文创特产',
        value: '文创特产',
        children: [
          { label: '文创周边', value: '文创周边' },
          { label: '本地特产', value: '本地特产' },
        ],
      },
      {
        label: '优品商城',
        value: '优品商城',
        children: [{ label: '日用百货', value: '日用百货' }],
      },
    ],
  },
  {
    label: '露营类',
    value: '露营类',
    children: [
      {
        label: '露营体验',
        value: '露营体验',
        children: [
          { label: '露营套餐', value: '露营套餐' },
          { label: '营地门票', value: '营地门票' },
        ],
      },
    ],
  },
];

export const PRODUCT_SALE_STATUS_OPTIONS = ['在售', '停售', '售罄'].map((v) => ({
  label: v,
  value: v,
}));

export const SESSION_NAME_OPTIONS = ['早场', '午场', '晚场', '全日通', '日历价'].map((v) => ({
  label: v,
  value: v,
}));

export const APP_TYPE_OPTIONS = ['主小程序', '景区小程序', '企业专属'].map((v) => ({
  label: v,
  value: v,
}));

export const SPECIAL_PRODUCT_OPTIONS = [
  '金刀峡景区大门票',
  '乐和乐都双主题乐园年卡',
  '川西小环线4天3晚',
  '重宾粽礼寻香蒲',
].map((v) => ({ label: v, value: v }));

export const REACH_WAY_OPTIONS = ['短信', '订阅消息', '海报扫码', '社群'].map((v) => ({
  label: v,
  value: v,
}));

export const CHANNEL_LINK_TYPE_OPTIONS = [
  { label: '产品', value: 'product' },
  { label: '专题', value: 'special' },
];

/** 行为/登录渠道（展示中文，value 保留业务码便于对接） */
export const CHANNEL_CODE_OPTIONS = [
  { label: '五一专题投放', value: 'C001' },
  { label: '会员日投放', value: 'C002' },
  { label: '国庆专题投放', value: 'C003' },
  { label: '微信入口', value: 'ENTER_WX' },
  { label: '短信入口', value: 'ENTER_SMS' },
];

export const COUPON_USE_STATUS_OPTIONS = ['未使用', '已使用', '已过期'].map((v) => ({
  label: v,
  value: v,
}));

export const COUPON_RECEIVE_TYPE_OPTIONS = ['主动领取', '系统发放', '活动赠送', '兑换码'].map(
  (v) => ({ label: v, value: v }),
);

export const RECHARGE_TYPE_OPTIONS = ['充值', '扣减'].map((v) => ({ label: v, value: v }));

export const RECHARGE_OPERATION_TYPE_OPTIONS = ['消费', '退款回退', '后台调整', '过期清零'].map(
  (v) => ({ label: v, value: v }),
);

export const CONSUME_CHANNEL_OPTIONS = ['线上商城', '线下门店', '景区闸机'].map((v) => ({
  label: v,
  value: v,
}));

export const VISIT_CHANNEL_CASCADE: CascadeOption[] = [
  {
    label: '投放渠道',
    value: '投放渠道',
    children: [
      { label: '五一专题投放', value: '五一专题投放' },
      { label: '会员日投放', value: '会员日投放' },
    ],
  },
  {
    label: '自然访问',
    value: '自然访问',
    children: [{ label: '首页入口', value: '首页入口' }],
  },
];

export const JOIN_SPECIAL_CASCADE: CascadeOption[] = [
  {
    label: '国庆出游专题',
    value: '国庆出游专题',
    children: [
      { label: '门票分类', value: '门票分类' },
      { label: '酒店分类', value: '酒店分类' },
    ],
  },
  {
    label: '会员日专场',
    value: '会员日专场',
    children: [
      { label: '积分兑换区', value: '积分兑换区' },
      { label: '专属价区', value: '专属价区' },
    ],
  },
];

/** 当前可配置维度（不含已下线的 product / combo） */
export type ActiveDimKey = Exclude<DimKey, 'product' | 'combo'>;

export const DIM_LABELS: Record<ActiveDimKey, string> = {
  userBehavior: '用户行为',
  member: '会员',
  order: '订单',
  campaign: '活动与专题',
  coupon: '优惠券',
  points: '积分商城',
  storedValue: '优品/储值卡',
};

/** 历史维度文案（摘要/兼容） */
export const LEGACY_DIM_LABELS: Record<'product' | 'combo', string> = {
  product: '商品与供应商',
  combo: '联票与策略',
};

export const DIM_KEYS = Object.keys(DIM_LABELS) as ActiveDimKey[];

export function emptyGroup<K extends DimKey>(_key: K): ConditionGroupMap[K] {
  return { __keys: [] } as ConditionGroupMap[K];
}

export function emptyTagRuleConditions(): TagRuleConditions {
  return {
    dimLogic: 'AND',
    member: { groups: [emptyGroup('member')] },
    order: { groups: [emptyGroup('order')] },
    product: { groups: [emptyGroup('product')] },
    combo: { groups: [emptyGroup('combo')] },
    campaign: { groups: [emptyGroup('campaign')] },
    coupon: { groups: [emptyGroup('coupon')] },
    points: { groups: [emptyGroup('points')] },
    storedValue: { groups: [emptyGroup('storedValue')] },
    userBehavior: { groups: [emptyGroup('userBehavior')] },
  };
}

function filledCount(obj: Record<string, unknown> | undefined): number {
  if (!obj) return 0;
  return Object.entries(obj).filter(([k, v]) => {
    if (k.startsWith('__')) return false;
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
    ...DIM_LABELS,
    ...LEGACY_DIM_LABELS,
  };
  const c = (conditions || {}) as Partial<TagRuleConditions>;
  const out: string[] = [];
  (Object.keys(labels) as DimKey[]).forEach((dim) => {
    const groups = c[dim]?.groups || [];
    groups.forEach((g, i) => {
      const keys = Object.keys(g as object).filter((k) => {
        if (k.startsWith('__')) return false;
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
  centers?: string[],
): PreviewSample[] {
  const count = Math.min(5, estimateCount(conditions));
  const sources = describeConditionSources(conditions);
  const sourceStr = sources.join('；');
  const names = ['张三', '李四', '王五', '赵六', '钱七'];
  const centerList = centers?.length ? centers : ['山城工惠'];
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    memberId: `M${10000 + i}`,
    name: names[i] || `会员${i + 1}`,
    phoneMasked: `138****${String(1000 + i).slice(-4)}`,
    oneId: `OID20260812${String(i + 1).padStart(4, '0')}`,
    centers: [centerList[i % centerList.length]],
    source: sourceStr,
  }));
}

/** 预览 SQL 清单：按维度汇总已填筛选（供专业人士查看） */
export function summarizeDimFilters(
  conditions?: TagRuleConditions | Record<string, unknown>,
): { dim: string; summary: string }[] {
  const labels: Record<DimKey, string> = {
    userBehavior: '用户行为（浏览/加购/分享等）',
    member: '会员',
    order: '订单（含支付/退款）',
    product: LEGACY_DIM_LABELS.product,
    combo: LEGACY_DIM_LABELS.combo,
    campaign: '活动与专题',
    coupon: '优惠券',
    points: '积分商城',
    storedValue: '优品/储值卡',
  };
  const c = (conditions || {}) as Partial<TagRuleConditions>;
  const rows: { dim: string; summary: string }[] = [];
  (Object.keys(labels) as DimKey[]).forEach((dim) => {
    const groups = c[dim]?.groups || [];
    const parts: string[] = [];
    groups.forEach((g, i) => {
      const entries = Object.entries(g as Record<string, unknown>).filter(([k, v]) => {
        if (k.startsWith('__')) return false;
        if (v === undefined || v === null || v === '') return false;
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return filledCount(v as Record<string, unknown>) > 0;
        return true;
      });
      if (!entries.length) return;
      const text = entries
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('/') : JSON.stringify(v)}`)
        .join('，');
      parts.push(`组${i + 1}：${text}`);
    });
    if (parts.length) rows.push({ dim: labels[dim], summary: parts.join('；') });
  });
  return rows.length ? rows : [{ dim: '（未配置）', summary: '尚未勾选维度筛选条件' }];
}

export function hasAnyDimCondition(
  conditions?: TagRuleConditions | Record<string, unknown> | null,
): boolean {
  const c = normalizeTagRuleConditions(conditions);
  return DIM_KEYS.some((dim) =>
    (c[dim]?.groups || []).some((g) => filledCount(g as Record<string, unknown>) > 0),
  );
}

/** 兼容本地曾存过的扁平 groups[]；统一为按维结构 */
export function normalizeTagRuleConditions(
  conditions?: TagRuleConditions | Record<string, unknown> | null,
): TagRuleConditions {
  if (!conditions || typeof conditions !== 'object') return emptyTagRuleConditions();
  const raw = conditions as Record<string, unknown>;

  if (Array.isArray(raw.groups)) {
    const base = emptyTagRuleConditions();
    if (raw.dimLogic === 'AND' || raw.dimLogic === 'OR') {
      base.dimLogic = raw.dimLogic;
    }
    (raw.groups as { items?: { dim: DimKey; field: string; value?: unknown }[] }[]).forEach(
      (g) => {
        const byDim: Partial<Record<DimKey, Record<string, unknown>>> = {};
        (g.items || []).forEach((it) => {
          if (!it?.dim || !it?.field) return;
          if (!byDim[it.dim]) byDim[it.dim] = {};
          byDim[it.dim]![it.field] = it.value;
        });
        (Object.keys(byDim) as DimKey[]).forEach((dim) => {
          const fields = byDim[dim]!;
          if (!Object.keys(fields).length) return;
          const cur = base[dim].groups as Record<string, unknown>[];
          // 去掉初始化的空组
          if (cur.length === 1 && filledCount(cur[0]) === 0) {
            (base as any)[dim].groups = [fields];
          } else {
            (base as any)[dim].groups = [...cur, fields];
          }
        });
      },
    );
    return base;
  }

  const base = emptyTagRuleConditions();
  if (raw.dimLogic === 'AND' || raw.dimLogic === 'OR') {
    base.dimLogic = raw.dimLogic;
  }
  DIM_KEYS.forEach((dim) => {
    const d = raw[dim] as DimConditions<typeof dim> | undefined;
    if (d?.groups?.length) {
      base[dim] = { groups: d.groups.map((g) => ({ ...(g as object) })) as any };
    }
  });
  // 兼容：会员·账户类型曾为单选 string
  base.member.groups = base.member.groups.map((g) => {
    const ut = (g as { userType?: string | string[] }).userType;
    if (typeof ut === 'string' && ut) {
      return { ...g, userType: [ut] };
    }
    return g;
  });
  return base;
}

export function formatConditionsReadable(
  conditions?: TagRuleConditions | Record<string, unknown> | string | null,
): string {
  if (typeof conditions === 'string') return conditions.trim() || '未配置维度筛选';
  const rows = summarizeDimFilters(conditions || undefined);
  if (rows.length === 1 && rows[0].dim === '（未配置）') return '未配置维度筛选';
  return rows.map((r) => `（${r.dim}）${r.summary}`).join('  且  ');
}
