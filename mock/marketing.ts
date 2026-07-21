import type { Request, Response } from 'express';

function pageSlice<T>(list: T[], current = 1, pageSize = 10) {
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

export default {
  'GET /api/crowd-marketing/activities': (req: Request, res: Response) => {
    const {
      current = 1,
      pageSize = 10,
      catalog,
      keyword,
      status,
      onlyPeriodic,
      onlyMine,
      pendingApprove,
    } = req.query as Record<string, string>;
    let list = [...activities];
    if (catalog && catalog !== '所有') list = list.filter((x) => x.catalog === catalog);
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (status && status !== '全部') list = list.filter((x) => x.status === status);
    if (onlyPeriodic === 'true') list = list.filter((x) => x.periodic);
    if (onlyMine === 'true') list = list.filter((x) => x.mine);
    if (pendingApprove === 'true') list = list.filter((x) => x.pendingApprove);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/crowd-marketing/activities/:id': (req: Request, res: Response) => {
    const item = activities.find((a) => a.id === req.params.id) || activities[0];
    res.json({
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
    });
  },
  'GET /api/crowd-marketing/templates/local': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, catalog, keyword, onlyMine } = req.query as Record<
      string,
      string
    >;
    let list = [...localTemplates];
    if (catalog && catalog !== '所有') list = list.filter((x) => x.catalog === catalog);
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (onlyMine === 'true') list = list.filter((x) => x.mine);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/crowd-marketing/templates/local/:id': (req: Request, res: Response) => {
    const item = localTemplates.find((t) => t.id === req.params.id) || localTemplates[0];
    res.json({
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
    });
  },
  'GET /api/crowd-marketing/templates/cloud': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, keyword, type } = req.query as Record<string, string>;
    let list = [...cloudTemplates];
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (type && type !== '全部') list = list.filter((x) => x.type === type);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/crowd-marketing/node-records': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, activityId, activityName, nodeStatus } =
      req.query as Record<string, string>;
    let list = [...nodeRecords].sort((a, b) => (a.planAt < b.planAt ? 1 : -1));
    if (activityId) list = list.filter((x) => x.activityId.includes(activityId));
    if (activityName) list = list.filter((x) => x.activityName.includes(activityName));
    if (nodeStatus && nodeStatus !== '全部') list = list.filter((x) => x.status === nodeStatus);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/event-marketing/scenarios': (_req: Request, res: Response) => {
    res.json({ success: true, data: careScenarios });
  },
  'GET /api/event-marketing/plans': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, keyword, scene, status, onlyMine } = req.query as Record<
      string,
      string
    >;
    let list = [...carePlans];
    if (keyword) {
      list = list.filter(
        (x) => x.name.includes(keyword) || x.id.includes(keyword) || x.scene.includes(keyword),
      );
    }
    if (scene && scene !== '全部') list = list.filter((x) => x.scene === scene);
    if (status && status !== '全部') list = list.filter((x) => x.status === status);
    if (onlyMine === 'true') list = list.filter((x) => x.mine);
    res.json(pageSlice(list, current, pageSize));
  },
  'GET /api/event-marketing/records': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, channel, status } = req.query as Record<string, string>;
    let list = [...careRecords];
    if (channel && channel !== '全部') list = list.filter((x) => x.channel === channel);
    if (status && status !== '全部') list = list.filter((x) => x.status === status);
    const costTotal = list.reduce((sum, x) => sum + Number(x.cost), 0);
    res.json({ ...pageSlice(list, current, pageSize), costTotal: costTotal.toFixed(2) });
  },
  'GET /api/event-marketing/stats': (req: Request, res: Response) => {
    const category = (req.query.category as string) || '入会绑定';
    res.json({
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
    });
  },
};
