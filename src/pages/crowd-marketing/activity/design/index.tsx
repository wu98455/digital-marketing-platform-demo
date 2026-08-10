import {
  AimOutlined,
  ApartmentOutlined,
  CaretRightOutlined,
  CloudUploadOutlined,
  CompressOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  ExpandOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FormOutlined,
  GiftOutlined,
  HistoryOutlined,
  ImportOutlined,
  MessageOutlined,
  PartitionOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SaveOutlined,
  SearchOutlined,
  SoundOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, request, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Collapse,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
};

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
    key: 'common',
    label: '常用',
    items: [
      { key: 'c_attr', name: '属性查询', type: '查询', icon: <SearchOutlined />, color: '#52c41a' },
      { key: 'c_order', name: '订单查询', type: '查询', icon: <FileTextOutlined />, color: '#52c41a' },
      { key: 'c_sms', name: '短信', type: '触达', icon: <MessageOutlined />, color: '#f5222d' },
      {
        key: 'c_trigger',
        name: '行为触发',
        type: '行为',
        icon: <ThunderboltOutlined />,
        color: '#fa8c16',
        defaultConfig: '浏览门票→立即推送',
      },
      {
        key: 'c_coupon',
        name: '发券',
        type: '优惠',
        icon: <GiftOutlined />,
        color: '#f5222d',
      },
    ],
  },
  {
    key: 'flow',
    label: '流程操作',
    items: [
      { key: 'wait', name: '等待', type: '等待', icon: <HistoryOutlined />, color: '#faad14' },
      { key: 'merge', name: '合并', type: '处理', icon: <ApartmentOutlined />, color: '#fa8c16' },
      { key: 'split', name: '拆分', type: '处理', icon: <PartitionOutlined />, color: '#fa8c16' },
      { key: 'exclude', name: '排除', type: '处理', icon: <PartitionOutlined />, color: '#fa8c16' },
      { key: 'dedupe', name: '排重', type: '处理', icon: <ApartmentOutlined />, color: '#fa8c16' },
      { key: 'end', name: '结束', type: '结束', icon: <AimOutlined />, color: '#8c8c8c' },
    ],
  },
  {
    key: 'audience',
    label: '目标客户筛选',
    items: [
      { key: 'attr', name: '属性查询', type: '查询', icon: <SearchOutlined />, color: '#52c41a' },
      {
        key: 'order',
        name: '订单查询',
        type: '查询',
        icon: <FileTextOutlined />,
        color: '#52c41a',
        defaultConfig: '字段固定·无游玩日期',
      },
      {
        key: 'mhist',
        name: '营销历史查询',
        type: '查询',
        icon: <FileSearchOutlined />,
        color: '#52c41a',
      },
      {
        key: 'crowd',
        name: '客户分群查询',
        type: '人群',
        icon: <ApartmentOutlined />,
        color: '#52c41a',
      },
      {
        key: 'card',
        name: '储值卡查询',
        type: '查询',
        icon: <CreditCardOutlined />,
        color: '#52c41a',
      },
      {
        key: 'import',
        name: '导入查询',
        type: '查询',
        icon: <ImportOutlined />,
        color: '#52c41a',
      },
      { key: 'crowd', name: '人群', type: '人群', icon: <ApartmentOutlined />, color: '#52c41a', defaultConfig: '选择目标人群' },
    ],
  },
  {
    key: 'comm',
    label: '沟通方式',
    items: [
      { key: 'sms', name: '短信', type: '触达', icon: <MessageOutlined />, color: '#f5222d' },
      { key: 'vsms', name: '语音短信', type: '触达', icon: <SoundOutlined />, color: '#f5222d' },
      { key: 'ai', name: 'AI外呼', type: '触达', icon: <PhoneOutlined />, color: '#f5222d' },
      {
        key: 'mp',
        name: '小程序站内信',
        type: '触达',
        icon: <MessageOutlined />,
        color: '#f5222d',
        defaultConfig: '看到行为调小程序',
      },
      {
        key: 'wecom',
        name: '企微客户群发',
        type: '触达',
        icon: <MessageOutlined />,
        color: '#f5222d',
      },
    ],
  },
  {
    key: 'offer',
    label: '优惠方式',
    items: [
      { key: 'coupon', name: '发券', type: '优惠', icon: <GiftOutlined />, color: '#f5222d' },
      { key: 'gift', name: '礼品', type: '优惠', icon: <GiftOutlined />, color: '#f5222d' },
      { key: 'points', name: '积分变更', type: '优惠', icon: <GiftOutlined />, color: '#f5222d' },
      {
        key: 'offline',
        name: '线下权益',
        type: '优惠',
        icon: <GiftOutlined />,
        color: '#f5222d',
      },
    ],
  },
  {
    key: 'data',
    label: '数据操作',
    items: [
      { key: 'tag', name: '打标', type: '数据', icon: <TagsOutlined />, color: '#13c2c2' },
    ],
  },
  {
    key: 'response',
    label: '渠道响应',
    items: [
      {
        key: 'ch_resp',
        name: '渠道响应',
        type: '响应',
        icon: <PartitionOutlined />,
        color: '#722ed1',
        defaultConfig: '点击/参与分支',
      },
    ],
  },
  {
    key: 'behavior',
    label: '客户行为',
    items: [
      {
        key: 'trigger',
        name: '行为触发',
        type: '行为',
        icon: <ThunderboltOutlined />,
        color: '#fa8c16',
        defaultConfig: '浏览门票→立即推送',
      },
      {
        key: 'afterbuy',
        name: '购后须知',
        type: '行为',
        icon: <FileTextOutlined />,
        color: '#fa8c16',
        defaultConfig: '金刀峡门票→注意事项',
      },
    ],
  },
];

const iconByType: Record<string, React.ReactNode> = {
  开始: <CaretRightOutlined />,
  人群: <ApartmentOutlined />,
  查询: <SearchOutlined />,
  触达: <MessageOutlined />,
  等待: <HistoryOutlined />,
  处理: <ApartmentOutlined />,
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

const chainEdges = (list: CanvasNode[]): CanvasEdge[] =>
  list.slice(0, -1).map((n, i) => ({
    id: `e_${n.id}_${list[i + 1].id}`,
    source: n.id,
    target: list[i + 1].id,
  }));

const ActivityDesign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
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
  const [crowdOptions, setCrowdOptions] = useState<{ id: string; name: string; count: number }[]>(
    [],
  );
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
            name: n.name,
            type: n.type,
            config: n.config,
            x: 80 + (i % 3) * 220,
            y: 80 + Math.floor(i / 3) * 140,
          }));
          setNodes(mapped);
          setEdges(chainEdges(mapped));
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
    request('/api/customer-asset/crowds', { params: { current: 1, pageSize: 100 } }).then(
      (res) => {
        setCrowdOptions(
          (res?.data || []).map((c: { id: string; name: string; count: number }) => ({
            id: c.id,
            name: c.name,
            count: c.count,
          })),
        );
      },
    );
  }, []);

  const filteredToolbox = useMemo(() => {
    const k = toolboxKeyword.trim();
    return TOOLBOX.map((group) => ({
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
    const edge = { id: `e_${source}_${target}_${Date.now()}`, source, target };
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
          if (addEdge(linkDrag.current.sourceId, target.id)) {
            message.success(`已连接 →「${target.name}」`);
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
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}/formal-run`,
      { method: 'POST' },
    );
    if (res?.success === false) {
      message.warning(res.errorMessage || '须审批通过后才能正式执行');
      return;
    }
    setData(res.data);
    message.success('已开始正式执行');
  };

  const handlePause = async () => {
    if (!id) return;
    const res = await request<{ success: boolean; errorMessage?: string; data?: any }>(
      `/api/crowd-marketing/activities/${id}/pause`,
      { method: 'POST' },
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
    edgeId: string,
    selected: boolean,
  ) => {
    const a = outPoint(from);
    const b = inPoint(to);
    const x1 = a.x - edgeBounds.left;
    const y1 = a.y - edgeBounds.top;
    const x2 = b.x - edgeBounds.left;
    const y2 = b.y - edgeBounds.top;
    const mx = (x1 + x2) / 2;
    const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    return (
      <g key={edgeId} className="canvas-edge-group">
        <path
          className="canvas-edge-hit"
          d={d}
          stroke="transparent"
          strokeWidth="14"
          fill="none"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setSelectedEdgeId(edgeId);
            setSelectedId('');
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            deleteEdge(edgeId);
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
      </g>
    );
  };

  return (
    <PageContainer
      title={false}
      loading={loading}
      onBack={() =>
        history.push(isTemplate ? '/crowd-marketing/template/local' : '/crowd-marketing/activity')
      }
      className={fullscreen ? 'activity-canvas-page is-fullscreen' : 'activity-canvas-page'}
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
              右侧圆点拖出连线（可一连多）· Delete 删除 · 双击配置节点
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
                <Button
                  type="text"
                  size="small"
                  icon={<CloudUploadOutlined />}
                  onClick={handleFormalRun}
                >
                  正式执行
                </Button>
                <Button type="text" size="small" icon={<PauseCircleOutlined />} onClick={handlePause}>
                  暂停
                </Button>
                <Button type="text" size="small" onClick={handleSubmitApprove}>
                  提交审批
                </Button>
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
                  return renderEdgePath(from, to, edge.id, selectedEdgeId === edge.id);
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
            setNodes((prev) =>
              prev.map((n) => (n.id === configNode.id ? { ...n, ...configNode } : n)),
            );
            message.success('已保存节点配置（演示）');
            void flowChangeRef.current();
          }
          setConfigNode(null);
        }}
        destroyOnHidden
      >
        {configNode?.type === '行为' ? (
          <Form layout="vertical">
            <Form.Item label="触发事件">
              <Select
                value={configNode.meta?.event || '浏览门票详情'}
                options={[
                  { label: '浏览门票详情', value: '浏览门票详情' },
                  { label: '加购', value: '加购' },
                  { label: '下单成功', value: '下单成功' },
                  { label: '支付成功', value: '支付成功' },
                ]}
                onChange={(v) =>
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, event: v },
                    config: `${v}→${configNode.meta?.delay || '立即'}`,
                  })
                }
              />
            </Form.Item>
            <Form.Item label="商品/景区条件">
              <Input
                placeholder="例：金刀峡门票"
                value={configNode.meta?.product || '金刀峡门票'}
                onChange={(e) =>
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, product: e.target.value },
                  })
                }
              />
            </Form.Item>
            <Form.Item label="延迟">
              <Select
                value={configNode.meta?.delay || '立即'}
                options={[
                  { label: '立即', value: '立即' },
                  { label: '30秒', value: '30秒' },
                  { label: '1分钟', value: '1分钟' },
                  { label: '5分钟', value: '5分钟' },
                ]}
                onChange={(v) =>
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, delay: v },
                    config: `${configNode.meta?.event || '浏览门票详情'}→${v}`,
                  })
                }
              />
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              示例：用户看门票立即推送；买过金刀峡门票后发注意事项。可再连到站内信/发券等节点。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.type === '人群' ? (
          <Form layout="vertical">
            <Form.Item label="目标人群" required>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="选择已保存的目标人群"
                value={configNode.meta?.crowdId}
                options={(crowdOptions || []).map((c) => ({
                  label: `${c.name}（${c.count}人）`,
                  value: c.id,
                }))}
                onChange={(v, opt) => {
                  const label = Array.isArray(opt) ? '' : String(opt?.label || v);
                  setConfigNode({
                    ...configNode,
                    meta: { ...configNode.meta, crowdId: v, crowdName: label },
                    config: label,
                    name: '目标人群',
                  });
                }}
              />
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              对接「目标人群」列表。可先去人群工坊圈选后再回来选择。
            </Typography.Paragraph>
          </Form>
        ) : configNode?.name === '订单查询' ? (
          <Typography.Paragraph>
            订单字段固定，无法新增自定义统计维度（如游玩日期）。可用行为事件近似圈选。
          </Typography.Paragraph>
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
