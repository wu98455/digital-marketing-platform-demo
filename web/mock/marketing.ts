import type { Request, Response } from 'express';
import { appendAudit, validateActivityApprover } from '../src/utils/systemAdminStore';

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

/** 确保至少有一条待 demo 审批，便于演示 */
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

/** 一行 = 一场活动的一次执行 */
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

function findActivity(id: string) {
  return activities.find((a) => a.id === id);
}

function patchActivity(id: string, patch: Partial<ActivityRow>) {
  const idx = activities.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  activities[idx] = { ...activities[idx], ...patch };
  return activities[idx];
}

function isExecutedStatus(status: string) {
  return ['进行中', '已暂停', '已结束'].includes(status);
}

function fail(res: Response, errorMessage: string) {
  res.json({ success: false, errorMessage });
}

export default {
  'GET /api/crowd-marketing/activities': (req: Request, res: Response) => {
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
    } = req.query as Record<string, string>;
    let list = [...activities];
    if (catalog && catalog !== '所有' && catalog !== '全部') {
      list = list.filter((x) => x.catalog === catalog);
    }
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (status && status !== '全部') list = list.filter((x) => x.status === status);
    if (creator) list = list.filter((x) => x.creator.includes(creator));
    if (periodic === '是') list = list.filter((x) => x.periodic);
    if (periodic === '否') list = list.filter((x) => !x.periodic);
    if (onlyPeriodic === 'true') list = list.filter((x) => x.periodic);
    if (onlyMine === 'true') list = list.filter((x) => x.mine || x.creator === currentUser);
    if (pendingApprove === 'true') {
      list = list.filter((x) => x.status === '待审批' && x.approver === currentUser);
    }
    res.json(pageSlice(list, current, pageSize));
  },
  'POST /api/crowd-marketing/activities': (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, any>;
    const creator = String(body.currentUser || body.creator || 'demo');
    const approver = String(body.approver || '');
    const err = validateActivityApprover(creator, approver);
    if (err) {
      fail(res, err);
      return;
    }
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
    res.json({ success: true, data: item });
  },
  'GET /api/crowd-marketing/activities/:id': (req: Request, res: Response) => {
    const item = findActivity(req.params.id) || activities[0];
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
  'POST /api/crowd-marketing/activities/:id/submit-approve': (req: Request, res: Response) => {
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (!['草稿', '已驳回'].includes(item.status)) {
      fail(res, `当前状态「${item.status}」不可提交审批`);
      return;
    }
    if (!item.approver) {
      fail(res, '请先指定审批人');
      return;
    }
    const updated = patchActivity(item.id, { status: '待审批' });
    res.json({ success: true, data: updated });
  },
  'POST /api/crowd-marketing/activities/:id/approve': (req: Request, res: Response) => {
    const currentUser = String((req.body || {}).currentUser || req.query.currentUser || 'demo');
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (item.status !== '待审批') {
      fail(res, '仅待审批活动可通过');
      return;
    }
    if (item.approver !== currentUser) {
      fail(res, '仅指定审批人可通过');
      return;
    }
    const updated = patchActivity(item.id, { status: '已通过' });
    appendAudit(currentUser, '审批通过', item.name);
    res.json({ success: true, data: updated });
  },
  'POST /api/crowd-marketing/activities/:id/reject': (req: Request, res: Response) => {
    const currentUser = String((req.body || {}).currentUser || req.query.currentUser || 'demo');
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (item.status !== '待审批') {
      fail(res, '仅待审批活动可驳回');
      return;
    }
    if (item.approver !== currentUser) {
      fail(res, '仅指定审批人可驳回');
      return;
    }
    const updated = patchActivity(item.id, { status: '已驳回' });
    appendAudit(currentUser, '审批驳回', item.name);
    res.json({ success: true, data: updated, remark: (req.body || {}).remark });
  },
  'POST /api/crowd-marketing/activities/:id/formal-run': (req: Request, res: Response) => {
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (item.status === '已暂停') {
      const updated = patchActivity(item.id, { status: '进行中' });
      res.json({ success: true, data: updated });
      return;
    }
    if (item.status !== '已通过') {
      fail(res, '须审批通过后才能正式执行');
      return;
    }
    const updated = patchActivity(item.id, { status: '进行中' });
    res.json({ success: true, data: updated });
  },
  'POST /api/crowd-marketing/activities/:id/pause': (req: Request, res: Response) => {
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (item.status !== '进行中') {
      fail(res, '仅进行中的活动可暂停');
      return;
    }
    const updated = patchActivity(item.id, { status: '已暂停' });
    res.json({ success: true, data: updated });
  },
  'POST /api/crowd-marketing/activities/:id/invalidate-approve': (req: Request, res: Response) => {
    const item = findActivity(req.params.id);
    if (!item) {
      fail(res, '活动不存在');
      return;
    }
    if (!['已通过', '进行中', '已暂停'].includes(item.status)) {
      res.json({ success: true, data: item, changed: false });
      return;
    }
    const updated = patchActivity(item.id, { status: '草稿' });
    res.json({ success: true, data: updated, changed: true });
  },
  'GET /api/crowd-marketing/activities/:id/report': (req: Request, res: Response) => {
    const item = findActivity(req.params.id) || activities[0];
    const executed = isExecutedStatus(item.status);
    if (!executed) {
      res.json({
        success: true,
        data: {
          id: item.id,
          name: item.name,
          status: item.status,
          executed: false,
          execStatus: '未执行',
        },
      });
      return;
    }
    res.json({
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
    });
  },
  'GET /api/crowd-marketing/templates/local': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, catalog, keyword, onlyMine, periodic } = req.query as Record<
      string,
      string
    >;
    let list = [...localTemplates];
    if (catalog && catalog !== '所有' && catalog !== '全部') {
      list = list.filter((x) => x.catalog === catalog);
    }
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword) || x.id.includes(keyword));
    }
    if (periodic === '是') list = list.filter((x) => x.periodic);
    if (periodic === '否') list = list.filter((x) => !x.periodic);
    if (onlyMine === 'true') list = list.filter((x) => x.mine);
    res.json(pageSlice(list, current, pageSize));
  },
  'POST /api/crowd-marketing/templates/local': (req: Request, res: Response) => {
    const body = (req.body || {}) as Record<string, any>;
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
    res.json({ success: true, data: item });
  },
  'DELETE /api/crowd-marketing/templates/local/:id': (req: Request, res: Response) => {
    localTemplates = localTemplates.filter((t) => t.id !== req.params.id);
    res.json({ success: true });
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
  'GET /api/crowd-marketing/node-records': (req: Request, res: Response) => {
    const {
      current = 1,
      pageSize = 10,
      activityName,
      status,
      periodic,
      startAtRange,
    } = req.query as Record<string, string>;
    let list = [...activityExecRecords].sort((a, b) => (a.startAt < b.startAt ? 1 : -1));
    if (activityName) list = list.filter((x) => x.activityName.includes(activityName));
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
    res.json(pageSlice(list, current, pageSize));
  },
};
