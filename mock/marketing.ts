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
  'GET /api/crowd-marketing/activities/:id/report': (req: Request, res: Response) => {
    const item = activities.find((a) => a.id === req.params.id) || activities[0];
    res.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
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
};
