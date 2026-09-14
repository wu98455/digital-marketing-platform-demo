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
  /** 正式执行时间；未执行则为空 */
  executedAt?: string;
  periodic: boolean;
  mine: boolean;
  approver: string;
  canEdit: boolean;
  canDelete: boolean;
  pinned: boolean;
};

/** 中秋团圆礼遇触达（ACT202603）及置顶副本（ACT202600 / 中秋团圆礼遇触达-1） */
function isFestivalCare4(item?: { id?: string; name?: string } | null) {
  if (!item) return false;
  return (
    item.id === 'ACT202603' ||
    item.id === 'ACT202600' ||
    item.name === '中秋团圆礼遇触达' ||
    item.name === '中秋团圆礼遇触达-1' ||
    item.name === '端午重宾粽礼触达'
  );
}

/** 沉默大会员唤醒：开始 → 选人 → 发短信 → 发优惠券 → 结束 */
function isSilentWake8(item?: { id?: string; name?: string } | null) {
  if (!item) return false;
  return item.id === 'ACT202607' || item.name === '沉默大会员唤醒';
}

const FESTIVAL_SMS_A =
  '【文旅惠】中秋快乐！团圆月饼礼盒限时满减，精选中秋伴手礼打开小程序立即选购。拒收请回复 R';
const FESTIVAL_SMS_B =
  '【文旅惠】中秋佳节至，会员专享月饼券已到账，到店/小程序核销享优惠。详情见活动页。拒收请回复 R';

function festivalCare4DesignNodes() {
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
    link('n1', 'n2', { sourceSide: 'right', targetSide: 'left' }),
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

function resolveDesignNodes(item?: { id?: string; name?: string } | null) {
  if (isFestivalCare4(item)) return festivalCare4DesignNodes();
  if (isSilentWake8(item)) return silentWake8DesignNodes();
  return [
    { id: 'n1', name: '开始', type: '开始', config: '活动触发' },
    { id: 'n2', name: '人群圈选', type: '人群', config: '静态人群 · 高价值客户' },
    { id: 'n3', name: '合并去重', type: '处理', config: '按客户ID去重' },
    { id: 'n4', name: '短信触达', type: '触达', config: '普通短信模板 A' },
    { id: 'n5', name: '结束', type: '结束', config: '完成' },
  ];
}

function resolveDesignEdges(item?: { id?: string; name?: string } | null) {
  if (isFestivalCare4(item)) return festivalCare4DesignEdges();
  return null;
}

function festivalCare4ReportNodes() {
  const entered = 12840;
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
      nodeName: '发短信',
      nodeType: '触达',
      entered,
      success: smsAOk + smsBOk,
      failed: entered - smsAOk - smsBOk,
      duration: '2m',
    },
    {
      id: '4',
      nodeName: '是否购买',
      nodeType: '判断',
      entered: smsAOk + smsBOk,
      success: convertA + convertB,
      failed: failA + failB,
      duration: '3d',
    },
    {
      id: '5',
      nodeName: '小程序发券',
      nodeType: '触达',
      entered: failA + failB,
      success: couponOk,
      failed: failA + failB - couponOk,
      duration: '1m',
    },
    {
      id: '6',
      nodeName: '结束',
      nodeType: '结束',
      entered: convertA + convertB + couponOk,
      success: convertA + convertB + couponOk,
      failed: 0,
      duration: '1s',
    },
  ];
}

function festivalCare4ReportSummary() {
  const nodes = festivalCare4ReportNodes();
  const sms = nodes.find((n) => n.nodeName === '发短信')!;
  const judge = nodes.find((n) => n.nodeName === '是否购买')!;
  const coupon = nodes.find((n) => n.nodeName === '小程序发券')!;
  const convertSuccess = judge.success;
  const convertFail = judge.failed;
  return {
    entered: 12840,
    /** 漏斗：触达成功 = 转换成功 + 转换失败 */
    reachSuccess: convertSuccess + convertFail,
    reachFail: sms.failed,
    convertSuccess,
    convertFail,
    benefitIssued: coupon.success,
    hasConvert: true,
  };
}

function silentWake8ReportNodes() {
  const entered = 9600;
  const smsSuccess = Math.floor(entered * 0.9);
  const smsFail = entered - smsSuccess;
  const couponSuccess = Math.floor(smsSuccess * 0.92);
  const couponFail = smsSuccess - couponSuccess;
  return [
    { id: '1', nodeName: '开始', nodeType: '开始', entered: 0, success: 0, failed: 0, duration: '-' },
    { id: '2', nodeName: '选人', nodeType: '人群', entered, success: entered, failed: 0, duration: '30s' },
    { id: '3', nodeName: '发短信', nodeType: '触达', entered, success: smsSuccess, failed: smsFail, duration: '2m' },
    {
      id: '4',
      nodeName: '发优惠券',
      nodeType: '触达',
      entered: smsSuccess,
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

function silentWake8ReportSummary() {
  const nodes = silentWake8ReportNodes();
  const sms = nodes.find((n) => n.nodeName === '发短信')!;
  const coupon = nodes.find((n) => n.nodeName === '发优惠券')!;
  return {
    entered: 9600,
    reachSuccess: sms.success,
    reachFail: sms.failed,
    benefitIssued: coupon.success,
    hasConvert: false,
  };
}

function resolveReportNodes(item?: { id?: string; name?: string } | null) {
  if (isFestivalCare4(item)) return festivalCare4ReportNodes();
  if (isSilentWake8(item)) return silentWake8ReportNodes();
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
  const silentWake8 = activities.find((a) => a.id === 'ACT202607' || a.name === '沉默大会员唤醒');
  if (silentWake8) {
    silentWake8.status = '已结束';
    silentWake8.canEdit = false;
    silentWake8.canDelete = true;
  }
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
    activityName: ['乐和乐都亲子年卡召回', '国企优品会员日促销', '沉默大会员唤醒', '中秋团圆礼遇触达'][i % 4],
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
      createdAtRange,
      executedAtRange,
    } = req.query as Record<string, string>;
    let list = [...activities];
    if (catalog && catalog !== '所有' && catalog !== '全部') {
      list = list.filter((x) => x.catalog === catalog);
    }
    if (keyword) {
      list = list.filter((x) => x.name.includes(keyword));
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
    const inRange = (value: string | undefined, rangeRaw?: string) => {
      if (!rangeRaw) return true;
      const range = String(rangeRaw).split(',');
      if (!range[0] || !range[1]) return true;
      const day = (value || '').slice(0, 10);
      if (!day) return false;
      return day >= range[0] && day <= range[1];
    };
    if (createdAtRange) list = list.filter((x) => inRange(x.createdAt, createdAtRange));
    if (executedAtRange) list = list.filter((x) => inRange(x.executedAt, executedAtRange));
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
        nodes: resolveDesignNodes(item),
        edges: resolveDesignEdges(item) || undefined,
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
    const updated = patchActivity(item.id, { status: '待审批', canEdit: false });
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
    const updated = patchActivity(item.id, { status: '已通过', canEdit: true, canDelete: true });
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
    const updated = patchActivity(item.id, { status: '已驳回', canEdit: true, canDelete: true });
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
      const updated = patchActivity(item.id, {
        status: '进行中',
        canEdit: false,
        canDelete: false,
      });
      res.json({ success: true, data: updated });
      return;
    }
    if (item.status !== '已通过') {
      fail(res, '须审批通过后才能正式执行');
      return;
    }
    const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updated = patchActivity(item.id, {
      status: '进行中',
      executedAt: item.executedAt || ts,
      canEdit: false,
      canDelete: false,
    });
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
    const updated = patchActivity(item.id, { status: '已暂停', canEdit: false, canDelete: false });
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
        summary: isSilentWake8(item)
          ? silentWake8ReportSummary()
          : isFestivalCare4(item)
            ? festivalCare4ReportSummary()
            : {
                entered: 12840,
                reachSuccess: 10211,
                reachFail: 329,
                benefitIssued: 860,
                hasConvert: false,
              },
        nodes: resolveReportNodes(item),
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
      list = list.filter((x) => x.name.includes(keyword));
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
