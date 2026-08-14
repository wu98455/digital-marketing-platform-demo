import {
  AimOutlined,
  ApartmentOutlined,
  CaretRightOutlined,
  CloudUploadOutlined,
  CompressOutlined,
  DeleteOutlined,
  ExpandOutlined,
  FormOutlined,
  GiftOutlined,
  HistoryOutlined,
  MessageOutlined,
  PartitionOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  SearchOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, request, useAccess, useLocation, useModel, useParams } from '@umijs/max';
import {
  Button,
  Checkbox,
  Collapse,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pageHeader } from '@/utils/pageHeader';
import { getFavoriteTagKeys, getRecentTagKeys, tagIdentity } from '@/utils/tagFavorites';
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

type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  /** 判断节点出边：已购买 / 未购买 */
  label?: string;
};

const JUDGE_BRANCH_LABELS = ['已购买', '未购买'] as const;

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
        defaultConfig: '短信模板',
      },
      {
        key: 'wecom',
        name: '企微发消息',
        type: '触达',
        icon: <MessageOutlined />,
        color: '#f5222d',
        defaultConfig: '企微消息内容',
      },
      {
        key: 'mp_coupon',
        name: '小程序发券',
        type: '触达',
        icon: <GiftOutlined />,
        color: '#f5222d',
        defaultConfig: '小程序优惠券',
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
        defaultConfig: '已购买 / 未购买',
      },
      { key: 'dedupe', name: '排重', type: '处理', icon: <ApartmentOutlined />, color: '#fa8c16' },
      { key: 'end', name: '结束', type: '结束', icon: <AimOutlined />, color: '#8c8c8c' },
    ],
  },
];

/** 一期：选人 + 触达三渠道 + 等待/是否购买分支 + 排重/结束 */
const TOOLBOX_PHASE1 = TOOLBOX;

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

const nodeSize = (node: CanvasNode) =>
  node.type === '开始' ? { w: 72, h: 72 } : { w: 112, h: 72 };

const outPoint = (node: CanvasNode) => {
  const { w, h } = nodeSize(node);
  return { x: node.x + w, y: node.y + h / 2 };
};

const inPoint = (node: CanvasNode) => {
  const { h } = nodeSize(node);
  return { x: node.x, y: node.y + h / 2 };
};

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
  const [crowdOptions, setCrowdOptions] = useState<
    { id: string; name: string; count: number; catalog: string }[]
  >([]);
  const [tagOptions, setTagOptions] = useState<
    { group: string; tag: string; count: number; key: string }[]
  >([]);
  const [tagFilter, setTagFilter] = useState<'all' | 'recent' | 'fav'>('all');
  const [audienceKeyword, setAudienceKeyword] = useState('');
  const [linkPreview, setLinkPreview] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
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
  const linkDrag = useRef<{ sourceId: string } | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
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
          const mapped = apiNodes.map((n, i) => ({
            id: n.id || `n${i}`,
            name: n.name === '人群' || n.name === '人群圈选' ? '选人' : n.name,
            type: n.type,
            config: n.config,
            meta: n.meta,
            x: 80 + (i % 4) * 200,
            y: 80 + Math.floor(i / 4) * 140,
          }));
          setNodes(mapped);
          const nextEdges: CanvasEdge[] = [];
          for (let i = 0; i < mapped.length - 1; i += 1) {
            const from = mapped[i];
            const to = mapped[i + 1];
            let label: string | undefined;
            if (from.type === '判断' || from.name === '是否购买') {
              const used = nextEdges.filter((e) => e.source === from.id).length;
              label = JUDGE_BRANCH_LABELS[used];
            }
            // 演示样例：是否购买 → 小程序发券 标未购买；另需人工连「已购买→结束」
            if (
              (from.type === '判断' || from.name === '是否购买') &&
              to.name === '小程序发券'
            ) {
              label = '未购买';
            }
            nextEdges.push({
              id: `e_${from.id}_${to.id}`,
              source: from.id,
              target: to.id,
              ...(label ? { label } : {}),
            });
          }
          // 样例补一条：是否购买 → 结束（已购买）
          const judge = mapped.find((n) => n.type === '判断' || n.name === '是否购买');
          const end = mapped.find((n) => n.type === '结束');
          if (judge && end && !nextEdges.some((e) => e.source === judge.id && e.target === end.id)) {
            nextEdges.push({
              id: `e_${judge.id}_${end.id}_bought`,
              source: judge.id,
              target: end.id,
              label: '已购买',
            });
          }
          setEdges(nextEdges);
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
  }, [configNode?.id, configNode?.type]);

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

  const addEdge = (source: string, target: string) => {
    if (!source || !target || source === target) return false;
    if (edgesRef.current.some((e) => e.source === source && e.target === target)) {
      message.warning('连线已存在');
      return false;
    }
    const sourceNode = nodesRef.current.find((n) => n.id === source);
    let label: string | undefined;
    if (sourceNode?.type === '判断' || sourceNode?.name === '是否购买') {
      const outs = edgesRef.current.filter((e) => e.source === source);
      if (outs.length >= 2) {
        message.warning('「是否购买」最多两条出边：已购买 / 未购买');
        return false;
      }
      const used = new Set(outs.map((e) => e.label).filter(Boolean));
      label = JUDGE_BRANCH_LABELS.find((l) => !used.has(l)) || JUDGE_BRANCH_LABELS[outs.length];
    }
    const edge: CanvasEdge = {
      id: `e_${source}_${target}_${Date.now()}`,
      source,
      target,
      ...(label ? { label } : {}),
    };
    edgesRef.current = [...edgesRef.current, edge];
    setEdges(edgesRef.current);
    return true;
  };

  const addNode = (item: ToolboxItem) => {
    const nid = `n_${Date.now()}`;
    const scale = zoom / 100;
    const rect = canvasRef.current?.getBoundingClientRect();
    const viewW = rect?.width || 800;
    const viewH = rect?.height || 500;
    const next: CanvasNode = {
      id: nid,
      name: item.name,
      type: item.type,
      x: (viewW / 2 - pan.x) / scale - 56 + (Math.random() - 0.5) * 80,
      y: (viewH / 2 - pan.y) / scale - 36 + (Math.random() - 0.5) * 60,
      config: item.defaultConfig || '待配置',
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
    for (let i = nodesRef.current.length - 1; i >= 0; i -= 1) {
      const n = nodesRef.current[i];
      if (excludeId && n.id === excludeId) continue;
      const { w, h } = nodeSize(n);
      if (worldX >= n.x && worldX <= n.x + w && worldY >= n.y && worldY <= n.y + h) {
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

  const onPortMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(node.id);
    setSelectedEdgeId('');
    const from = outPoint(node);
    linkDrag.current = { sourceId: node.id };
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
        const from = outPoint(source);
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
        const target = findNodeAt(world.x, world.y, linkDrag.current.sourceId);
        if (target) {
          const before = edgesRef.current.length;
          if (addEdge(linkDrag.current.sourceId, target.id)) {
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
    const right = Math.max(...xs) + pad + 120;
    const bottom = Math.max(...ys) + pad + 80;
    return { left, top, width: right - left, height: bottom - top };
  }, [nodes]);

  const gridSize = 20 * (zoom / 100);
  const tip = (text: string) => () => message.info(`${text}（演示）`);

  const invalidateIfNeeded = async () => {
    if (isTemplate || !id) return;
    const status = dataRef.current?.status;
    if (!['已通过', '进行中', '已暂停'].includes(status)) return;
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
    message.success('测试执行已触发（演示，无需审批）');
  };

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
    const a = outPoint(from);
    const b = inPoint(to);
    const x1 = a.x - edgeBounds.left;
    const y1 = a.y - edgeBounds.top;
    const x2 = b.x - edgeBounds.left;
    const y2 = b.y - edgeBounds.top;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <g key={edge.id} className="canvas-edge-group">
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
          <g transform={`translate(${mx}, ${my})`} style={{ pointerEvents: 'none' }}>
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
      <div className="activity-canvas-shell">
        <div className="activity-canvas-toolbar">
          <Space wrap size={4}>
            <Tag color={isTemplate ? 'processing' : statusTagColor(data?.status)} icon={<FormOutlined />}>
              {isTemplate ? '模板设计' : data?.status || '设计中'}
            </Tag>
            <Typography.Text strong>
              {data?.name || (isTemplate ? '营销活动模板' : '营销活动')}
            </Typography.Text>
            <Typography.Text type="secondary">ID：{data?.id || id}</Typography.Text>
            {!isTemplate && data?.approver ? (
              <Typography.Text type="secondary">审批人：{data.approver}</Typography.Text>
            ) : null}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              右侧圆点拖出连线（可一连多）· 「是否购买」出边自动标分支 · Delete 删除 · 双击配置
            </Typography.Text>
          </Space>
          <div className="activity-canvas-actions">
            <Button
              type="text"
              size="small"
              onClick={tip(isTemplate ? '模板信息' : '活动信息')}
            >
              {isTemplate ? '模板信息' : '活动信息'}
            </Button>
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
              style={{ width: 140 }}
              onSearch={setNodeKeyword}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!selectedId && !selectedEdgeId}
              onClick={() => (selectedEdgeId ? deleteEdge() : deleteNode())}
            >
              删除
            </Button>
            <Button type="text" size="small" onClick={tip('批量修改')}>
              批量修改
            </Button>
            <Button type="text" size="small" icon={<UndoOutlined />} onClick={tip('撤销')} />
            <Button type="text" size="small" icon={<RedoOutlined />} onClick={tip('恢复')} />
            <Button type="text" size="small" onClick={tip('自动排版')}>
              自动排版
            </Button>
            {!isTemplate ? (
              <>
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={handleTestRun}
                >
                  测试执行
                </Button>
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

        <div className="activity-canvas-body">
          <aside className="activity-canvas-toolbox">
            <div className="toolbox-title">工具栏</div>
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
                        onClick={() => addNode(item)}
                        title="点击添加到画布；若已选中节点会自动连线"
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
                    onDoubleClick={() => setConfigNode(node)}
                  >
                    {!isStart && selectedId === node.id ? (
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
                    <div className="canvas-node-icon">{iconByType[node.type] || <FormOutlined />}</div>
                    <div className="canvas-node-label">{node.name}</div>
                    {!isStart && node.config ? (
                      <div className="canvas-node-desc">{node.config}</div>
                    ) : null}
                    {node.type !== '结束' ? (
                      <span
                        className="canvas-port canvas-port-out"
                        title="拖出连线（可一连多）"
                        onMouseDown={(e) => onPortMouseDown(e, node)}
                      />
                    ) : null}
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
        title={`配置节点 · ${configNode?.name || ''}`}
        open={!!configNode}
        onCancel={() => setConfigNode(null)}
        onOk={() => {
          if (configNode) {
            if (configNode.type === '人群') {
              const source = configNode.meta?.audienceSource || 'crowd';
              if (source === 'crowd' && !configNode.meta?.crowdId) {
                message.warning('请选择目标人群');
                return;
              }
              if (source === 'tag' && !configNode.meta?.tagKey) {
                message.warning('请选择人群标签');
                return;
              }
            }
            setNodes((prev) =>
              prev.map((n) => (n.id === configNode.id ? { ...n, ...configNode } : n)),
            );
            message.success('已保存节点配置（演示）');
            void flowChangeRef.current();
          }
          setConfigNode(null);
        }}
        destroyOnHidden
        width={640}
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
                        : configNode.meta?.crowdName || '请选择目标人群',
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
                                  const label = `${c.name}（${c.count}人）`;
                                  setConfigNode({
                                    ...configNode,
                                    meta: {
                                      ...configNode.meta,
                                      audienceSource: 'crowd',
                                      crowdId: c.id,
                                      crowdName: label,
                                      crowdCatalog: g.catalog,
                                    },
                                    config: label,
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
                    configNode.meta?.tagKey
                      ? `已选：${configNode.meta.tagName || configNode.meta.tagKey}`
                      : '按分类展示，点击标签选择'
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
                              const selected = configNode.meta?.tagKey === t.key;
                              return (
                                <Button
                                  key={t.key}
                                  size="small"
                                  type={selected ? 'primary' : 'default'}
                                  onClick={() => {
                                    const label = `${t.group}/${t.tag}（${t.count}人）`;
                                    setConfigNode({
                                      ...configNode,
                                      meta: {
                                        ...configNode.meta,
                                        audienceSource: 'tag',
                                        tagKey: t.key,
                                        tagGroup: t.group,
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
              可从「目标人群」列表或「数据打标 · 人群标签」选人，二者择一；均支持按分类浏览与搜索。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.type === '等待' ? (
          <Form layout="vertical">
            <Form.Item label="等待天数" extra="填 0 表示立即继续">
              <InputNumber
                min={0}
                max={365}
                style={{ width: '100%' }}
                value={Number(configNode.meta?.waitDays ?? '3')}
                onChange={(v) => {
                  const days = v == null ? 0 : Number(v);
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, waitDays: String(days) },
                    config: days === 0 ? '立即' : `等待 ${days} 天`,
                  });
                }}
              />
            </Form.Item>
          </Form>
        ) : configNode?.type === '判断' || configNode?.name === '是否购买' ? (
          <Form layout="vertical">
            <Form.Item label="分支说明">
              <Typography.Paragraph style={{ marginBottom: 8 }}>
                演示态：按「是否购买」拆成两条出边，不接真实订单中台。
              </Typography.Paragraph>
              <Space direction="vertical" size={4}>
                <Tag color="success">已购买 → 通常连到「结束」</Tag>
                <Tag color="warning">未购买 → 通常连到「小程序发券」等继续触达</Tag>
              </Space>
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              从本节点右侧圆点拖出连线，将自动标注「已购买」「未购买」（最多两条）。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.type === '触达' ? (
          <Form layout="vertical">
            <Form.Item
              label={
                configNode.name === '发短信'
                  ? '短信模板'
                  : configNode.name === '企微发消息'
                    ? '企微消息内容'
                    : '优惠券名称'
              }
            >
              <Input
                value={configNode.config}
                placeholder="演示配置，填写名称即可"
                onChange={(e) => setConfigNode({ ...configNode, config: e.target.value })}
              />
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical">
            <Form.Item label="配置说明">
              <Input.TextArea
                rows={3}
                value={configNode?.config}
                onChange={(e) =>
                  configNode && setConfigNode({ ...configNode, config: e.target.value })
                }
              />
            </Form.Item>
          </Form>
        )}
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
                target: '全渠道会员',
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
    </PageContainer>
  );
};

export default ActivityDesign;
