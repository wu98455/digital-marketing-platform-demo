import {
  AimOutlined,
  ApartmentOutlined,
  CaretRightOutlined,
  CloudUploadOutlined,
  CompressOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  ExpandOutlined,
  FormOutlined,
  GiftOutlined,
  HistoryOutlined,
  MessageOutlined,
  PartitionOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  SearchOutlined,
  StarOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FilterOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, request, useAccess, useLocation, useModel, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Cascader,
  Checkbox,
  Collapse,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  TimePicker,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pageHeader } from '@/utils/pageHeader';
import { MARKETING_CENTERS } from '@/utils/centers';
import { PRODUCT_CATEGORY_OPTIONS } from '@/utils/tagRuleTypes';
import {
  BROWSE_PAGE_CASCADE,
  CART_PRODUCT_CASCADE,
  CHANNEL_CODE_OPTIONS,
  JOIN_SPECIAL_CASCADE,
  SHARE_ACTIVITY_CASCADE,
  VISIT_CHANNEL_CASCADE,
} from '@/utils/tagRuleTypes';
import { getFavoriteTagKeys, getRecentTagKeys, tagIdentity } from '@/utils/tagFavorites';
import {
  pickTestResultPresentation,
  runCanvasTest,
  type TestRunResult,
} from './testRun';
import './canvas.less';

type CanvasNode = {
  id: string;
  name: string;
  type: string;
  icon?: string;
  x: number;
  y: number;
  config?: string;
  meta?: Record<string, string>;
};

type PortSide = 'left' | 'right' | 'top' | 'bottom';

type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  /** 判断节点出边：已购买 / 未购买 */
  label?: string;
  sourceSide?: PortSide;
  targetSide?: PortSide;
};

const JUDGE_BRANCH_LABELS = ['已购买', '未购买'] as const;
const PORT_SIDES: PortSide[] = ['top', 'right', 'bottom', 'left'];

const CANVAS_NODE_GAP_X = 220;
const CANVAS_NODE_GAP_Y = 160;
const CANVAS_LAYOUT_START_X = 80;
const CANVAS_LAYOUT_START_Y = 80;
/** 同行布局基准高度：按中心对齐，避免开始圆与卡片锚点错位出「小台阶」 */
const CANVAS_ROW_NODE_H = 92;
/** 水平/垂直锚点 Y（或 X）差小于此值时视为共线，直接拉直 */
const EDGE_ALIGN_EPS = 14;
/** 不超过此数量时单行横向流程图；超出再折行（蛇形，续接在上一行末节点下方） */
const CANVAS_MAX_NODES_PER_ROW = 8;

function normalizeCanvasNodeName(name?: string) {
  return name === '人群' || name === '人群圈选' ? '选人' : name || '节点';
}

/** 「是否购买」判断节点（布局/默认边专用） */
function isJudgeNode(node?: CanvasNode | null) {
  return !!node && node.name === '是否购买';
}

function isVisitJudgeNode(node?: CanvasNode | null) {
  return !!node && node.name === '是否访问';
}

function isCouponNode(node?: CanvasNode | null) {
  return !!node && (node.name === '小程序发券' || node.name === '发优惠券');
}

const nodeSize = (node: CanvasNode) =>
  node.type === '开始' ? { w: 72, h: 72 } : { w: 128, h: 92 };

/** 同行节点按垂直中心对齐后的 top */
function rowAlignedY(type: string | undefined, rowTop: number) {
  const h = type === '开始' ? 72 : CANVAS_ROW_NODE_H;
  return rowTop + (CANVAS_ROW_NODE_H - h) / 2;
}

function portPoint(node: CanvasNode, side: PortSide) {
  const { w, h } = nodeSize(node);
  if (side === 'left') return { x: node.x, y: node.y + h / 2 };
  if (side === 'right') return { x: node.x + w, y: node.y + h / 2 };
  if (side === 'top') return { x: node.x + w / 2, y: node.y };
  return { x: node.x + w / 2, y: node.y + h };
}

function nearestPortSide(node: CanvasNode, worldX: number, worldY: number): PortSide {
  let best: PortSide = 'left';
  let bestD = Infinity;
  PORT_SIDES.forEach((side) => {
    const p = portPoint(node, side);
    const d = (p.x - worldX) ** 2 + (p.y - worldY) ** 2;
    if (d < bestD) {
      bestD = d;
      best = side;
    }
  });
  return best;
}

/** 未指定锚点时，按两节点相对位置自动选边 */
function autoPortSides(from: CanvasNode, to: CanvasNode): { sourceSide: PortSide; targetSide: PortSide } {
  const { w: fw, h: fh } = nodeSize(from);
  const { w: tw, h: th } = nodeSize(to);
  const dx = to.x + tw / 2 - (from.x + fw / 2);
  const dy = to.y + th / 2 - (from.y + fh / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceSide: 'right', targetSide: 'left' }
      : { sourceSide: 'left', targetSide: 'right' };
  }
  return dy >= 0
    ? { sourceSide: 'bottom', targetSide: 'top' }
    : { sourceSide: 'top', targetSide: 'bottom' };
}

type Pt = { x: number; y: number };

function stubPoint(x: number, y: number, side: PortSide, len = 28): Pt {
  if (side === 'left') return { x: x - len, y };
  if (side === 'right') return { x: x + len, y };
  if (side === 'top') return { x, y: y - len };
  return { x, y: y + len };
}

/** 正交折线（直角拐点）；近乎共线时直接拉直，避免无意义小台阶 */
function buildEdgePoints(
  x1: number,
  y1: number,
  sourceSide: PortSide,
  x2: number,
  y2: number,
  targetSide: PortSide,
): Pt[] {
  const sourceHoriz = sourceSide === 'left' || sourceSide === 'right';
  const targetHoriz = targetSide === 'left' || targetSide === 'right';

  // 左右互连且高度接近 → 一条水平直线（或极浅斜线，无拐点）
  if (sourceHoriz && targetHoriz && Math.abs(y1 - y2) <= EDGE_ALIGN_EPS) {
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }
  // 上下互连且水平接近 → 一条竖直线
  if (!sourceHoriz && !targetHoriz && Math.abs(x1 - x2) <= EDGE_ALIGN_EPS) {
    return [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
    ];
  }

  const startExit = stubPoint(x1, y1, sourceSide);
  const endEntry = stubPoint(x2, y2, targetSide);
  const points: Pt[] = [{ x: x1, y: y1 }, startExit];
  const sx = startExit.x;
  const sy = startExit.y;
  const ex = endEntry.x;
  const ey = endEntry.y;

  if (sourceHoriz && targetHoriz) {
    if (Math.abs(sy - ey) > EDGE_ALIGN_EPS) {
      const facing =
        (sourceSide === 'right' && targetSide === 'left' && sx <= ex) ||
        (sourceSide === 'left' && targetSide === 'right' && sx >= ex);
      if (facing) {
        const midX = (sx + ex) / 2;
        points.push({ x: midX, y: sy }, { x: midX, y: ey });
      } else {
        const midY = (sy + ey) / 2;
        points.push({ x: sx, y: midY }, { x: ex, y: midY });
      }
    }
  } else if (!sourceHoriz && !targetHoriz) {
    if (Math.abs(sx - ex) > EDGE_ALIGN_EPS) {
      const facing =
        (sourceSide === 'bottom' && targetSide === 'top' && sy <= ey) ||
        (sourceSide === 'top' && targetSide === 'bottom' && sy >= ey);
      if (facing) {
        const midY = (sy + ey) / 2;
        points.push({ x: sx, y: midY }, { x: ex, y: midY });
      } else {
        const midX = (sx + ex) / 2;
        points.push({ x: midX, y: sy }, { x: midX, y: ey });
      }
    }
  } else if (sourceHoriz) {
    points.push({ x: ex, y: sy });
  } else {
    points.push({ x: sx, y: ey });
  }

  points.push(endEntry, { x: x2, y: y2 });
  return points;
}

function pointsToPath(points: Pt[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function pointAlongPath(points: Pt[], ratio: number): Pt {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };
  let total = 0;
  const segs: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segs.push(len);
    total += len;
  }
  if (total < 0.5) return points[0];
  let remain = total * Math.min(1, Math.max(0, ratio));
  for (let i = 1; i < points.length; i += 1) {
    const seg = segs[i - 1];
    if (remain <= seg) {
      const t = seg === 0 ? 0 : remain / seg;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
    remain -= seg;
  }
  return points[points.length - 1];
}

/** 旅程节点坐标：能一行就一行，多了才换行；同行按中心对齐 */
function layoutFlowNodes(
  apiNodes: { id?: string; name?: string; type?: string; config?: string; meta?: Record<string, string> }[],
): CanvasNode[] {
  const count = apiNodes.length;
  const singleRow = count <= CANVAS_MAX_NODES_PER_ROW;
  return apiNodes.map((n, i) => {
    let x: number;
    let rowTop: number;
    if (singleRow) {
      x = CANVAS_LAYOUT_START_X + i * CANVAS_NODE_GAP_X;
      rowTop = CANVAS_LAYOUT_START_Y;
    } else {
      const row = Math.floor(i / CANVAS_MAX_NODES_PER_ROW);
      const idxInRow = i % CANVAS_MAX_NODES_PER_ROW;
      const col = row % 2 === 0 ? idxInRow : CANVAS_MAX_NODES_PER_ROW - 1 - idxInRow;
      x = CANVAS_LAYOUT_START_X + col * CANVAS_NODE_GAP_X;
      rowTop = CANVAS_LAYOUT_START_Y + row * CANVAS_NODE_GAP_Y;
    }
    return {
      id: n.id || `n${i}`,
      name: normalizeCanvasNodeName(n.name),
      type: n.type || '触达',
      config: n.config,
      meta: n.meta,
      x,
      y: rowAlignedY(n.type, rowTop),
    };
  });
}

/**
 * 含「是否购买」时：主链单行到判断；未购买向右接发券；已购买从判断底部接结束左侧
 */
function applyJudgeBranchLayout(nodes: CanvasNode[]): CanvasNode[] {
  const judge = nodes.find((n) => isJudgeNode(n));
  const end = nodes.find((n) => n.type === '结束');
  if (!judge || !end) return nodes;
  const coupon = nodes.find((n) => isCouponNode(n));
  const judgeIdx = nodes.findIndex((n) => n.id === judge.id);
  const judgeX = CANVAS_LAYOUT_START_X + judgeIdx * CANVAS_NODE_GAP_X;
  const rowTop = CANVAS_LAYOUT_START_Y;
  const couponX = judgeX + CANVAS_NODE_GAP_X;
  const branchRowTop = rowTop + CANVAS_NODE_GAP_Y;
  return nodes.map((n, i) => {
    if (i <= judgeIdx && n.id !== end.id && n.id !== coupon?.id) {
      return {
        ...n,
        x: CANVAS_LAYOUT_START_X + i * CANVAS_NODE_GAP_X,
        y: rowAlignedY(n.type, rowTop),
      };
    }
    if (coupon && n.id === coupon.id) {
      return {
        ...n,
        x: couponX,
        y: rowAlignedY(n.type, rowTop),
      };
    }
    if (n.id === end.id) {
      return {
        ...n,
        x: coupon ? couponX : judgeX,
        y: rowAlignedY(n.type, branchRowTop),
      };
    }
    return n;
  });
}

function buildDefaultEdges(mapped: CanvasNode[]): CanvasEdge[] {
  const judge = mapped.find((n) => isJudgeNode(n));
  const end = mapped.find((n) => n.type === '结束');
  const coupon = mapped.find((n) => isCouponNode(n));

  if (judge && end) {
    const edges: CanvasEdge[] = [];
    const judgeIdx = mapped.findIndex((n) => n.id === judge.id);
    for (let i = 0; i < judgeIdx; i += 1) {
      const from = mapped[i];
      const to = mapped[i + 1];
      if (!from || !to || to.id === end.id) continue;
      edges.push({
        id: `e_${from.id}_${to.id}`,
        source: from.id,
        target: to.id,
        sourceSide: 'right',
        targetSide: 'left',
      });
    }
    if (coupon) {
      edges.push({
        id: `e_${judge.id}_${coupon.id}`,
        source: judge.id,
        target: coupon.id,
        label: '未购买',
        sourceSide: 'right',
        targetSide: 'left',
      });
      edges.push({
        id: `e_${coupon.id}_${end.id}`,
        source: coupon.id,
        target: end.id,
        sourceSide: 'bottom',
        targetSide: 'top',
      });
    }
    // 一锚点一线：已购买走判断底部 → 结束左侧（顶部留给发券）
    edges.push({
      id: `e_${judge.id}_${end.id}_bought`,
      source: judge.id,
      target: end.id,
      label: '已购买',
      sourceSide: 'bottom',
      targetSide: coupon ? 'left' : 'top',
    });
    return edges;
  }

  const nextEdges: CanvasEdge[] = [];
  for (let i = 0; i < mapped.length - 1; i += 1) {
    const from = mapped[i];
    const to = mapped[i + 1];
    nextEdges.push({
      id: `e_${from.id}_${to.id}`,
      source: from.id,
      target: to.id,
      sourceSide: 'right',
      targetSide: 'left',
    });
  }
  return nextEdges;
}

/** 短信通道类型 */
const SMS_CHANNEL_TYPES = [
  { value: 'normal', label: '普通短信' },
  { value: '5g', label: '5G短信' },
] as const;

/** 短信发送频次：每天时间段 / 定点一次 */
const SMS_FREQ_MODES = [
  { value: 'slot', label: '每天时间段' },
  { value: 'once', label: '每天定点一次' },
] as const;

/** 对齐小程序/中台：行为奖励并行「会员积分」与「成长值」两套账户 */
const POINTS_REWARD_TYPES = [
  {
    value: 'member_points',
    label: '会员积分',
    tip: '可用积分，可用于积分商城兑换等（小程序「可用积分」）。',
  },
  {
    value: 'growth',
    label: '成长值',
    tip: '成长值用于会员等级进阶，与会员积分分账（小程序「成长值中心」）。',
  },
] as const;

const PURCHASE_SCOPE_OPTIONS = [
  { value: 'any', label: '任意订单' },
  { value: 'category', label: '指定商品类目' },
] as const;

function selectedTagKeys(meta?: Record<string, string>): string[] {
  if (meta?.tagKeys) {
    return meta.tagKeys
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (meta?.tagKey) return [meta.tagKey];
  return [];
}

function formatWaitConfig(meta?: Record<string, string>) {
  const amount = Number(meta?.waitAmount ?? meta?.waitDays ?? '3');
  const unit = meta?.waitUnit || 'day';
  if (!Number.isFinite(amount) || amount <= 0) return '立即';
  return unit === 'hour' ? `等待 ${amount} 小时` : `等待 ${amount} 天`;
}

function formatJudgeConfig(meta?: Record<string, string>) {
  const scope = meta?.purchaseScope || 'any';
  if (scope === 'category') {
    const cats = (meta?.purchaseCategories || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const catText = cats.length
      ? cats.slice(0, 2).join('、') + (cats.length > 2 ? '等' : '')
      : '指定类目';
    return `是否购买（到达时判定·${catText}）`;
  }
  return '是否购买（到达时判定·任意订单）';
}

const VISIT_BEHAVIOR_ACTION_OPTIONS = [
  { label: '浏览', value: '浏览' },
  { label: '加购', value: '加购' },
  { label: '分享', value: '分享' },
  { label: '登录', value: '登录' },
  { label: '活动访问', value: '活动访问' },
  { label: '活动参与', value: '活动参与' },
  { label: '搜索', value: '搜索' },
  { label: '商品详情点击', value: '商品详情点击' },
];

const visitCascadeItemStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  marginBottom: 16,
  marginInlineEnd: 16,
  verticalAlign: 'top',
  width: '100%',
};

function parseVisitJsonPaths(raw?: string): string[][] | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v) || !v.length) return undefined;
    return v.map((x) => (Array.isArray(x) ? x.map(String) : [String(x)]));
  } catch {
    return undefined;
  }
}

function patchVisitActions(
  meta: Record<string, string> | undefined,
  actions: string[],
): Record<string, string> {
  const next: Record<string, string> = {
    ...(meta || {}),
    visitBehaviorActions: actions.join(','),
  };
  const keep = (flag: boolean, key: string) => {
    if (!flag) delete next[key];
  };
  keep(actions.includes('浏览'), 'visitBrowsePages');
  keep(actions.includes('浏览'), 'visitBrowseDuration');
  keep(actions.includes('加购'), 'visitCartProducts');
  keep(actions.includes('分享'), 'visitShareActivities');
  keep(actions.includes('登录'), 'visitLoginChannels');
  keep(actions.includes('活动访问'), 'visitVisitChannels');
  keep(actions.includes('活动参与'), 'visitJoinSpecials');
  keep(actions.includes('搜索'), 'visitSearchQuery');
  keep(actions.includes('商品详情点击'), 'visitDetailProducts');
  return next;
}

function formatVisitConfig(meta?: Record<string, string>) {
  const actions = (meta?.visitBehaviorActions || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!actions.length) return '是否访问（请配置用户行为）';
  const actText = actions.slice(0, 2).join('、') + (actions.length > 2 ? '等' : '');
  return `是否访问（${actText}）`;
}

function formatPointsConfig(meta?: Record<string, string>) {
  const type =
    POINTS_REWARD_TYPES.find((t) => t.value === (meta?.pointsRewardType || 'member_points'))
      ?.label || '会员积分';
  const n = meta?.points || '100';
  return `赠送 ${n} ${type === '成长值' ? '成长值' : '积分'}`;
}

function truncateText(text: string, max = 28) {
  const t = String(text || '').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function formatSmsFreqConfig(meta?: Record<string, string>) {
  const mode = meta?.smsFreqMode || 'slot';
  if (mode === 'once') {
    const at = meta?.smsFreqAt || '10:00';
    return `每天 ${at} 发送一次`;
  }
  const start = meta?.smsFreqStart || '09:00';
  const end = meta?.smsFreqEnd || '21:00';
  return `每天 ${start}–${end}`;
}

/** 节点卡片矩形内短文案（过长省略） */
function formatSmsConfig(meta?: Record<string, string>) {
  const content =
    meta?.smsContent ||
    SMS_LIBRARY_TEMPLATES[meta?.smsTemplateKey || 'A']?.content ||
    '';
  return truncateText(content, 36) || '请填写短信内容';
}

/** Tooltip / 详情用完整文案（短信为全文） */
function formatNodeCardFullDesc(node: CanvasNode): string {
  const raw = String(node.config || '').trim();
  if (node.name === '选人' || node.type === '人群') {
    return formatNodeCardDesc(node);
  }
  if (node.name === '发短信') {
    return (
      String(node.meta?.smsContent || '').trim() ||
      SMS_LIBRARY_TEMPLATES[node.meta?.smsTemplateKey || 'A']?.content ||
      raw ||
      '请填写短信内容'
    );
  }
  if (node.name === '是否访问') {
    return formatVisitConfig(node.meta);
  }
  return raw || formatNodeCardDesc(node);
}

function formatNodeCardDesc(node: CanvasNode): string {
  const raw = String(node.config || '').trim();
  if (node.name === '选人' || node.type === '人群') {
    const source = node.meta?.audienceSource || 'crowd';
    if (source === 'tag') {
      const tagRaw = String(node.meta?.tagName || raw || '')
        .replace(/^人群标签[：:·]\s*/, '')
        .replace(/（[^）]*）\s*$/, '')
        .trim();
      if (!tagRaw || tagRaw.startsWith('请选择')) return raw || '请选择人群标签';
      return `人群标签：${tagRaw}`;
    }
    let crowdRaw = String(node.meta?.crowdName || raw || '')
      .replace(/^目标人群\s*[：:·]\s*/, '')
      .replace(/（[^）]*）\s*$/, '')
      .trim();
    if (crowdRaw.includes('·')) {
      crowdRaw = crowdRaw.split('·').slice(1).join('·').trim() || crowdRaw;
    }
    if (!crowdRaw || crowdRaw.startsWith('请选择')) return raw || '请选择目标人群';
    return `目标人群：${crowdRaw}`;
  }
  if (node.name === '发短信') {
    return formatSmsConfig(node.meta);
  }
  if (node.name === '是否访问') {
    return formatVisitConfig(node.meta);
  }
  return raw;
}

/** 可选短信模板库（选中后展示正文） */
const SMS_LIBRARY_TEMPLATES: Record<string, { name: string; content: string }> = {
  A: {
    name: '模板A',
    content:
      '【文旅惠】中秋快乐！团圆月饼礼盒限时满减，精选中秋伴手礼打开小程序立即选购。拒收请回复 R',
  },
  B: {
    name: '模板B',
    content:
      '【文旅惠】中秋佳节至，会员专享月饼券已到账，到店/小程序核销享优惠。详情见活动页。拒收请回复 R',
  },
};

function formatCouponConfig(meta?: Record<string, string>) {
  const name = meta?.couponName || '优惠券';
  const center = meta?.couponCenter ? `·${meta.couponCenter}` : '';
  const n = meta?.couponCount || '1';
  return `发券${center}·${name} ×${n}`;
}

type ToolboxItem = {
  key: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  color: string;
  defaultConfig?: string;
};

const TOOLBOX: { key: string; label: string; items: ToolboxItem[] }[] = [
  {
    key: 'audience',
    label: '选人',
    items: [
      {
        key: 'pick',
        name: '选人',
        type: '人群',
        icon: <ApartmentOutlined />,
        color: '#52c41a',
        defaultConfig: '选择目标人群或人群标签',
      },
    ],
  },
  {
    key: 'comm',
    label: '触达方式',
    items: [
      {
        key: 'sms',
        name: '发短信',
        type: '触达',
        icon: <MessageOutlined />,
        color: '#f5222d',
        defaultConfig: '促销推广·普通营销',
      },
      {
        key: 'wecom',
        name: '企微发消息',
        type: '触达',
        icon: <MessageOutlined />,
        color: '#f5222d',
        defaultConfig: '企微·客户·文本',
      },
      {
        key: 'mp_coupon',
        name: '小程序发券',
        type: '触达',
        icon: <GiftOutlined />,
        color: '#f5222d',
        defaultConfig: '请选择优惠券',
      },
      {
        key: 'points',
        name: '加积分',
        type: '触达',
        icon: <StarOutlined />,
        color: '#f5222d',
        defaultConfig: '赠送积分',
      },
    ],
  },
  {
    key: 'flow',
    label: '流程操作',
    items: [
      {
        key: 'wait',
        name: '等待',
        type: '等待',
        icon: <HistoryOutlined />,
        color: '#faad14',
        defaultConfig: '等待 3 天',
      },
      {
        key: 'judge',
        name: '是否购买',
        type: '判断',
        icon: <PartitionOutlined />,
        color: '#722ed1',
        defaultConfig: '是否购买（到达时判定·任意订单）',
      },
      {
        key: 'visit',
        name: '是否访问',
        type: '判断',
        icon: <EyeOutlined />,
        color: '#2f54eb',
        defaultConfig: '是否访问（请配置用户行为）',
      },
      {
        key: 'random',
        name: '随机抽取',
        type: '处理',
        icon: <ThunderboltOutlined />,
        color: '#13c2c2',
        defaultConfig: '随机抽取 10000 人',
      },
      {
        key: 'dedupe',
        name: '排重',
        type: '处理',
        icon: <FilterOutlined />,
        color: '#fa8c16',
        defaultConfig: '按OneID去重',
      },
      { key: 'end', name: '结束', type: '结束', icon: <AimOutlined />, color: '#8c8c8c' },
    ],
  },
];

/** 一期：选人 + 触达 + 等待/判断 + 排重/随机抽取/结束 */
const TOOLBOX_PHASE1 = TOOLBOX;

function formatRandomSampleConfig(meta?: Record<string, string>) {
  const mode = meta?.sampleMode || 'count';
  if (mode === 'ratio') {
    const r = meta?.sampleRatio || '20';
    return `随机抽取 ${r}%`;
  }
  const n = meta?.sampleSize || '10000';
  return `随机抽取 ${n} 人`;
}

function formatDedupeConfig(meta?: Record<string, string>, activityNameMap?: Record<string, string>) {
  const parts: string[] = [];
  if (meta?.oneIdDedupe !== 'false') {
    parts.push('按OneID去重');
  }
  const excludeOn = meta?.excludeEnabled === 'true';
  if (!excludeOn) {
    return parts.join('；') || '待配置排重';
  }
  const scope = meta?.excludeScope || 'activity';
  const channel =
    meta?.channelScope === 'sms'
      ? '仅短信'
      : meta?.channelScope === 'wecom'
        ? '仅企微'
        : meta?.channelScope === 'mp_coupon'
          ? '仅发券'
          : meta?.channelScope === 'points'
            ? '仅加积分'
            : '全渠道';
  if (scope === 'self_reached') {
    parts.push(`排除本活动已触达（${channel}）`);
  } else if (scope === 'days') {
    const d = meta?.excludeDays || '7';
    parts.push(`排除近 ${d} 天已触达（${channel}）`);
  } else {
    const ids = (meta?.excludeActivityIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      parts.push(`排除已结束活动已触达（${channel}）`);
    } else {
      const names = ids.map((id) => activityNameMap?.[id] || id).slice(0, 2);
      const more = ids.length > 2 ? ` 等${ids.length}个` : '';
      parts.push(`排除「${names.join('、')}」${more}（${channel}）`);
    }
  }
  return parts.join('；') || '待配置排重';
}

const DEDUPE_SCOPE_TIP = (
  <div style={{ maxWidth: 320 }}>
    <div style={{ marginBottom: 8 }}>
      排重含两部分，可只开其一或同时开：人员去重（OneID）为勾选；排除已触达为可选项，不开启即不做触达排除。
    </div>
    <div style={{ marginBottom: 6 }}>
      <b>按 OneID 去重</b>
      ：选人结果里同一人多条时，按唯一标识合并为一人。
    </div>
    <div style={{ marginBottom: 6 }}>
      <b>排除指定已结束活动已触达</b>
      ：勾选已结束活动，去掉其中已被触达的人（第二波抽样常用）。
    </div>
    <div style={{ marginBottom: 6 }}>
      <b>排除本活动内已触达</b>
      ：同一旅程里前面已触达过的人，后面不再发。
    </div>
    <div>
      <b>排除近 N 天已触达</b>
      ：近 N 天内（可限定渠道）触达过的人排除（频控）。
    </div>
  </div>
);

const DEDUPE_ACTIVITY_TIP = (
  <div style={{ maxWidth: 320 }}>
    <div style={{ marginBottom: 8 }}>仅可选择状态为「已结束」的活动。</div>
    <div>
      <b>案例</b>
      ：活动 A「全量会员关怀」已结束且触达 1
      万人。新建活动 B 时，排除活动勾选 A，再随机抽取 2
      万——即从剩余未触达人中再抽，避免与 A 重复打扰。
    </div>
  </div>
);

const JUDGE_TIP = (
  <div style={{ maxWidth: 320 }}>
    <div style={{ marginBottom: 8 }}>
      <b>判定时点</b>：到达本节点时立即判定，不另设观察窗口（避免与上游「等待」重复计时）。
    </div>
    <div>
      推荐链路：触达 → 等待 N → 是否购买。等待期间产生的购买算「已购买」。
    </div>
  </div>
);

const VISIT_TIP = (
  <div style={{ maxWidth: 340 }}>
    <div style={{ marginBottom: 8 }}>
      <b>判定依据</b>
      ：对齐人群标签「打标维度 · 用户行为」——选择行为动作后联动附属条件（浏览页面/加购商品等）。
    </div>
    <div>本节点不分支：判定完成后直连下游节点（无「已访问 / 未访问」出边）。</div>
  </div>
);

const WAIT_TIP = (
  <div style={{ maxWidth: 300 }}>
    填 0 表示立即继续。等待期间用户可能已下单；下游「是否购买」在到达时判定，等待期内订单计入「已购买」。
  </div>
);

const RANDOM_TIP = (
  <div style={{ maxWidth: 300 }}>
    建议链路：选人 → 排重 → 随机抽取 → 触达。抽取人数不超过上游剩余可触达人数（演示态不接真中台）。
  </div>
);

const WECOM_TIP = (
  <div style={{ maxWidth: 340 }}>
    <div style={{ marginBottom: 8 }}>
      <b>如何连通企微发消息</b>
      ：正式环境需在「平台/系统」完成企业微信应用授权（客户联系权限），绑定企业
      CorpID；执行本节点时由中台调用企微「客户联系 · 群发/单发」接口，而非小程序内直发。
    </div>
    <div style={{ marginBottom: 8 }}>
      本节点配置：发送对象、消息类型与内容。Demo 不接真实企微，保存配置即可走审批与报告示意。
    </div>
    <div>
      消息类型对齐企微能力：文本、图文链接、小程序卡片（需填写卡片标题与路径）。
    </div>
  </div>
);

function LabelTip(props: { label: string; tip: React.ReactNode }) {
  return (
    <Space size={4}>
      <span>{props.label}</span>
      <Tooltip title={props.tip} placement="topLeft">
        <QuestionCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'help' }} />
      </Tooltip>
    </Space>
  );
}

function formatWecomConfig(meta?: Record<string, string>) {
  const target = meta?.wecomTarget === 'group' ? '客户群' : '客户';
  const msgType =
    meta?.wecomMsgType === 'link'
      ? '图文链接'
      : meta?.wecomMsgType === 'miniprogram'
        ? '小程序卡片'
        : '文本';
  const content = (meta?.wecomContent || meta?.wecomMpTitle || '').trim();
  if (!content) return `企微·${target}·${msgType}`;
  return `企微·${target}·${content.slice(0, 12)}${content.length > 12 ? '…' : ''}`;
}

const WEEKDAY_OPTIONS = [
  { value: '周一', label: '周一' },
  { value: '周二', label: '周二' },
  { value: '周三', label: '周三' },
  { value: '周四', label: '周四' },
  { value: '周五', label: '周五' },
  { value: '周六', label: '周六' },
  { value: '周日', label: '周日' },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const NTH_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
];

function startNodeCode(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(200000000 + (n % 90000000));
}

function formatStartConfig(meta?: Record<string, string>) {
  const mode = meta?.execMode || 'immediate';
  if (mode === 'immediate') return '即时执行';
  if (mode === 'schedule') {
    return meta?.scheduleAt ? `定时执行 · ${meta.scheduleAt}` : '定时执行';
  }
  const period = meta?.periodType || 'day';
  if (period === 'day') {
    return `周期性 · 每${meta?.dayEvery || '1'}天`;
  }
  if (period === 'week') {
    return `周期性 · 每${meta?.weekEvery || '1'}周的${meta?.weekDay || '周一'}`;
  }
  const monthMode = meta?.monthMode || 'day';
  if (monthMode === 'day') return `周期性 · 每月第${meta?.monthDay || '1'}天`;
  if (monthMode === 'lastDay') return `周期性 · 每月倒数第${meta?.monthLastDay || '1'}天`;
  if (monthMode === 'nthWeekday') {
    return `周期性 · 每月第${meta?.monthNth || '1'}个${meta?.monthWeekday || '周一'}`;
  }
  return `周期性 · 每月倒数第${meta?.monthLastNth || '1'}个${meta?.monthLastWeekday || '周一'}`;
}

const iconByType: Record<string, React.ReactNode> = {
  开始: <CaretRightOutlined />,
  人群: <ApartmentOutlined />,
  查询: <SearchOutlined />,
  触达: <MessageOutlined />,
  等待: <HistoryOutlined />,
  处理: <ApartmentOutlined />,
  判断: <PartitionOutlined />,
  结束: <AimOutlined />,
  优惠: <GiftOutlined />,
  数据: <TagsOutlined />,
  响应: <PartitionOutlined />,
  行为: <ThunderboltOutlined />,
};

const colorByType: Record<string, string> = {
  开始: '#faad14',
  人群: '#52c41a',
  查询: '#52c41a',
  触达: '#f5222d',
  等待: '#faad14',
  处理: '#fa8c16',
  判断: '#722ed1',
  结束: '#8c8c8c',
  优惠: '#f5222d',
  数据: '#13c2c2',
  响应: '#722ed1',
  行为: '#fa8c16',
};

function resolvedSourceSide(edge: CanvasEdge): PortSide {
  return edge.sourceSide || 'right';
}

function resolvedTargetSide(edge: CanvasEdge): PortSide {
  return edge.targetSide || 'left';
}

/** 某节点某一面是否已有连线（入/出均算占用） */
function isPortOccupied(
  edges: CanvasEdge[],
  nodeId: string,
  side: PortSide,
  excludeEdgeId?: string,
) {
  return edges.some((e) => {
    if (excludeEdgeId && e.id === excludeEdgeId) return false;
    if (e.source === nodeId && resolvedSourceSide(e) === side) return true;
    if (e.target === nodeId && resolvedTargetSide(e) === side) return true;
    return false;
  });
}

/** 在偏好基础上挑选两侧均空闲的锚点；无空闲则返回 null */
function pickFreePortSides(
  from: CanvasNode,
  to: CanvasNode,
  edges: CanvasEdge[],
  preferred?: { sourceSide?: PortSide; targetSide?: PortSide },
): { sourceSide: PortSide; targetSide: PortSide } | null {
  const auto = autoPortSides(from, to);
  const sourcePref = preferred?.sourceSide || auto.sourceSide;
  const targetPref = preferred?.targetSide || auto.targetSide;
  const sourceOrder = [sourcePref, ...PORT_SIDES.filter((s) => s !== sourcePref)];
  const targetOrder = [targetPref, ...PORT_SIDES.filter((s) => s !== targetPref)];
  for (const sourceSide of sourceOrder) {
    if (isPortOccupied(edges, from.id, sourceSide)) continue;
    for (const targetSide of targetOrder) {
      if (isPortOccupied(edges, to.id, targetSide)) continue;
      return { sourceSide, targetSide };
    }
  }
  return null;
}

const ActivityDesign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const CURRENT_USER = String(initialState?.currentUser?.username || 'demo');
  const canExecute = !!access.canActivityExecute;
  const isTemplate = pathname.includes('/crowd-marketing/template/');
  const [data, setData] = useState<any>();
  const dataRef = useRef(data);
  dataRef.current = data;
  const flowChangeRef = useRef<() => Promise<void>>(async () => {});
  const [loading, setLoading] = useState(false);
  const [toolboxKeyword, setToolboxKeyword] = useState('');
  const [nodeKeyword, setNodeKeyword] = useState('');
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 48, y: 48 });
  const [panning, setPanning] = useState(false);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');
  const [configNode, setConfigNode] = useState<CanvasNode | null>(null);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [saveTplName, setSaveTplName] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [crowdOptions, setCrowdOptions] = useState<
    { id: string; name: string; count: number; catalog: string }[]
  >([]);
  const [tagOptions, setTagOptions] = useState<
    { group: string; tag: string; count: number; key: string }[]
  >([]);
  const [tagFilter, setTagFilter] = useState<'all' | 'recent' | 'fav'>('all');
  const [audienceKeyword, setAudienceKeyword] = useState('');
  const [activityOptions, setActivityOptions] = useState<
    { id: string; name: string; status: string }[]
  >([]);
  const [couponOptions, setCouponOptions] = useState<
    { id: string; name: string; tip: string; center: string; type: string }[]
  >([]);
  const [linkPreview, setLinkPreview] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [testResultMode, setTestResultMode] = useState<'modal' | 'drawer'>('modal');
  const nodeDrag = useRef<{
    id: string;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);
  const panDrag = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const linkDrag = useRef<{ sourceId: string; sourceSide: PortSide } | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const canvasReadOnlyRef = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    setLoading(true);
    const url = isTemplate
      ? `/api/crowd-marketing/templates/local/${id}`
      : `/api/crowd-marketing/activities/${id}`;
    request(url)
      .then((res) => {
        setData(res.data);
        const apiNodes: any[] = res.data?.nodes || [];
        if (apiNodes.length) {
          const hasCoords = apiNodes.some((n) => typeof n.x === 'number' && typeof n.y === 'number');
          const mapped = hasCoords
            ? apiNodes.map((n, i) => ({
                id: n.id || `n${i}`,
                name: normalizeCanvasNodeName(n.name),
                type: n.type || '触达',
                config: n.config,
                meta: n.meta,
                x: Number(n.x),
                y: Number(n.y),
              }))
            : applyJudgeBranchLayout(layoutFlowNodes(apiNodes));
          setNodes(mapped);
          const apiEdges: CanvasEdge[] = Array.isArray(res.data?.edges) ? res.data.edges : [];
          setEdges(apiEdges.length ? apiEdges : buildDefaultEdges(mapped));
          setSelectedId(mapped[0]?.id || '');
        } else {
          const start = { id: 'start', name: '开始', type: '开始', x: 120, y: 160 };
          setNodes([start]);
          setEdges([]);
          setSelectedId(start.id);
        }
        setSelectedEdgeId('');
      })
      .finally(() => setLoading(false));
  }, [id, isTemplate]);

  useEffect(() => {
    request('/api/customer-asset/crowds', { params: { current: 1, pageSize: 200 } }).then(
      (res) => {
        setCrowdOptions(
          (res?.data || []).map(
            (c: { id: string; name: string; count: number; catalog?: string }) => ({
              id: c.id,
              name: c.name,
              count: c.count,
              catalog: c.catalog || '未分类',
            }),
          ),
        );
      },
    );
    request('/api/tag-center/person-tags').then((res) => {
      setTagOptions(
        (res?.data || []).map((t: { group: string; tag: string; count: number }) => ({
          group: t.group,
          tag: t.tag,
          count: t.count || 0,
          key: tagIdentity(t.group, t.tag),
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (configNode?.type === '人群') {
      setAudienceKeyword('');
      setTagFilter('all');
    }
    if (configNode?.name === '排重') {
      request('/api/crowd-marketing/activities', { params: { current: 1, pageSize: 200 } }).then(
        (res) => {
          setActivityOptions(
            (res?.data || [])
              .map((a: { id: string; name: string; status?: string }) => ({
                id: a.id,
                name: a.name,
                status: a.status || '',
              }))
              .filter(
                (a: { id: string; status: string }) => a.id !== id && a.status === '已结束',
              ),
          );
        },
      );
    }
    if (configNode?.name === '小程序发券' || configNode?.name === '发优惠券') {
      const center =
        configNode.meta?.couponCenter ||
        String((dataRef.current?.centers || [])[0] || MARKETING_CENTERS[0]);
      request('/api/crowd-marketing/coupons', { params: { center } }).then((res) => {
        setCouponOptions(res?.data || []);
      });
    }
  }, [configNode?.id, configNode?.type, configNode?.name, id, configNode?.meta?.couponCenter]);

  const activityNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    activityOptions.forEach((a) => {
      m[a.id] = a.name;
    });
    return m;
  }, [activityOptions]);

  const filteredTagOptions = useMemo(() => {
    const k = audienceKeyword.trim();
    let list = tagOptions;
    if (tagFilter !== 'all') {
      const keys =
        tagFilter === 'fav'
          ? new Set(getFavoriteTagKeys(CURRENT_USER))
          : new Set(getRecentTagKeys(CURRENT_USER));
      list = list.filter((t) => keys.has(t.key));
    }
    if (k) {
      list = list.filter((t) => t.group.includes(k) || t.tag.includes(k));
    }
    return list;
  }, [tagOptions, tagFilter, CURRENT_USER, audienceKeyword]);

  const tagGroupsForPick = useMemo(() => {
    const map = new Map<string, typeof filteredTagOptions>();
    filteredTagOptions.forEach((t) => {
      const arr = map.get(t.group) || [];
      arr.push(t);
      map.set(t.group, arr);
    });
    return Array.from(map.entries()).map(([group, tags]) => ({ group, tags }));
  }, [filteredTagOptions]);

  const filteredCrowdOptions = useMemo(() => {
    const k = audienceKeyword.trim();
    if (!k) return crowdOptions;
    return crowdOptions.filter(
      (c) => c.name.includes(k) || c.catalog.includes(k) || c.id.includes(k),
    );
  }, [crowdOptions, audienceKeyword]);

  const crowdGroupsForPick = useMemo(() => {
    const map = new Map<string, typeof filteredCrowdOptions>();
    filteredCrowdOptions.forEach((c) => {
      const cat = c.catalog || '未分类';
      const arr = map.get(cat) || [];
      arr.push(c);
      map.set(cat, arr);
    });
    return Array.from(map.entries()).map(([catalog, items]) => ({ catalog, items }));
  }, [filteredCrowdOptions]);

  const filteredToolbox = useMemo(() => {
    const k = toolboxKeyword.trim();
    return TOOLBOX_PHASE1.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !k || item.name.includes(k) || item.type.includes(k),
      ),
    })).filter((g) => g.items.length);
  }, [toolboxKeyword]);

  const visibleNodes = useMemo(() => {
    const k = nodeKeyword.trim();
    if (!k) return nodes;
    return nodes.filter((n) => n.name.includes(k) || n.type.includes(k));
  }, [nodes, nodeKeyword]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, CanvasNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const addEdge = (
    source: string,
    target: string,
    sides?: { sourceSide?: PortSide; targetSide?: PortSide },
  ) => {
    if (canvasReadOnlyRef.current) {
      message.warning(`当前状态「${dataRef.current?.status}」画布只读，不可连线`);
      return false;
    }
    if (!source || !target || source === target) return false;
    if (edgesRef.current.some((e) => e.source === source && e.target === target)) {
      message.warning('连线已存在');
      return false;
    }
    const sourceNode = nodesRef.current.find((n) => n.id === source);
    const targetNode = nodesRef.current.find((n) => n.id === target);
    if (!sourceNode || !targetNode) return false;

    let label: string | undefined;
    if (isJudgeNode(sourceNode)) {
      const outs = edgesRef.current.filter((e) => e.source === source);
      if (outs.length >= 2) {
        message.warning('「是否购买」最多两条出边：已购买 / 未购买');
        return false;
      }
      const used = new Set(outs.map((e) => e.label).filter(Boolean));
      label = JUDGE_BRANCH_LABELS.find((l) => !used.has(l)) || JUDGE_BRANCH_LABELS[outs.length];
    }

    // 指定锚点：该面必须空闲；未指定则自动挑空闲面
    let sourceSide: PortSide | undefined = sides?.sourceSide;
    let targetSide: PortSide | undefined = sides?.targetSide;
    if (sourceSide && isPortOccupied(edgesRef.current, source, sourceSide)) {
      message.warning('该锚点已有连线，请换一个面');
      return false;
    }
    if (targetSide && isPortOccupied(edgesRef.current, target, targetSide)) {
      // 落点面已被占用时，尝试同节点其它空闲面
      const fallback = pickFreePortSides(sourceNode, targetNode, edgesRef.current, {
        sourceSide,
        targetSide,
      });
      if (!fallback || (sourceSide && fallback.sourceSide !== sourceSide)) {
        message.warning('目标锚点已有连线，请换一个面');
        return false;
      }
      targetSide = fallback.targetSide;
    }
    if (!sourceSide || !targetSide) {
      const picked = pickFreePortSides(sourceNode, targetNode, edgesRef.current, {
        sourceSide,
        targetSide,
      });
      if (!picked) {
        message.warning('节点锚点已满，无法再连线');
        return false;
      }
      sourceSide = picked.sourceSide;
      targetSide = picked.targetSide;
    }

    const edge: CanvasEdge = {
      id: `e_${source}_${target}_${Date.now()}`,
      source,
      target,
      sourceSide,
      targetSide,
      ...(label ? { label } : {}),
    };
    edgesRef.current = [...edgesRef.current, edge];
    setEdges(edgesRef.current);
    return true;
  };

  const addNode = (item: ToolboxItem, at?: { x: number; y: number }) => {
    if (!guardEditable('添加节点')) return;
    const nid = `n_${Date.now()}`;
    const scale = zoom / 100;
    const rect = canvasRef.current?.getBoundingClientRect();
    const viewW = rect?.width || 800;
    const viewH = rect?.height || 500;
    const next: CanvasNode = {
      id: nid,
      name: item.name,
      type: item.type,
      x:
        at?.x ??
        (viewW / 2 - pan.x) / scale - 64 + (Math.random() - 0.5) * 80,
      y:
        at?.y ??
        (viewH / 2 - pan.y) / scale - 46 + (Math.random() - 0.5) * 60,
      config: item.defaultConfig || '待配置',
      ...(item.key === 'sms'
        ? {
            meta: {
              smsChannel: 'normal',
              smsFreqMode: 'slot',
              smsFreqStart: '09:00',
              smsFreqEnd: '21:00',
              smsFreqAt: '10:00',
              smsTemplateKey: 'A',
              smsContent: SMS_LIBRARY_TEMPLATES.A.content,
              smsPublishAt: '',
            },
            config: formatSmsConfig({
              smsTemplateKey: 'A',
              smsContent: SMS_LIBRARY_TEMPLATES.A.content,
            }),
          }
        : item.key === 'wecom'
          ? {
              meta: {
                wecomTarget: 'customer',
                wecomMsgType: 'text',
                wecomContent: '您好，为您送上专属活动提醒，详情见小程序。',
              },
              config: '企微·客户·文本',
            }
          : item.key === 'mp_coupon'
            ? {
                meta: {
                  couponCenter: String(
                    (dataRef.current?.centers || [])[0] || MARKETING_CENTERS[0],
                  ),
                  couponId: '',
                  couponName: '',
                  couponCount: '1',
                },
                config: '请选择优惠券',
              }
        : item.key === 'points'
          ? {
              meta: { points: '100', pointsRewardType: 'member_points' },
              config: '赠送 100 积分',
            }
          : item.key === 'wait'
            ? {
                meta: { waitAmount: '3', waitUnit: 'day', waitDays: '3' },
                config: '等待 3 天',
              }
            : item.key === 'judge'
              ? {
                  meta: {
                    purchaseScope: 'any',
                  },
                  config: '是否购买（到达时判定·任意订单）',
                }
              : item.key === 'visit'
                ? {
                    meta: {
                      visitBehaviorActions: '浏览',
                    },
                    config: formatVisitConfig({
                      visitBehaviorActions: '浏览',
                    }),
                  }
            : item.key === 'random'
            ? {
                meta: { sampleMode: 'count', sampleSize: '10000' },
                config: '随机抽取 10000 人',
              }
              : item.key === 'dedupe'
              ? {
                  meta: {
                    oneIdDedupe: 'true',
                    excludeEnabled: 'false',
                    excludeScope: 'activity',
                    channelScope: 'all',
                  },
                  config: '按OneID去重',
                }
              : item.key === 'end'
                ? { config: '旅程结束' }
                : {}),
    };
    setNodes((prev) => [...prev, next]);
    if (selectedId && selectedId !== nid) {
      addEdge(selectedId, nid);
    }
    setSelectedId(nid);
    setSelectedEdgeId('');
    message.success(`已添加节点「${item.name}」${selectedId ? '并连到当前选中节点' : ''}（演示）`);
    void flowChangeRef.current();
  };

  const deleteNode = (nodeId?: string) => {
    if (!guardEditable('删除节点')) return;
    const targetId = nodeId || selectedId;
    if (!targetId) {
      message.warning('请先选中要删除的节点');
      return;
    }
    const target = nodes.find((n) => n.id === targetId);
    if (!target) return;
    if (target.type === '开始') {
      message.warning('开始节点不可删除');
      return;
    }
    setNodes((prev) => prev.filter((n) => n.id !== targetId));
    setEdges((prev) => prev.filter((e) => e.source !== targetId && e.target !== targetId));
    if (selectedId === targetId) setSelectedId('');
    message.success(`已删除节点「${target.name}」`);
    void flowChangeRef.current();
  };

  const deleteEdge = (edgeId?: string) => {
    if (!guardEditable('删除连线')) return;
    const targetId = edgeId || selectedEdgeId;
    if (!targetId) return;
    setEdges((prev) => prev.filter((e) => e.id !== targetId));
    if (selectedEdgeId === targetId) setSelectedEdgeId('');
    message.success('已删除连线');
    void flowChangeRef.current();
  };

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const scale = zoomRef.current / 100;
    const p = panRef.current;
    return {
      x: (clientX - (rect?.left || 0) - p.x) / scale,
      y: (clientY - (rect?.top || 0) - p.y) / scale,
    };
  };

  const findNodeAt = (worldX: number, worldY: number, excludeId?: string) => {
    const pad = 10; // 含四边锚点外沿，松手更易命中
    for (let i = nodesRef.current.length - 1; i >= 0; i -= 1) {
      const n = nodesRef.current[i];
      if (excludeId && n.id === excludeId) continue;
      const { w, h } = nodeSize(n);
      if (
        worldX >= n.x - pad &&
        worldX <= n.x + w + pad &&
        worldY >= n.y - pad &&
        worldY <= n.y + h + pad
      ) {
        return n;
      }
    }
    return null;
  };

  const onNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    if ((e.target as HTMLElement).closest('.canvas-port')) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(node.id);
    setSelectedEdgeId('');
    nodeDrag.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
  };

  const onPortMouseDown = (e: React.MouseEvent, node: CanvasNode, side: PortSide) => {
    e.stopPropagation();
    e.preventDefault();
    if (canvasReadOnly) {
      message.warning(`当前状态「${data?.status}」画布只读，不可连线`);
      return;
    }
    if (isPortOccupied(edgesRef.current, node.id, side)) {
      message.warning('该锚点已有连线，请换一个面或先删除原连线');
      return;
    }
    setSelectedId(node.id);
    setSelectedEdgeId('');
    const from = portPoint(node, side);
    linkDrag.current = { sourceId: node.id, sourceSide: side };
    setLinkPreview({ x1: from.x, y1: from.y, x2: from.x, y2: from.y });
  };

  const onStageMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as HTMLElement).closest('.canvas-node, .canvas-edge-hit')) return;
    setSelectedId('');
    setSelectedEdgeId('');
    setPanning(true);
    panDrag.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (linkDrag.current) {
        const world = clientToWorld(e.clientX, e.clientY);
        const source = nodesRef.current.find((n) => n.id === linkDrag.current?.sourceId);
        if (!source) return;
        const from = portPoint(source, linkDrag.current.sourceSide);
        setLinkPreview({ x1: from.x, y1: from.y, x2: world.x, y2: world.y });
        return;
      }
      if (nodeDrag.current) {
        const scale = zoomRef.current / 100;
        const dx = (e.clientX - nodeDrag.current.startX) / scale;
        const dy = (e.clientY - nodeDrag.current.startY) / scale;
        const { id, nodeX, nodeY } = nodeDrag.current;
        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, x: nodeX + dx, y: nodeY + dy } : n)),
        );
        return;
      }
      if (panDrag.current) {
        setPan({
          x: panDrag.current.origX + (e.clientX - panDrag.current.startX),
          y: panDrag.current.origY + (e.clientY - panDrag.current.startY),
        });
      }
    };
    const onUp = (e: MouseEvent) => {
      if (linkDrag.current) {
        const world = clientToWorld(e.clientX, e.clientY);
        const drag = linkDrag.current;
        const target = findNodeAt(world.x, world.y, drag.sourceId);
        if (target) {
          const before = edgesRef.current.length;
          const targetSide = nearestPortSide(target, world.x, world.y);
          if (addEdge(drag.sourceId, target.id, { sourceSide: drag.sourceSide, targetSide })) {
            const created = edgesRef.current[edgesRef.current.length - 1];
            const branch = created?.label ? `（${created.label}）` : '';
            if (edgesRef.current.length > before || created) {
              message.success(`已连接 →「${target.name}」${branch}`);
            }
            void flowChangeRef.current();
          }
        }
        linkDrag.current = null;
        setLinkPreview(null);
      }
      nodeDrag.current = null;
      panDrag.current = null;
      setPanning(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const next = Math.min(150, Math.max(50, zoomRef.current - Math.sign(e.deltaY) * 10));
        setZoom(next);
        return;
      }
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedEdgeId) {
          deleteEdge(selectedEdgeId);
        } else if (selectedId) {
          deleteNode(selectedId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, selectedEdgeId, nodes]);

  const edgeBounds = useMemo(() => {
    if (!nodes.length) {
      return { left: -2000, top: -2000, width: 4000, height: 4000 };
    }
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const pad = 400;
    const left = Math.min(...xs) - pad;
    const top = Math.min(...ys) - pad;
    const right = Math.max(...xs) + pad + 140;
    const bottom = Math.max(...ys) + pad + 100;
    return { left, top, width: right - left, height: bottom - top };
  }, [nodes]);

  const gridSize = 20 * (zoom / 100);
  const tip = (text: string) => () => message.info(`${text}（演示）`);

  const canvasReadOnly =
    !isTemplate && ['待审批', '进行中', '已暂停', '已结束'].includes(String(data?.status || ''));
  canvasReadOnlyRef.current = canvasReadOnly;
  const canRenameName =
    isTemplate || ['草稿', '已驳回'].includes(String(data?.status || ''));

  const guardEditable = (action?: string) => {
    if (!canvasReadOnlyRef.current) return true;
    message.warning(
      action
        ? `当前状态「${dataRef.current?.status}」为只读，无法${action}`
        : `当前状态「${dataRef.current?.status}」画布只读，不可修改流程`,
    );
    return false;
  };

  const openActivityInfo = () => {
    setEditName(data?.name || '');
    setInfoOpen(true);
  };

  const saveActivityInfo = async () => {
    const name = editName.trim();
    if (!name) {
      message.warning('请填写活动名称');
      return;
    }
    if (!canRenameName) {
      message.warning(`当前状态「${data?.status}」不可修改活动名称`);
      return;
    }
    if (isTemplate || !id) {
      setData((prev: any) => ({ ...prev, name }));
      message.success('已更新名称（演示）');
      setInfoOpen(false);
      return;
    }
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}`,
      { method: 'PUT', data: { name } },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '保存失败');
      return;
    }
    setData(res.data || { ...data, name });
    message.success('已更新活动名称');
    setInfoOpen(false);
  };

  const invalidateIfNeeded = async () => {
    if (isTemplate || !id) return;
    const status = dataRef.current?.status;
    /** 正式执行后只读；仅「已通过」改流程作废审批 */
    if (status !== '已通过') return;
    const res = await request<{ success: boolean; changed?: boolean; data?: any }>(
      `/api/crowd-marketing/activities/${id}/invalidate-approve`,
      { method: 'POST' },
    );
    if (res?.changed) {
      setData(res.data);
      message.warning('流程已变更，需重新提交审批');
    }
  };
  flowChangeRef.current = invalidateIfNeeded;

  const handleSubmitApprove = async () => {
    if (!id) return;
    if (!['草稿', '已驳回'].includes(data?.status)) {
      message.warning(`当前状态「${data?.status || '-'}」不可提交审批`);
      return;
    }
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}/submit-approve`,
      { method: 'POST' },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '提交失败');
      return;
    }
    setData(res.data);
    message.success('已提交审批');
  };

  const handleFormalRun = async () => {
    if (!id) return;
    if (!canExecute) {
      message.warning('当前账号无正式执行权限');
      return;
    }
    const resume = data?.status === '已暂停';
    if (!['已通过', '已暂停'].includes(data?.status)) {
      message.warning('须审批通过后才能正式执行');
      return;
    }
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}/formal-run`,
      { method: 'POST', data: { currentUser: CURRENT_USER } },
    );
    if (res?.success === false) {
      message.warning(res.errorMessage || '须审批通过后才能正式执行');
      return;
    }
    setData(res.data);
    message.success(resume ? '已恢复执行' : '已开始正式执行');
  };

  const handlePause = async () => {
    if (!id) return;
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}/pause`,
      { method: 'POST', data: { currentUser: CURRENT_USER } },
    );
    if (res?.success === false) {
      message.warning(res.errorMessage || '无法暂停');
      return;
    }
    setData(res.data);
    message.success('已暂停');
  };

  const handleTestRun = () => {
    if (isTemplate) {
      message.warning('模板画布仅支持编排，请在活动中测试执行');
      return;
    }
    const result = runCanvasTest(nodes, edges, crowdOptions, tagOptions);
    const mode = pickTestResultPresentation(result);
    setTestResult(result);
    setTestResultMode(mode);
    if (result.ok) {
      message.success('测试执行完成（预检干跑，未正式触达）');
    } else {
      message.warning('测试执行未通过校验');
    }
  };

  const closeTestResult = () => setTestResult(null);

  const renderTestResultBody = (result: TestRunResult) => (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Alert
        type={result.ok ? (result.warnings.length ? 'warning' : 'success') : 'error'}
        showIcon
        message={result.summary}
      />
      {result.errors.length ? (
        <div>
          <Typography.Text strong>错误（须修复）</Typography.Text>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {result.errors.map((e, i) => (
              <li key={`err-${i}`}>
                <Typography.Text type="danger">{e.text}</Typography.Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.warnings.length ? (
        <div>
          <Typography.Text strong>提醒</Typography.Text>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {result.warnings.map((w, i) => (
              <li key={`warn-${i}`}>
                <Typography.Text type="warning">{w.text}</Typography.Text>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.steps.length ? (
        <div>
          <Typography.Text strong>节点人数预估（演示）</Typography.Text>
          <Table
            size="small"
            style={{ marginTop: 8 }}
            pagination={false}
            rowKey="nodeId"
            dataSource={result.steps}
            columns={[
              { title: '节点', dataIndex: 'name', width: 110 },
              {
                title: '预估人数',
                dataIndex: 'count',
                width: 96,
                render: (v: number) => v.toLocaleString(),
              },
              {
                title: '说明',
                dataIndex: 'note',
                render: (text?: string) => (
                  <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {text || '—'}
                  </span>
                ),
              },
            ]}
          />
        </div>
      ) : null}
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        测试执行不改变活动状态、不写入正式报告；正式触达请审批通过后使用「正式执行」。
      </Typography.Paragraph>
    </Space>
  );

  const statusTagColor = (status?: string) => {
    if (status === '已通过' || status === '进行中') return 'success';
    if (status === '待审批') return 'warning';
    if (status === '已驳回') return 'error';
    if (status === '已暂停') return 'default';
    return 'processing';
  };

  const renderEdgePath = (
    from: CanvasNode,
    to: CanvasNode,
    edge: CanvasEdge,
    selected: boolean,
  ) => {
    const sides = edge.sourceSide && edge.targetSide
      ? { sourceSide: edge.sourceSide, targetSide: edge.targetSide }
      : autoPortSides(from, to);
    const a = portPoint(from, sides.sourceSide);
    const b = portPoint(to, sides.targetSide);
    const x1 = a.x - edgeBounds.left;
    const y1 = a.y - edgeBounds.top;
    const x2 = b.x - edgeBounds.left;
    const y2 = b.y - edgeBounds.top;
    const pts = buildEdgePoints(x1, y1, sides.sourceSide, x2, y2, sides.targetSide);
    const d = pointsToPath(pts);
    const labelAt = pointAlongPath(pts, 0.38);
    const deleteAt = pointAlongPath(pts, 0.55);
    return (
      <g key={edge.id} className={`canvas-edge-group${selected ? ' is-selected' : ''}`}>
        <path
          className="canvas-edge-hit"
          d={d}
          stroke="transparent"
          strokeWidth="14"
          fill="none"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setSelectedEdgeId(edge.id);
            setSelectedId('');
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            deleteEdge(edge.id);
          }}
        />
        <path
          d={d}
          stroke={selected ? '#1677ff' : '#91caff'}
          strokeWidth={selected ? 2.5 : 2}
          fill="none"
          markerEnd={selected ? 'url(#arrow-active)' : 'url(#arrow)'}
          style={{ pointerEvents: 'none' }}
        />
        {edge.label ? (
          <g transform={`translate(${labelAt.x}, ${labelAt.y})`} style={{ pointerEvents: 'none' }}>
            <rect
              className="canvas-edge-label-bg"
              x={-28}
              y={-10}
              width={56}
              height={20}
              rx={4}
            />
            <text className="canvas-edge-label" textAnchor="middle" dominantBaseline="middle" y={1}>
              {edge.label}
            </text>
          </g>
        ) : null}
        {!canvasReadOnly ? (
          <foreignObject
            x={deleteAt.x - 10}
            y={deleteAt.y - 10}
            width={20}
            height={20}
            className="canvas-edge-delete-fo"
          >
            <button
              type="button"
              className="canvas-edge-delete"
              title="删除连线"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(edge.id);
              }}
            >
              <DeleteOutlined />
            </button>
          </foreignObject>
        ) : null}
      </g>
    );
  };

  return (
    <PageContainer
      loading={loading}
      className={fullscreen ? 'activity-canvas-page is-fullscreen' : 'activity-canvas-page'}
      {...pageHeader({
        title: isTemplate ? '模板设计' : '活动设计',
        backTo: isTemplate ? '/crowd-marketing/template/local' : '/crowd-marketing/activity',
        crumbs: isTemplate
          ? [
              { title: '营销管理', path: '/crowd-marketing/activity' },
              { title: '营销活动模板', path: '/crowd-marketing/template/local' },
              { title: '模板设计' },
            ]
          : [
              { title: '营销管理', path: '/crowd-marketing/activity' },
              { title: '营销活动', path: '/crowd-marketing/activity' },
              { title: '活动设计' },
            ],
      })}
    >
      <div className={`activity-canvas-shell${canvasReadOnly ? ' is-readonly' : ''}`}>
        <div className="activity-canvas-toolbar">
          <div className="activity-canvas-toolbar-meta">
            <Space wrap size={8} align="center">
              <Tag color={isTemplate ? 'processing' : statusTagColor(data?.status)}>
                {isTemplate ? '模板设计' : data?.status || '设计中'}
              </Tag>
              {canvasReadOnly ? (
                <Tag>只读</Tag>
              ) : null}
              <Typography.Text
                strong
                style={{ cursor: 'pointer' }}
                onClick={openActivityInfo}
                title={canRenameName ? '点击修改活动名称' : '查看活动信息'}
              >
                {data?.name || (isTemplate ? '营销活动模板' : '营销活动')}
              </Typography.Text>
              <Typography.Text type="secondary">ID：{data?.id || id}</Typography.Text>
              {!isTemplate && data?.approver ? (
                <Typography.Text type="secondary">审批人：{data.approver}</Typography.Text>
              ) : null}
              <Tooltip
                title={
                  canvasReadOnly
                    ? `当前状态「${data?.status}」画布只读：可查看流程与执行相关操作，不可改节点/连线`
                    : '四边锚点均可拖出连线 ·「是否购买」出边自动标分支 ·「是否访问」直连下游 · Delete 删除 · 双击配置节点'
                }
              >
                <Button type="text" size="small" icon={<QuestionCircleOutlined />}>
                  操作说明
                </Button>
              </Tooltip>
            </Space>
          </div>
          <div className="activity-canvas-toolbar-actions">
            <div className="activity-canvas-actions-left">
              {!isTemplate ? (
                <Button
                  type="text"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={() => {
                    setSaveTplName(`${data?.name || '营销活动'}-模板`);
                    setSaveTplOpen(true);
                  }}
                >
                  保存为模板
                </Button>
              ) : null}
              <Input.Search
                size="small"
                allowClear
                placeholder="搜索节点"
                style={{ width: 160 }}
                onSearch={setNodeKeyword}
              />
              <Button type="text" size="small" onClick={openActivityInfo}>
                {isTemplate ? '模板信息' : '活动信息'}
              </Button>
              <Button type="text" size="small" icon={<UndoOutlined />} onClick={tip('撤销')}>
                撤销
              </Button>
              <Button type="text" size="small" icon={<RedoOutlined />} onClick={tip('恢复')}>
                恢复
              </Button>
              <Button type="text" size="small" onClick={tip('自动排版')}>
                自动排版
              </Button>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'delete',
                      label: '删除',
                      danger: true,
                      icon: <DeleteOutlined />,
                      disabled: canvasReadOnly || (!selectedId && !selectedEdgeId),
                      onClick: () => (selectedEdgeId ? deleteEdge() : deleteNode()),
                    },
                  ],
                }}
              >
                <Button type="text" size="small" icon={<EllipsisOutlined />}>
                  更多
                </Button>
              </Dropdown>
            </div>
            <div className="activity-canvas-actions-right">
              {!isTemplate ? (
                <>
                  {!canvasReadOnly ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={handleTestRun}
                    >
                      测试执行
                    </Button>
                  ) : null}
                  {canExecute && data?.status === '已通过' ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<CloudUploadOutlined />}
                      onClick={handleFormalRun}
                    >
                      正式执行
                    </Button>
                  ) : null}
                  {canExecute && data?.status === '已暂停' ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<CloudUploadOutlined />}
                      onClick={handleFormalRun}
                    >
                      恢复执行
                    </Button>
                  ) : null}
                  {data?.status === '进行中' ? (
                    <Button
                      type="text"
                      size="small"
                      icon={<PauseCircleOutlined />}
                      onClick={handlePause}
                    >
                      暂停
                    </Button>
                  ) : null}
                  {['草稿', '已驳回'].includes(data?.status) ? (
                    <Button type="text" size="small" onClick={handleSubmitApprove}>
                      提交审批
                    </Button>
                  ) : null}
                  {['进行中', '已暂停', '已结束'].includes(data?.status) ? (
                    <Button
                      type="text"
                      size="small"
                      onClick={() => history.push(`/crowd-marketing/activity/report/${id}`)}
                    >
                      执行结果
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Space size={0}>
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomOutOutlined />}
                  onClick={() => setZoom((z) => Math.max(50, z - 10))}
                />
                <Dropdown
                  menu={{
                    items: [50, 75, 100, 125, 150].map((v) => ({
                      key: String(v),
                      label: `${v}%`,
                      onClick: () => setZoom(v),
                    })),
                  }}
                >
                  <Button type="text" size="small">
                    {zoom}%
                  </Button>
                </Dropdown>
                <Button
                  type="text"
                  size="small"
                  icon={<ZoomInOutlined />}
                  onClick={() => setZoom((z) => Math.min(150, z + 10))}
                />
                <Tooltip title={fullscreen ? '退出全屏' : '全屏'}>
                  <Button
                    type="text"
                    size="small"
                    icon={fullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => setFullscreen((v) => !v)}
                  />
                </Tooltip>
              </Space>
            </div>
          </div>
        </div>

        <div className="activity-canvas-body">
          <aside className="activity-canvas-toolbox">
            <div className="toolbox-title">
              工具栏
              {canvasReadOnly ? (
                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  只读
                </Typography.Text>
              ) : null}
            </div>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索节点"
              value={toolboxKeyword}
              onChange={(e) => setToolboxKeyword(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Collapse
              size="small"
              ghost
              defaultActiveKey={filteredToolbox.map((g) => g.key)}
              items={filteredToolbox.map((group) => ({
                key: group.key,
                label: group.label,
                children: (
                  <div className="toolbox-list">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="toolbox-item"
                        disabled={canvasReadOnly}
                        onClick={() => addNode(item)}
                        title={
                          canvasReadOnly
                            ? '当前状态画布只读'
                            : '点击添加到画布；若已选中节点会自动连线'
                        }
                      >
                        <span className="toolbox-icon" style={{ color: item.color }}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                ),
              }))}
            />
          </aside>

          <main
            className={`activity-canvas-stage${panning ? ' is-panning' : ''}${
              linkPreview ? ' is-linking' : ''
            }`}
            ref={canvasRef}
            onMouseDown={onStageMouseDown}
            style={{
              backgroundSize: `${gridSize}px ${gridSize}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          >
            <div
              className="activity-canvas-viewport"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              }}
            >
              <svg
                className="activity-canvas-edges"
                width={edgeBounds.width}
                height={edgeBounds.height}
                style={{ left: edgeBounds.left, top: edgeBounds.top, pointerEvents: 'auto' }}
              >
                {edges.map((edge) => {
                  const from = nodeMap.get(edge.source);
                  const to = nodeMap.get(edge.target);
                  if (!from || !to) return null;
                  return renderEdgePath(from, to, edge, selectedEdgeId === edge.id);
                })}
                {linkPreview ? (
                  <path
                    d={`M ${linkPreview.x1 - edgeBounds.left} ${linkPreview.y1 - edgeBounds.top} L ${
                      linkPreview.x2 - edgeBounds.left
                    } ${linkPreview.y2 - edgeBounds.top}`}
                    stroke="#1677ff"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    fill="none"
                    style={{ pointerEvents: 'none' }}
                  />
                ) : null}
                <defs>
                  <marker
                    id="arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#91caff" />
                  </marker>
                  <marker
                    id="arrow-active"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#1677ff" />
                  </marker>
                </defs>
              </svg>

              {visibleNodes.map((node) => {
                const isStart = node.type === '开始';
                const color = colorByType[node.type] || '#1677ff';
                return (
                  <div
                    key={node.id}
                    className={`canvas-node ${selectedId === node.id ? 'is-selected' : ''} ${
                      isStart ? 'is-start' : ''
                    }`}
                    style={{ left: node.x, top: node.y, ['--node-color' as string]: color }}
                    onMouseDown={(e) => onNodeMouseDown(e, node)}
                    onDoubleClick={() => {
                      if (canvasReadOnly) {
                        message.info(`当前状态「${data?.status}」只读，可查看节点配置但不可保存修改`);
                      }
                      setConfigNode(node);
                    }}
                  >
                    {!isStart && selectedId === node.id && !canvasReadOnly ? (
                      <button
                        type="button"
                        className="canvas-node-delete"
                        title="删除节点"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    ) : null}
                    <div className="canvas-node-icon">
                      {node.name === '随机抽取' ? (
                        <ThunderboltOutlined />
                      ) : node.name === '排重' ? (
                        <FilterOutlined />
                      ) : (
                        iconByType[node.type] || <FormOutlined />
                      )}
                    </div>
                    <div className="canvas-node-label">{node.name}</div>
                    {!isStart && (() => {
                      const shortDesc = formatNodeCardDesc(node);
                      const fullDesc = formatNodeCardFullDesc(node);
                      if (!shortDesc && !fullDesc) return null;
                      return (
                        <Tooltip
                          title={
                            <div style={{ maxWidth: 360, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {fullDesc}
                            </div>
                          }
                          mouseEnterDelay={0.4}
                          placement="bottom"
                        >
                          <div className="canvas-node-desc">{shortDesc || fullDesc}</div>
                        </Tooltip>
                      );
                    })()}
                    {!canvasReadOnly
                      ? PORT_SIDES.map((side) => (
                          <span
                            key={side}
                            className={`canvas-port canvas-port-${side}`}
                            title="拖出连线（四边均可）"
                            onMouseDown={(e) => onPortMouseDown(e, node, side)}
                          />
                        ))
                      : null}
                  </div>
                );
              })}
            </div>

            <div className="activity-canvas-minimap">
              <div className="minimap-title">缩略图</div>
              <div className="minimap-body">
                {nodes.map((n) => {
                  const xs = nodes.map((x) => x.x);
                  const ys = nodes.map((x) => x.y);
                  const minX = Math.min(...xs) - 80;
                  const minY = Math.min(...ys) - 80;
                  const spanX = Math.max(Math.max(...xs) - minX + 160, 400);
                  const spanY = Math.max(Math.max(...ys) - minY + 160, 300);
                  return (
                    <span
                      key={n.id}
                      className="minimap-dot"
                      style={{
                        left: `${((n.x - minX) / spanX) * 100}%`,
                        top: `${((n.y - minY) / spanY) * 100}%`,
                        background: colorByType[n.type] || '#1677ff',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>

      <Modal
        title={
          configNode?.name === '排重' ? (
            <Space size={6}>
              <span>配置节点 · 排重</span>
              <Tooltip title={DEDUPE_SCOPE_TIP} placement="bottomLeft">
                <QuestionCircleOutlined
                  style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'help' }}
                />
              </Tooltip>
            </Space>
          ) : configNode?.name === '企微发消息' ? (
            <Space size={6}>
              <span>配置节点 · 企微发消息</span>
              <Tooltip title={WECOM_TIP} placement="bottomLeft">
                <QuestionCircleOutlined
                  style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'help' }}
                />
              </Tooltip>
            </Space>
          ) : configNode?.type === '开始' ? (
            `开始节点（节点代码：${startNodeCode(configNode.id)}）`
          ) : configNode?.name === '是否购买' ? (
            <Space size={6}>
              <span>配置节点 · 是否购买</span>
              <Tooltip title={JUDGE_TIP} placement="bottomLeft">
                <QuestionCircleOutlined
                  style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'help' }}
                />
              </Tooltip>
            </Space>
          ) : configNode?.name === '是否访问' ? (
            <Space size={6}>
              <span>配置节点 · 是否访问</span>
              <Tooltip title={VISIT_TIP} placement="bottomLeft">
                <QuestionCircleOutlined
                  style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'help' }}
                />
              </Tooltip>
            </Space>
          ) : (
            `配置节点 · ${configNode?.name || ''}`
          )
        }
        open={!!configNode}
        onCancel={() => setConfigNode(null)}
        okText={canvasReadOnly ? '关闭' : '确定'}
        cancelButtonProps={canvasReadOnly ? { style: { display: 'none' } } : undefined}
        onOk={() => {
          if (configNode) {
            if (canvasReadOnly) {
              message.warning(`当前状态「${data?.status}」只读，未保存修改`);
              setConfigNode(null);
              return;
            }
            if (configNode.type === '人群') {
              const source = configNode.meta?.audienceSource || 'crowd';
              if (source === 'crowd' && !configNode.meta?.crowdId) {
                message.warning('请选择目标人群');
                return;
              }
              if (source === 'tag' && !selectedTagKeys(configNode.meta).length) {
                message.warning('请至少选择一个人群标签（多选为并集）');
                return;
              }
            }
            if (configNode.name === '发短信') {
              const content = String(configNode.meta?.smsContent || '').trim();
              if (!content) {
                message.warning('请选择短信模板或填写模板内容');
                return;
              }
              if (!String(configNode.meta?.smsPublishAt || '').trim()) {
                message.warning('请选择短信发布时间');
                return;
              }
              const freqMode = configNode.meta?.smsFreqMode || 'slot';
              if (freqMode === 'once') {
                if (!String(configNode.meta?.smsFreqAt || '').trim()) {
                  message.warning('请选择每天定点发送时刻');
                  return;
                }
              } else if (
                !String(configNode.meta?.smsFreqStart || '').trim() ||
                !String(configNode.meta?.smsFreqEnd || '').trim()
              ) {
                message.warning('请选择每天发送时间段');
                return;
              }
            }
            if (configNode.name === '企微发消息') {
              const msgType = configNode.meta?.wecomMsgType || 'text';
              if (msgType === 'miniprogram') {
                if (!String(configNode.meta?.wecomMpTitle || '').trim()) {
                  message.warning('请填写小程序卡片标题');
                  return;
                }
                if (!String(configNode.meta?.wecomMpPath || '').trim()) {
                  message.warning('请填写小程序路径');
                  return;
                }
              } else if (!String(configNode.meta?.wecomContent || '').trim()) {
                message.warning('请填写企微消息内容');
                return;
              }
            }
            if (configNode.name === '小程序发券' || configNode.name === '发优惠券') {
              if (!configNode.meta?.couponId) {
                message.warning('请选择优惠券');
                return;
              }
              const n = Number(configNode.meta?.couponCount || '1');
              if (!Number.isFinite(n) || n < 1) {
                message.warning('请填写发券张数（至少 1）');
                return;
              }
            }
            if (configNode.type === '开始') {
              const name = String(configNode.name || '').trim();
              if (!name) {
                message.warning('请填写节点名称');
                return;
              }
              const mode = configNode.meta?.execMode || 'immediate';
              if (mode === 'schedule' && !String(configNode.meta?.scheduleAt || '').trim()) {
                message.warning('请选择定时执行时间');
                return;
              }
              if (mode === 'periodic') {
                if (
                  !String(configNode.meta?.rangeStart || '').trim() ||
                  !String(configNode.meta?.rangeEnd || '').trim()
                ) {
                  message.warning('请选择执行时间范围');
                  return;
                }
              }
            }
            if (configNode.type === '结束') {
              // 只读节点，无需校验
            }
            if (configNode.name === '是否购买') {
              const scope = configNode.meta?.purchaseScope || 'any';
              if (scope === 'category') {
                const cats = (configNode.meta?.purchaseCategories || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (!cats.length) {
                  message.warning('请选择至少一个商品类目');
                  return;
                }
              }
            }
            if (configNode.name === '是否访问') {
              const actions = (configNode.meta?.visitBehaviorActions || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              if (!actions.length) {
                message.warning('请至少选择一个行为动作（对齐打标规则·用户行为）');
                return;
              }
            }
            if (configNode.name === '加积分') {
              if (!configNode.meta?.pointsRewardType) {
                message.warning('请选择积分类型');
                return;
              }
              const n = Number(configNode.meta?.points);
              if (!Number.isFinite(n) || n < 1) {
                message.warning('请填写赠送数量（至少 1）');
                return;
              }
            }
            if (configNode.name === '随机抽取') {
              const mode = configNode.meta?.sampleMode || 'count';
              if (mode === 'ratio') {
                const r = Number(configNode.meta?.sampleRatio);
                if (!Number.isFinite(r) || r <= 0 || r > 100) {
                  message.warning('请填写 1～100 的抽取比例');
                  return;
                }
              } else {
                const n = Number(configNode.meta?.sampleSize);
                if (!Number.isFinite(n) || n < 1) {
                  message.warning('请填写抽取人数（至少 1）');
                  return;
                }
              }
            }
            if (configNode.name === '排重') {
              const oneIdOn = configNode.meta?.oneIdDedupe !== 'false';
              const excludeOn = configNode.meta?.excludeEnabled === 'true';
              if (!oneIdOn && !excludeOn) {
                message.warning('请至少开启「按 OneID 去重」或「排除已触达」');
                return;
              }
              if (excludeOn) {
                const scope = configNode.meta?.excludeScope || 'activity';
                if (scope === 'activity') {
                  const ids = (configNode.meta?.excludeActivityIds || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  if (!ids.length) {
                    message.warning('请选择要排除的已结束活动');
                    return;
                  }
                }
                if (scope === 'days') {
                  const d = Number(configNode.meta?.excludeDays);
                  if (!Number.isFinite(d) || d < 1) {
                    message.warning('请填写排除天数（至少 1）');
                    return;
                  }
                }
              }
            }
            const savedNode =
              configNode.type === '开始'
                ? {
                    ...configNode,
                    name: String(configNode.name || '开始').trim().slice(0, 40) || '开始',
                    config: formatStartConfig(configNode.meta),
                  }
                : configNode.name === '小程序发券' || configNode.name === '发优惠券'
                ? {
                    ...configNode,
                    meta: {
                      ...configNode.meta,
                      couponCount: String(
                        Number(configNode.meta?.couponCount || '1') || 1,
                      ),
                    },
                    config: formatCouponConfig({
                      ...configNode.meta,
                      couponCount: String(
                        Number(configNode.meta?.couponCount || '1') || 1,
                      ),
                    }),
                  }
                : configNode;
            setNodes((prev) =>
              prev.map((n) => (n.id === savedNode.id ? { ...n, ...savedNode } : n)),
            );
            message.success('已保存节点配置（演示）');
            void flowChangeRef.current();
          }
          setConfigNode(null);
        }}
        destroyOnHidden
        width={configNode?.type === '开始' ? 720 : 640}
      >
        {configNode?.type === '人群' ? (
          <Form layout="vertical">
            <Form.Item label="选人来源" required>
              <Radio.Group
                value={configNode.meta?.audienceSource || 'crowd'}
                onChange={(e) => {
                  const source = e.target.value as string;
                  setAudienceKeyword('');
                  setConfigNode({
                    ...configNode,
                    name: '选人',
                    meta: {
                      ...configNode.meta,
                      audienceSource: source,
                    },
                    config:
                      source === 'tag'
                        ? configNode.meta?.tagName || '请选择人群标签'
                        : configNode.meta?.crowdName
                          ? `目标人群：${String(configNode.meta.crowdName)
                              .replace(/^目标人群\s*[：:·]\s*/, '')
                              .replace(/（[^）]*）\s*$/, '')
                              .trim()}`
                          : '请选择目标人群',
                  });
                  if (source === 'tag') setTagFilter('all');
                }}
              >
                <Radio value="crowd">目标人群</Radio>
                <Radio value="tag">人群标签</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item style={{ marginBottom: 12 }}>
              <Input.Search
                allowClear
                placeholder={
                  (configNode.meta?.audienceSource || 'crowd') === 'crowd'
                    ? '搜索分类 / 人群名称'
                    : '搜索分类 / 标签名称'
                }
                value={audienceKeyword}
                onChange={(e) => setAudienceKeyword(e.target.value)}
              />
            </Form.Item>
            {(configNode.meta?.audienceSource || 'crowd') === 'crowd' ? (
              <Form.Item
                label="目标人群"
                required
                extra={
                  configNode.meta?.crowdId
                    ? `已选：${configNode.meta.crowdName || configNode.meta.crowdId}`
                    : '点击下方条目选择'
                }
              >
                <div
                  style={{
                    maxHeight: 360,
                    overflow: 'auto',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: '12px 12px 4px',
                  }}
                >
                  {!crowdGroupsForPick.length ? (
                    <Empty
                      description="无匹配目标人群"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    crowdGroupsForPick.map((g) => (
                      <div key={g.catalog} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>{g.catalog}</div>
                        <Space wrap size={[8, 8]}>
                          {g.items.map((c) => {
                            const selected = configNode.meta?.crowdId === c.id;
                            return (
                              <Button
                                key={c.id}
                                size="small"
                                type={selected ? 'primary' : 'default'}
                                onClick={() => {
                                  setConfigNode({
                                    ...configNode,
                                    meta: {
                                      ...configNode.meta,
                                      audienceSource: 'crowd',
                                      crowdId: c.id,
                                      crowdName: c.name,
                                      crowdCatalog: g.catalog,
                                    },
                                    config: `目标人群：${c.name}`,
                                    name: '选人',
                                  });
                                }}
                              >
                                {c.name}
                                <Typography.Text
                                  type={selected ? undefined : 'secondary'}
                                  style={{
                                    marginLeft: 6,
                                    fontSize: 12,
                                    color: selected ? 'rgba(255,255,255,0.85)' : undefined,
                                  }}
                                >
                                  {c.count}人
                                </Typography.Text>
                              </Button>
                            );
                          })}
                        </Space>
                      </div>
                    ))
                  )}
                </div>
              </Form.Item>
            ) : (
              <>
                <Form.Item label="标签范围" style={{ marginBottom: 8 }}>
                  <Checkbox
                    checked={tagFilter === 'recent'}
                    onChange={(e) => setTagFilter(e.target.checked ? 'recent' : 'all')}
                  >
                    只看常用
                  </Checkbox>
                  <Checkbox
                    style={{ marginLeft: 12 }}
                    checked={tagFilter === 'fav'}
                    onChange={(e) => setTagFilter(e.target.checked ? 'fav' : 'all')}
                  >
                    只看个人收藏
                  </Checkbox>
                  <Typography.Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    二选一
                  </Typography.Text>
                </Form.Item>
                <Form.Item
                  label="人群标签"
                  required
                  extra={
                    selectedTagKeys(configNode.meta).length
                      ? `已选 ${selectedTagKeys(configNode.meta).length} 个（多选为并集）：${
                          configNode.meta?.tagName || ''
                        }`
                      : '按分类展示，可多选；多选标签为并集'
                  }
                >
                  <div
                    style={{
                      maxHeight: 360,
                      overflow: 'auto',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: '12px 12px 4px',
                    }}
                  >
                    {!tagGroupsForPick.length ? (
                      <Empty
                        description={
                          tagFilter !== 'all' ? '当前筛选下无标签' : '无匹配标签'
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      tagGroupsForPick.map((g) => (
                        <div key={g.group} style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>{g.group}</div>
                          <Space wrap size={[8, 8]}>
                            {g.tags.map((t) => {
                              const keys = selectedTagKeys(configNode.meta);
                              const selected = keys.includes(t.key);
                              return (
                                <Button
                                  key={t.key}
                                  size="small"
                                  type={selected ? 'primary' : 'default'}
                                  onClick={() => {
                                    const nextKeys = selected
                                      ? keys.filter((k) => k !== t.key)
                                      : [...keys, t.key];
                                    const picked = nextKeys
                                      .map((k) => tagOptions.find((x) => x.key === k))
                                      .filter(Boolean) as typeof tagOptions;
                                    const label =
                                      picked.length === 0
                                        ? '请选择人群标签'
                                        : picked.length === 1
                                          ? `人群标签：${picked[0].tag}`
                                          : `人群标签：${picked.map((x) => x.tag).join('∪')}`;
                                    setConfigNode({
                                      ...configNode,
                                      meta: {
                                        ...configNode.meta,
                                        audienceSource: 'tag',
                                        tagKeys: nextKeys.join(','),
                                        tagKey: nextKeys[0] || '',
                                        tagGroup: picked[0]?.group || '',
                                        tagName: label,
                                      },
                                      config: label,
                                      name: '选人',
                                    });
                                  }}
                                >
                                  {t.tag}
                                  <Typography.Text
                                    type={selected ? undefined : 'secondary'}
                                    style={{
                                      marginLeft: 6,
                                      fontSize: 12,
                                      color: selected ? 'rgba(255,255,255,0.85)' : undefined,
                                    }}
                                  >
                                    {t.count}人
                                  </Typography.Text>
                                </Button>
                              );
                            })}
                          </Space>
                        </div>
                      ))
                    )}
                  </div>
                </Form.Item>
              </>
            )}
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              可从「目标人群」列表或「数据打标 · 人群标签」选人；人群标签支持多选并集。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.type === '等待' ? (
          <Form layout="vertical">
            <Form.Item label={<LabelTip label="等待时长" tip={WAIT_TIP} />} required>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  min={0}
                  max={9999}
                  style={{ width: '60%' }}
                  value={Number(
                    configNode.meta?.waitAmount ?? configNode.meta?.waitDays ?? '3',
                  )}
                  onChange={(v) => {
                    const waitAmount = String(Math.max(0, Number(v) || 0));
                    const nextMeta = {
                      ...configNode.meta,
                      waitAmount,
                      waitDays: waitAmount,
                      waitUnit: configNode.meta?.waitUnit || 'day',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatWaitConfig(nextMeta),
                    });
                  }}
                />
                <Select
                  style={{ width: '40%' }}
                  value={configNode.meta?.waitUnit || 'day'}
                  options={[
                    { value: 'day', label: '天' },
                    { value: 'hour', label: '小时' },
                  ]}
                  onChange={(waitUnit) => {
                    const nextMeta = { ...configNode.meta, waitUnit };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatWaitConfig(nextMeta),
                    });
                  }}
                />
              </Space.Compact>
            </Form.Item>
          </Form>
        ) : configNode?.name === '是否购买' ? (
          <Form layout="vertical">
            <Form.Item label="判定范围" required>
              <Radio.Group
                value={configNode.meta?.purchaseScope || 'any'}
                onChange={(e) => {
                  const purchaseScope = e.target.value as string;
                  const nextMeta = { ...configNode.meta, purchaseScope };
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatJudgeConfig(nextMeta),
                  });
                }}
              >
                {PURCHASE_SCOPE_OPTIONS.map((o) => (
                  <Radio key={o.value} value={o.value}>
                    {o.label}
                  </Radio>
                ))}
              </Radio.Group>
            </Form.Item>
            {(configNode.meta?.purchaseScope || 'any') === 'category' ? (
              <Form.Item label="商品类目" required>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="选择类目（多选为并集）"
                  options={PRODUCT_CATEGORY_OPTIONS}
                  value={(configNode.meta?.purchaseCategories || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)}
                  onChange={(cats: string[]) => {
                    const purchaseCategories = cats.join(',');
                    const nextMeta = { ...configNode.meta, purchaseCategories };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatJudgeConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            ) : null}
            <Form.Item label="分支说明">
              <Space direction="vertical" size={4}>
                <Tag color="success">已购买 → 通常连到「结束」</Tag>
                <Tag color="warning">未购买 → 通常连到「小程序发券」等继续触达</Tag>
              </Space>
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              从本节点右侧圆点拖出连线，将自动标注「已购买」「未购买」（最多两条）。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.name === '是否访问' ? (
          <Form layout="vertical">
            <Form.Item
              label="行为动作"
              required
              extra="对齐「新建人群标签 · 打标维度 · 用户行为」：选中后联动附属条件"
            >
              <Select
                mode="multiple"
                allowClear
                placeholder="浏览 / 活动访问 / …"
                options={VISIT_BEHAVIOR_ACTION_OPTIONS}
                value={(configNode.meta?.visitBehaviorActions || '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)}
                onChange={(actions: string[]) => {
                  const nextMeta = patchVisitActions(configNode.meta, actions || []);
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatVisitConfig(nextMeta),
                  });
                }}
              />
            </Form.Item>
            {(configNode.meta?.visitBehaviorActions || '')
              .split(',')
              .includes('浏览') ? (
              <>
                <div className="ant-form-item" style={visitCascadeItemStyle}>
                  <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                    <label style={{ height: 'auto' }}>浏览页面</label>
                  </div>
                  <Cascader
                    multiple
                    allowClear
                    changeOnSelect
                    placeholder="频道 / 页面（联级）"
                    style={{ width: '100%' }}
                    options={BROWSE_PAGE_CASCADE}
                    value={parseVisitJsonPaths(configNode.meta?.visitBrowsePages)}
                    onChange={(paths) => {
                      const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                      const nextMeta = {
                        ...configNode.meta,
                        visitBrowsePages: next?.length ? JSON.stringify(next) : '',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatVisitConfig(nextMeta),
                      });
                    }}
                    maxTagCount="responsive"
                    showCheckedStrategy={Cascader.SHOW_CHILD}
                  />
                </div>
                <Form.Item label="浏览时长(秒)">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="可选"
                    value={
                      configNode.meta?.visitBrowseDuration
                        ? Number(configNode.meta.visitBrowseDuration)
                        : undefined
                    }
                    onChange={(v) => {
                      const nextMeta = {
                        ...configNode.meta,
                        visitBrowseDuration: v != null ? String(v) : '',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatVisitConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
              </>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('加购') ? (
              <div className="ant-form-item" style={visitCascadeItemStyle}>
                <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                  <label style={{ height: 'auto' }}>加购商品</label>
                </div>
                <Cascader
                  multiple
                  allowClear
                  changeOnSelect
                  placeholder="品类 / 商品（联级）"
                  style={{ width: '100%' }}
                  options={CART_PRODUCT_CASCADE}
                  value={parseVisitJsonPaths(configNode.meta?.visitCartProducts)}
                  onChange={(paths) => {
                    const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                    const nextMeta = {
                      ...configNode.meta,
                      visitCartProducts: next?.length ? JSON.stringify(next) : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                  maxTagCount="responsive"
                  showCheckedStrategy={Cascader.SHOW_CHILD}
                />
              </div>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('分享') ? (
              <div className="ant-form-item" style={visitCascadeItemStyle}>
                <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                  <label style={{ height: 'auto' }}>分享活动</label>
                </div>
                <Cascader
                  multiple
                  allowClear
                  changeOnSelect
                  placeholder="类型 / 活动（联级）"
                  style={{ width: '100%' }}
                  options={SHARE_ACTIVITY_CASCADE}
                  value={parseVisitJsonPaths(configNode.meta?.visitShareActivities)}
                  onChange={(paths) => {
                    const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                    const nextMeta = {
                      ...configNode.meta,
                      visitShareActivities: next?.length ? JSON.stringify(next) : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                  maxTagCount="responsive"
                  showCheckedStrategy={Cascader.SHOW_CHILD}
                />
              </div>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('登录') ? (
              <Form.Item label="登录渠道">
                <Select
                  mode="multiple"
                  allowClear
                  options={CHANNEL_CODE_OPTIONS}
                  value={(configNode.meta?.visitLoginChannels || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)}
                  onChange={(v: string[]) => {
                    const nextMeta = {
                      ...configNode.meta,
                      visitLoginChannels: v?.length ? v.join(',') : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('活动访问') ? (
              <div className="ant-form-item" style={visitCascadeItemStyle}>
                <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                  <label style={{ height: 'auto' }}>访问渠道/专题</label>
                </div>
                <Cascader
                  multiple
                  allowClear
                  changeOnSelect
                  placeholder="渠道类型 / 入口"
                  style={{ width: '100%' }}
                  options={VISIT_CHANNEL_CASCADE}
                  value={parseVisitJsonPaths(configNode.meta?.visitVisitChannels)}
                  onChange={(paths) => {
                    const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                    const nextMeta = {
                      ...configNode.meta,
                      visitVisitChannels: next?.length ? JSON.stringify(next) : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                  maxTagCount="responsive"
                  showCheckedStrategy={Cascader.SHOW_CHILD}
                />
              </div>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('活动参与') ? (
              <div className="ant-form-item" style={visitCascadeItemStyle}>
                <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                  <label style={{ height: 'auto' }}>参与专题分类</label>
                </div>
                <Cascader
                  multiple
                  allowClear
                  changeOnSelect
                  placeholder="专题 / 分类"
                  style={{ width: '100%' }}
                  options={JOIN_SPECIAL_CASCADE}
                  value={parseVisitJsonPaths(configNode.meta?.visitJoinSpecials)}
                  onChange={(paths) => {
                    const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                    const nextMeta = {
                      ...configNode.meta,
                      visitJoinSpecials: next?.length ? JSON.stringify(next) : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                  maxTagCount="responsive"
                  showCheckedStrategy={Cascader.SHOW_CHILD}
                />
              </div>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '').split(',').includes('搜索') ? (
              <Form.Item label="搜索关键词">
                <Input
                  allowClear
                  placeholder="可空=任意搜索"
                  value={configNode.meta?.visitSearchQuery || ''}
                  onChange={(e) => {
                    const nextMeta = {
                      ...configNode.meta,
                      visitSearchQuery: e.target.value || '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            ) : null}
            {(configNode.meta?.visitBehaviorActions || '')
              .split(',')
              .includes('商品详情点击') ? (
              <div className="ant-form-item" style={visitCascadeItemStyle}>
                <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
                  <label style={{ height: 'auto' }}>详情商品</label>
                </div>
                <Cascader
                  multiple
                  allowClear
                  changeOnSelect
                  placeholder="品类 / 商品（联级）"
                  style={{ width: '100%' }}
                  options={CART_PRODUCT_CASCADE}
                  value={parseVisitJsonPaths(configNode.meta?.visitDetailProducts)}
                  onChange={(paths) => {
                    const next = (paths as string[][] | undefined)?.filter((p) => p?.length);
                    const nextMeta = {
                      ...configNode.meta,
                      visitDetailProducts: next?.length ? JSON.stringify(next) : '',
                    };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatVisitConfig(nextMeta),
                    });
                  }}
                  maxTagCount="responsive"
                  showCheckedStrategy={Cascader.SHOW_CHILD}
                />
              </div>
            ) : null}
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              本节点不分支：配置完成后从右侧锚点直连下游（如「是否购买」），无需标注已访问/未访问。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.type === '触达' ? (
          <Form layout="vertical">
            {configNode.name === '发短信' ? (
              <>
                <Form.Item label="短信类型" required>
                  <Select
                    value={configNode.meta?.smsChannel || 'normal'}
                    options={SMS_CHANNEL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    onChange={(v) => {
                      const nextMeta = { ...configNode.meta, smsChannel: v };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatSmsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="发送频次" required>
                  <Radio.Group
                    value={configNode.meta?.smsFreqMode || 'slot'}
                    onChange={(e) => {
                      const nextMeta = {
                        ...configNode.meta,
                        smsFreqMode: e.target.value as string,
                        smsFreqStart: configNode.meta?.smsFreqStart || '09:00',
                        smsFreqEnd: configNode.meta?.smsFreqEnd || '21:00',
                        smsFreqAt: configNode.meta?.smsFreqAt || '10:00',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatSmsConfig(nextMeta),
                      });
                    }}
                    options={SMS_FREQ_MODES.map((t) => ({ value: t.value, label: t.label }))}
                    style={{ marginBottom: 12 }}
                  />
                  {(configNode.meta?.smsFreqMode || 'slot') === 'once' ? (
                    <TimePicker
                      format="HH:mm"
                      style={{ width: '100%' }}
                      disabled={canvasReadOnly}
                      value={
                        configNode.meta?.smsFreqAt
                          ? dayjs(configNode.meta.smsFreqAt, 'HH:mm')
                          : dayjs('10:00', 'HH:mm')
                      }
                      onChange={(v) => {
                        const nextMeta = {
                          ...configNode.meta,
                          smsFreqAt: v ? v.format('HH:mm') : '10:00',
                        };
                        setConfigNode({
                          ...configNode,
                          meta: nextMeta,
                          config: formatSmsConfig(nextMeta),
                        });
                      }}
                    />
                  ) : (
                    <TimePicker.RangePicker
                      format="HH:mm"
                      style={{ width: '100%' }}
                      disabled={canvasReadOnly}
                      value={[
                        dayjs(configNode.meta?.smsFreqStart || '09:00', 'HH:mm'),
                        dayjs(configNode.meta?.smsFreqEnd || '21:00', 'HH:mm'),
                      ]}
                      onChange={(vals) => {
                        const nextMeta = {
                          ...configNode.meta,
                          smsFreqStart: vals?.[0] ? vals[0].format('HH:mm') : '09:00',
                          smsFreqEnd: vals?.[1] ? vals[1].format('HH:mm') : '21:00',
                        };
                        setConfigNode({
                          ...configNode,
                          meta: nextMeta,
                          config: formatSmsConfig(nextMeta),
                        });
                      }}
                    />
                  )}
                  <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                    当前：{formatSmsFreqConfig(configNode.meta)}
                  </Typography.Paragraph>
                </Form.Item>
                <Form.Item label="发布时间" required>
                  <DatePicker
                    showTime
                    style={{ width: '100%' }}
                    disabled={canvasReadOnly}
                    value={
                      configNode.meta?.smsPublishAt
                        ? dayjs(configNode.meta.smsPublishAt)
                        : undefined
                    }
                    onChange={(v) => {
                      const smsPublishAt = v ? v.format('YYYY-MM-DD HH:mm:ss') : '';
                      const nextMeta = { ...configNode.meta, smsPublishAt };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatSmsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="短信模板" required>
                  <Select
                    value={configNode.meta?.smsTemplateKey || 'A'}
                    disabled={canvasReadOnly}
                    options={[
                      { value: 'A', label: '模板A' },
                      { value: 'B', label: '模板B' },
                    ]}
                    onChange={(key) => {
                      const preset = SMS_LIBRARY_TEMPLATES[key];
                      const nextMeta = {
                        ...configNode.meta,
                        smsTemplateKey: key,
                        smsContent: preset?.content || configNode.meta?.smsContent || '',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatSmsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="短信内容">
                  <Input.TextArea
                    rows={4}
                    value={
                      configNode.meta?.smsContent ||
                      SMS_LIBRARY_TEMPLATES[configNode.meta?.smsTemplateKey || 'A']?.content ||
                      ''
                    }
                    disabled={canvasReadOnly}
                    placeholder="选择模板后展示内容"
                    onChange={(e) => {
                      const smsContent = e.target.value;
                      const nextMeta = { ...configNode.meta, smsContent };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatSmsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
              </>
            ) : configNode.name === '企微发消息' ? (
              <>
                <Form.Item label="发送对象" required>
                  <Radio.Group
                    value={configNode.meta?.wecomTarget || 'customer'}
                    onChange={(e) => {
                      const nextMeta = {
                        ...configNode.meta,
                        wecomTarget: e.target.value as string,
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatWecomConfig(nextMeta),
                      });
                    }}
                  >
                    <Radio value="customer">客户（外部联系人）</Radio>
                    <Radio value="group">客户群</Radio>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label="消息类型" required>
                  <Select
                    value={configNode.meta?.wecomMsgType || 'text'}
                    options={[
                      { value: 'text', label: '文本' },
                      { value: 'link', label: '图文链接' },
                      { value: 'miniprogram', label: '小程序卡片' },
                    ]}
                    onChange={(wecomMsgType) => {
                      const nextMeta = { ...configNode.meta, wecomMsgType };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatWecomConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                {(configNode.meta?.wecomMsgType || 'text') === 'miniprogram' ? (
                  <>
                    <Form.Item label="卡片标题" required>
                      <Input
                        value={configNode.meta?.wecomMpTitle || ''}
                        placeholder="如：会员专属活动"
                        onChange={(e) => {
                          const wecomMpTitle = e.target.value;
                          const nextMeta = { ...configNode.meta, wecomMpTitle };
                          setConfigNode({
                            ...configNode,
                            meta: nextMeta,
                            config: formatWecomConfig(nextMeta),
                          });
                        }}
                      />
                    </Form.Item>
                    <Form.Item label="小程序路径" required>
                      <Input
                        value={configNode.meta?.wecomMpPath || ''}
                        placeholder="如：pages/index/index"
                        onChange={(e) =>
                          setConfigNode({
                            ...configNode,
                            meta: { ...configNode.meta, wecomMpPath: e.target.value },
                          })
                        }
                      />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    label={
                      (configNode.meta?.wecomMsgType || 'text') === 'link'
                        ? '链接文案/URL'
                        : '消息内容'
                    }
                    required
                  >
                    <Input.TextArea
                      rows={3}
                      value={configNode.meta?.wecomContent || ''}
                      placeholder={
                        (configNode.meta?.wecomMsgType || 'text') === 'link'
                          ? '标题 + 链接地址'
                          : '填写企微消息正文'
                      }
                      onChange={(e) => {
                        const wecomContent = e.target.value;
                        const nextMeta = { ...configNode.meta, wecomContent };
                        setConfigNode({
                          ...configNode,
                          meta: nextMeta,
                          config: formatWecomConfig(nextMeta),
                        });
                      }}
                    />
                  </Form.Item>
                )}
              </>
            ) : configNode.name === '小程序发券' || configNode.name === '发优惠券' ? (
              <>
                <Form.Item
                  label={
                    <LabelTip
                      label="所属平台"
                      tip="对齐分中心小程序券库：仅可选择对应平台下可发放的优惠券（示意数据）。"
                    />
                  }
                  required
                >
                  <Select
                    value={
                      configNode.meta?.couponCenter ||
                      String((data?.centers || [])[0] || MARKETING_CENTERS[0])
                    }
                    options={MARKETING_CENTERS.map((c) => ({ value: c, label: c }))}
                    onChange={(couponCenter) => {
                      const nextMeta = {
                        ...configNode.meta,
                        couponCenter,
                        couponId: '',
                        couponName: '',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatCouponConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="优惠券" required>
                  <Select
                    value={configNode.meta?.couponId || undefined}
                    placeholder={
                      couponOptions.length ? '选择该平台优惠券' : '该平台暂无可用券'
                    }
                    options={couponOptions.map((c) => ({
                      value: c.id,
                      label: `${c.name}（${c.tip}·${c.type}）`,
                    }))}
                    onChange={(couponId) => {
                      const hit = couponOptions.find((c) => c.id === couponId);
                      const nextMeta = {
                        ...configNode.meta,
                        couponId,
                        couponName: hit?.name || couponId,
                        couponCenter: hit?.center || configNode.meta?.couponCenter,
                        couponCount: configNode.meta?.couponCount || '1',
                      };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatCouponConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="每人张数" required>
                  <InputNumber
                    min={1}
                    max={99}
                    style={{ width: '100%' }}
                    value={Number(configNode.meta?.couponCount || '1')}
                    onChange={(v) => {
                      const couponCount = String(Math.max(1, Number(v) || 1));
                      const nextMeta = { ...configNode.meta, couponCount };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatCouponConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
              </>
            ) : configNode.name === '加积分' ? (
              <>
                <Form.Item
                  label="积分类型"
                  required
                  extra={
                    POINTS_REWARD_TYPES.find(
                      (t) => t.value === (configNode.meta?.pointsRewardType || 'member_points'),
                    )?.tip
                  }
                >
                  <Select
                    value={configNode.meta?.pointsRewardType || 'member_points'}
                    options={POINTS_REWARD_TYPES.map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                    onChange={(pointsRewardType) => {
                      const nextMeta = { ...configNode.meta, pointsRewardType };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatPointsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label={
                    (configNode.meta?.pointsRewardType || 'member_points') === 'growth'
                      ? '成长值数量'
                      : '积分数量'
                  }
                  required
                >
                  <InputNumber
                    min={1}
                    max={999999}
                    style={{ width: '100%' }}
                    value={Number(configNode.meta?.points || '100')}
                    onChange={(v) => {
                      const points = String(Math.max(1, Number(v) || 1));
                      const nextMeta = { ...configNode.meta, points };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatPointsConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
                <Form.Item label="说明">
                  <Input
                    value={configNode.meta?.pointsRemark || ''}
                    placeholder="如：活动赠送"
                    onChange={(e) =>
                      setConfigNode({
                        ...configNode,
                        meta: { ...configNode.meta, pointsRemark: e.target.value },
                      })
                    }
                  />
                </Form.Item>
              </>
            ) : (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                未知触达类型，请删除后从工具箱重新添加。
              </Typography.Paragraph>
            )}
          </Form>
        ) : configNode?.name === '随机抽取' ? (
          <Form layout="vertical">
            <Form.Item label={<LabelTip label="抽取方式" tip={RANDOM_TIP} />} required>
              <Radio.Group
                value={configNode.meta?.sampleMode || 'count'}
                onChange={(e) => {
                  const sampleMode = e.target.value as string;
                  const nextMeta = { ...configNode.meta, sampleMode };
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatRandomSampleConfig(nextMeta),
                  });
                }}
              >
                <Radio value="count">按人数</Radio>
                <Radio value="ratio">按比例</Radio>
              </Radio.Group>
            </Form.Item>
            {(configNode.meta?.sampleMode || 'count') === 'ratio' ? (
              <Form.Item label="抽取比例（%）" required>
                <InputNumber
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                  value={Number(configNode.meta?.sampleRatio || '20')}
                  onChange={(v) => {
                    const sampleRatio = String(Math.min(100, Math.max(1, Number(v) || 1)));
                    const nextMeta = { ...configNode.meta, sampleMode: 'ratio', sampleRatio };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatRandomSampleConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            ) : (
              <Form.Item label="抽取人数" required>
                <InputNumber
                  min={1}
                  max={99999999}
                  style={{ width: '100%' }}
                  value={Number(configNode.meta?.sampleSize || '10000')}
                  onChange={(v) => {
                    const sampleSize = String(Math.max(1, Number(v) || 1));
                    const nextMeta = { ...configNode.meta, sampleMode: 'count', sampleSize };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatRandomSampleConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            )}
            <Form.Item label="随机种子">
              <Input
                allowClear
                placeholder="留空则自动生成"
                value={configNode.meta?.sampleSeed || ''}
                onChange={(e) =>
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, sampleSeed: e.target.value },
                  })
                }
              />
            </Form.Item>
          </Form>
        ) : configNode?.name === '排重' ? (
          <Form layout="vertical">
            <Form.Item label="人员去重">
              <Checkbox
                checked={configNode.meta?.oneIdDedupe !== 'false'}
                onChange={(e) => {
                  const oneIdDedupe = e.target.checked ? 'true' : 'false';
                  const nextMeta = { ...configNode.meta, oneIdDedupe };
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatDedupeConfig(nextMeta, activityNameMap),
                  });
                }}
              >
                按 OneID 去重
              </Checkbox>
            </Form.Item>
            <Form.Item label="排除已触达">
              <Checkbox
                checked={configNode.meta?.excludeEnabled === 'true'}
                onChange={(e) => {
                  const excludeEnabled = e.target.checked ? 'true' : 'false';
                  const nextMeta = {
                    ...configNode.meta,
                    excludeEnabled,
                    excludeScope: configNode.meta?.excludeScope || 'activity',
                  };
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatDedupeConfig(nextMeta, activityNameMap),
                  });
                }}
              >
                开启排除已触达
              </Checkbox>
            </Form.Item>
            {configNode.meta?.excludeEnabled === 'true' ? (
              <>
                <Form.Item label="排除方式" required>
                  <Radio.Group
                    value={configNode.meta?.excludeScope || 'activity'}
                    onChange={(e) => {
                      const excludeScope = e.target.value as string;
                      const nextMeta = { ...configNode.meta, excludeScope };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatDedupeConfig(nextMeta, activityNameMap),
                      });
                    }}
                  >
                    <Space direction="vertical">
                      <Radio value="activity">排除指定已结束活动已触达</Radio>
                      <Radio value="self_reached">排除本活动内已触达</Radio>
                      <Radio value="days">排除近 N 天已触达</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
                {(configNode.meta?.excludeScope || 'activity') === 'activity' ? (
                  <Form.Item
                    label={
                      <Space size={4}>
                        <span>排除活动</span>
                        <Tooltip title={DEDUPE_ACTIVITY_TIP} placement="topLeft">
                          <QuestionCircleOutlined
                            style={{ color: 'rgba(0,0,0,0.45)', cursor: 'help' }}
                          />
                        </Tooltip>
                      </Space>
                    }
                    required
                  >
                    <Select
                      mode="multiple"
                      allowClear
                      placeholder={
                        activityOptions.length
                          ? '选择要排除的已结束活动'
                          : '暂无已结束活动可选'
                      }
                      optionFilterProp="label"
                      notFoundContent="暂无已结束活动"
                      value={(configNode.meta?.excludeActivityIds || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)}
                      options={activityOptions.map((a) => ({
                        value: a.id,
                        label: a.name,
                      }))}
                      onChange={(ids: string[]) => {
                        const excludeActivityIds = ids.join(',');
                        const nextMeta = { ...configNode.meta, excludeActivityIds };
                        setConfigNode({
                          ...configNode,
                          meta: nextMeta,
                          config: formatDedupeConfig(nextMeta, activityNameMap),
                        });
                      }}
                    />
                  </Form.Item>
                ) : null}
                {(configNode.meta?.excludeScope || 'activity') === 'days' ? (
                  <Form.Item label="近 N 天" required>
                    <InputNumber
                      min={1}
                      max={365}
                      style={{ width: '100%' }}
                      value={Number(configNode.meta?.excludeDays || '7')}
                      onChange={(v) => {
                        const excludeDays = String(Math.max(1, Number(v) || 1));
                        const nextMeta = { ...configNode.meta, excludeDays };
                        setConfigNode({
                          ...configNode,
                          meta: nextMeta,
                          config: formatDedupeConfig(nextMeta, activityNameMap),
                        });
                      }}
                    />
                  </Form.Item>
                ) : null}
                <Form.Item label="渠道范围">
                  <Select
                    value={configNode.meta?.channelScope || 'all'}
                    options={[
                      { value: 'all', label: '全渠道' },
                      { value: 'sms', label: '仅短信' },
                      { value: 'wecom', label: '仅企微' },
                      { value: 'mp_coupon', label: '仅小程序发券' },
                      { value: 'points', label: '仅加积分' },
                    ]}
                    onChange={(channelScope) => {
                      const nextMeta = { ...configNode.meta, channelScope };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatDedupeConfig(nextMeta, activityNameMap),
                      });
                    }}
                  />
                </Form.Item>
              </>
            ) : null}
          </Form>
        ) : configNode?.type === '开始' ? (
          <Form layout="vertical">
            <Form.Item label="节点名称" required>
              <Input
                value={configNode.name}
                maxLength={40}
                showCount
                disabled={canvasReadOnly}
                onChange={(e) =>
                  setConfigNode({
                    ...configNode,
                    name: e.target.value.slice(0, 40),
                  })
                }
              />
            </Form.Item>
            <Form.Item label="执行方式" required>
              <Radio.Group
                value={configNode.meta?.execMode || 'immediate'}
                disabled={canvasReadOnly}
                onChange={(e) => {
                  const execMode = String(e.target.value);
                  const nextMeta = { ...configNode.meta, execMode };
                  setConfigNode({
                    ...configNode,
                    meta: nextMeta,
                    config: formatStartConfig(nextMeta),
                  });
                }}
              >
                <Space direction="vertical" size={8}>
                  <Radio value="immediate">即时执行</Radio>
                  <Radio value="schedule">定时执行</Radio>
                  <Radio value="periodic">周期性执行</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            {(configNode.meta?.execMode || 'immediate') === 'schedule' ? (
              <Form.Item label="执行时间" required>
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  disabled={canvasReadOnly}
                  value={
                    configNode.meta?.scheduleAt
                      ? dayjs(configNode.meta.scheduleAt)
                      : undefined
                  }
                  onChange={(v: Dayjs | null) => {
                    const scheduleAt = v ? v.format('YYYY-MM-DD HH:mm:ss') : '';
                    const nextMeta = { ...configNode.meta, scheduleAt };
                    setConfigNode({
                      ...configNode,
                      meta: nextMeta,
                      config: formatStartConfig(nextMeta),
                    });
                  }}
                />
              </Form.Item>
            ) : null}
            {(configNode.meta?.execMode || 'immediate') === 'periodic' ? (
              <>
                <Form.Item label="执行周期" required>
                  <Radio.Group
                    value={configNode.meta?.periodType || 'day'}
                    disabled={canvasReadOnly}
                    onChange={(e) => {
                      const periodType = String(e.target.value);
                      const nextMeta = { ...configNode.meta, periodType };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatStartConfig(nextMeta),
                      });
                    }}
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Radio value="day">
                        <Space size={8} wrap>
                          <span>按天</span>
                          <span>每</span>
                          <InputNumber
                            min={1}
                            max={365}
                            size="small"
                            disabled={
                              canvasReadOnly || (configNode.meta?.periodType || 'day') !== 'day'
                            }
                            value={Number(configNode.meta?.dayEvery || '1')}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(v) => {
                              const dayEvery = String(Math.max(1, Number(v) || 1));
                              const nextMeta = {
                                ...configNode.meta,
                                periodType: 'day',
                                dayEvery,
                              };
                              setConfigNode({
                                ...configNode,
                                meta: nextMeta,
                                config: formatStartConfig(nextMeta),
                              });
                            }}
                          />
                          <span>天</span>
                        </Space>
                      </Radio>
                      <Radio value="week">
                        <Space size={8} wrap>
                          <span>按周</span>
                          <span>每</span>
                          <Select
                            size="small"
                            style={{ width: 64 }}
                            disabled={canvasReadOnly || configNode.meta?.periodType !== 'week'}
                            options={NTH_OPTIONS}
                            value={configNode.meta?.weekEvery || '1'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(weekEvery) => {
                              const nextMeta = {
                                ...configNode.meta,
                                periodType: 'week',
                                weekEvery,
                              };
                              setConfigNode({
                                ...configNode,
                                meta: nextMeta,
                                config: formatStartConfig(nextMeta),
                              });
                            }}
                          />
                          <span>周的</span>
                          <Select
                            size="small"
                            style={{ width: 88 }}
                            disabled={canvasReadOnly || configNode.meta?.periodType !== 'week'}
                            options={WEEKDAY_OPTIONS}
                            value={configNode.meta?.weekDay || '周一'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(weekDay) => {
                              const nextMeta = {
                                ...configNode.meta,
                                periodType: 'week',
                                weekDay,
                              };
                              setConfigNode({
                                ...configNode,
                                meta: nextMeta,
                                config: formatStartConfig(nextMeta),
                              });
                            }}
                          />
                          <span>执行一次</span>
                        </Space>
                      </Radio>
                      <Radio value="month">
                        <Space direction="vertical" size={8} style={{ marginTop: 4 }}>
                          <span>按月</span>
                          <Radio.Group
                            value={configNode.meta?.monthMode || 'day'}
                            disabled={canvasReadOnly || configNode.meta?.periodType !== 'month'}
                            onChange={(e) => {
                              const monthMode = String(e.target.value);
                              const nextMeta = {
                                ...configNode.meta,
                                periodType: 'month',
                                monthMode,
                              };
                              setConfigNode({
                                ...configNode,
                                meta: nextMeta,
                                config: formatStartConfig(nextMeta),
                              });
                            }}
                          >
                            <Space direction="vertical" size={8}>
                              <Radio value="day">
                                <Space size={8} wrap>
                                  <span>每个月的第</span>
                                  <Select
                                    size="small"
                                    style={{ width: 64 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      (configNode.meta?.monthMode || 'day') !== 'day'
                                    }
                                    options={DAY_OF_MONTH_OPTIONS}
                                    value={configNode.meta?.monthDay || '1'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthDay) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'day',
                                        monthDay,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>天</span>
                                </Space>
                              </Radio>
                              <Radio value="lastDay">
                                <Space size={8} wrap>
                                  <span>每个月的倒数第</span>
                                  <Select
                                    size="small"
                                    style={{ width: 64 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      configNode.meta?.monthMode !== 'lastDay'
                                    }
                                    options={NTH_OPTIONS}
                                    value={configNode.meta?.monthLastDay || '1'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthLastDay) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'lastDay',
                                        monthLastDay,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>天</span>
                                </Space>
                              </Radio>
                              <Radio value="nthWeekday">
                                <Space size={8} wrap>
                                  <span>每个月的第</span>
                                  <Select
                                    size="small"
                                    style={{ width: 64 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      configNode.meta?.monthMode !== 'nthWeekday'
                                    }
                                    options={NTH_OPTIONS}
                                    value={configNode.meta?.monthNth || '1'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthNth) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'nthWeekday',
                                        monthNth,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>个</span>
                                  <Select
                                    size="small"
                                    style={{ width: 88 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      configNode.meta?.monthMode !== 'nthWeekday'
                                    }
                                    options={WEEKDAY_OPTIONS}
                                    value={configNode.meta?.monthWeekday || '周一'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthWeekday) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'nthWeekday',
                                        monthWeekday,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>执行一次</span>
                                </Space>
                              </Radio>
                              <Radio value="lastNthWeekday">
                                <Space size={8} wrap>
                                  <span>每个月的倒数第</span>
                                  <Select
                                    size="small"
                                    style={{ width: 64 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      configNode.meta?.monthMode !== 'lastNthWeekday'
                                    }
                                    options={NTH_OPTIONS}
                                    value={configNode.meta?.monthLastNth || '1'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthLastNth) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'lastNthWeekday',
                                        monthLastNth,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>个</span>
                                  <Select
                                    size="small"
                                    style={{ width: 88 }}
                                    disabled={
                                      canvasReadOnly ||
                                      configNode.meta?.periodType !== 'month' ||
                                      configNode.meta?.monthMode !== 'lastNthWeekday'
                                    }
                                    options={WEEKDAY_OPTIONS}
                                    value={configNode.meta?.monthLastWeekday || '周一'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(monthLastWeekday) => {
                                      const nextMeta = {
                                        ...configNode.meta,
                                        periodType: 'month',
                                        monthMode: 'lastNthWeekday',
                                        monthLastWeekday,
                                      };
                                      setConfigNode({
                                        ...configNode,
                                        meta: nextMeta,
                                        config: formatStartConfig(nextMeta),
                                      });
                                    }}
                                  />
                                  <span>执行一次</span>
                                </Space>
                              </Radio>
                            </Space>
                          </Radio.Group>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>
                <Form.Item label="执行时间范围" required>
                  <DatePicker.RangePicker
                    showTime
                    style={{ width: '100%' }}
                    disabled={canvasReadOnly}
                    value={
                      configNode.meta?.rangeStart && configNode.meta?.rangeEnd
                        ? [
                            dayjs(configNode.meta.rangeStart),
                            dayjs(configNode.meta.rangeEnd),
                          ]
                        : undefined
                    }
                    onChange={(vals) => {
                      const rangeStart =
                        vals?.[0] ? vals[0].format('YYYY-MM-DD HH:mm:ss') : '';
                      const rangeEnd =
                        vals?.[1] ? vals[1].format('YYYY-MM-DD HH:mm:ss') : '';
                      const nextMeta = { ...configNode.meta, rangeStart, rangeEnd };
                      setConfigNode({
                        ...configNode,
                        meta: nextMeta,
                        config: formatStartConfig(nextMeta),
                      });
                    }}
                  />
                </Form.Item>
              </>
            ) : null}
          </Form>
        ) : configNode?.type === '结束' ? (
          <Form layout="vertical">
            <Form.Item label="说明">
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                旅程结束，无需业务配置。将分支或触达结果汇入本节点即可。
              </Typography.Paragraph>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical">
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              该节点类型暂无专用配置，请从工具箱重新添加标准节点。
            </Typography.Paragraph>
          </Form>
        )}
      </Modal>
      <Modal
        title={isTemplate ? '模板信息' : '活动信息'}
        open={infoOpen}
        onCancel={() => setInfoOpen(false)}
        onOk={() => {
          if (!canRenameName) {
            setInfoOpen(false);
            return;
          }
          return saveActivityInfo();
        }}
        okText={canRenameName ? '保存' : '关闭'}
        cancelButtonProps={canRenameName ? undefined : { style: { display: 'none' } }}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="活动名称" required={canRenameName}>
            <Input
              value={editName}
              disabled={!canRenameName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="请输入活动名称"
            />
          </Form.Item>
          {!isTemplate ? (
            <>
              <Form.Item label="活动 ID">
                <Input value={data?.id || id} disabled />
              </Form.Item>
              <Form.Item label="状态">
                <Input value={data?.status || '--'} disabled />
              </Form.Item>
              <Form.Item label="审批人">
                <Input value={data?.approver || '--'} disabled />
              </Form.Item>
            </>
          ) : null}
          {!canRenameName ? (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              仅「草稿 / 已驳回」可修改活动名称；当前为只读查看。
            </Typography.Paragraph>
          ) : null}
        </Form>
      </Modal>
      {!isTemplate ? (
        <Modal
          title="保存为模板"
          open={saveTplOpen}
          onCancel={() => setSaveTplOpen(false)}
          onOk={async () => {
            const name = saveTplName.trim();
            if (!name) {
              message.warning('请填写模板名称');
              return;
            }
            await request('/api/crowd-marketing/templates/local', {
              method: 'POST',
              data: {
                name,
                catalog: data?.catalog || '未分类',
              },
            });
            message.success('已保存为模板，可在营销管理 · 营销活动模板中查看');
            setSaveTplOpen(false);
          }}
          destroyOnHidden
        >
          <Form layout="vertical">
            <Form.Item label="模板名称" required>
              <Input
                value={saveTplName}
                onChange={(e) => setSaveTplName(e.target.value)}
                placeholder="请输入模板名称"
              />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
      <Modal
        title="测试执行结果"
        open={!!testResult && testResultMode === 'modal'}
        onCancel={closeTestResult}
        footer={[
          <Button key="close" type="primary" onClick={closeTestResult}>
            知道了
          </Button>,
        ]}
        destroyOnHidden
        width={520}
      >
        {testResult ? renderTestResultBody(testResult) : null}
      </Modal>
      <Drawer
        title="测试执行结果"
        open={!!testResult && testResultMode === 'drawer'}
        onClose={closeTestResult}
        width={640}
        destroyOnHidden
      >
        {testResult ? renderTestResultBody(testResult) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ActivityDesign;
