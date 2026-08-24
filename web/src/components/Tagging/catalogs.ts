import type { TagGroup } from './types';

/** 人群标签库（按业务分类） */
export const CUSTOMER_TAG_CATALOG: TagGroup[] = [
  {
    group: '客户价值',
    tags: ['高价值', '中价值', '低价值', '大会员'],
  },
  {
    group: '生命周期',
    tags: ['潜客', '新客', '活跃', '沉默', '流失预警', '复购'],
  },
  {
    group: '消费偏好',
    tags: ['亲子游', '周边游', '酒店偏好', '门票敏感'],
  },
  {
    group: '渠道触达',
    tags: ['小程序活跃', '短信可达', '分销来源'],
  },
];

/** 店铺标签库（旧能力保留，菜单已下线） */
export const STORE_TAG_CATALOG: TagGroup[] = [
  { group: '经营属性', tags: ['自营重点', '三方合作', '旗舰店', '体验店'] },
  { group: '区域特征', tags: ['主城核心', '周边景区', '线上专营'] },
  { group: '运营状态', tags: ['高转化', '待激活', '季节旺铺'] },
];

/** 商品标签库 */
export const PRODUCT_TAG_CATALOG: TagGroup[] = [
  { group: '销售策略', tags: ['热销', '推荐', '季节限定', '清仓'] },
  { group: '客群适配', tags: ['亲子', '高端', '学生价', '银发友好'] },
  { group: '品类特征', tags: ['门票', '酒店', '文创', '联票'] },
];

/** 专题活动标签库 */
export const CAMPAIGN_TAG_CATALOG: TagGroup[] = [
  { group: '活动类型', tags: ['节日大促', '景区专题', '会员日', '渠道投放'] },
  { group: '触达渠道', tags: ['小程序', '短信', '站内信', '线下'] },
  { group: '目标客群', tags: ['拉新', '促活', '召回', '升单'] },
];
