import { PageContainer } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import {
  Card,
  Col,
  Row,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AssetOverviewRow,
  ChannelUsage,
  MarketingOverviewMetrics,
  TopActivityRow,
} from '@/utils/analyticsOverview';
import { listPagination } from '@/utils/listSearch';
import { useAllowedCenters } from '@/utils/useAllowedCenters';
import './Welcome.less';

type Overview = {
  updatedAt?: string;
  marketingOverview: MarketingOverviewMetrics;
  activityEntryCounts: {
    designing: number;
    pendingApprove: number;
    running: number;
    finished: number;
  };
  channelUsage: ChannelUsage;
  topActivities: TopActivityRow[];
  assetOverview: AssetOverviewRow[];
};

const RANGE_OPTIONS = [
  { label: '近3天', value: '3d' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
];

const tip = (text: string) => (
  <Tooltip title={text}>
    <QuestionCircleOutlined style={{ marginLeft: 4, color: 'rgba(0,0,0,0.45)' }} />
  </Tooltip>
);

const money = (n?: number) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AnalyticsPage: React.FC = () => {
  const { options: centerOptions, centers: allowed } = useAllowedCenters();
  const [centerFilter, setCenterFilter] = useState<string[]>([]);
  const [salesRange, setSalesRange] = useState('3d');
  const [topRange, setTopRange] = useState('3d');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [actPage, setActPage] = useState({ current: 1, pageSize: listPagination.defaultPageSize });
  const salesRangeRef = useRef(salesRange);

  useEffect(() => {
    salesRangeRef.current = salesRange;
  }, [salesRange]);

  useEffect(() => {
    if (!centerFilter.length && allowed.length) {
      setCenterFilter([...allowed]);
    }
  }, [allowed, centerFilter.length]);

  const centersParam = (centerFilter.length ? centerFilter : allowed).join(',');

  /** 平台 / 营销活动时间：整页刷新 */
  const loadPage = useCallback(async () => {
    if (!allowed.length) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await request<{ data: Overview }>('/api/analytics/overview', {
        params: {
          centers: centersParam,
          salesRange: salesRangeRef.current,
          topRange,
        },
      });
      setData(res.data);
      setActPage((p) => ({ ...p, current: 1 }));
    } catch {
      message.error('加载首页数据失败');
    } finally {
      setLoading(false);
    }
  }, [allowed, centersParam, topRange]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  /** 营销总览近 N 天：只更新本板块 */
  useEffect(() => {
    if (!allowed.length || !data) return;
    let cancelled = false;
    (async () => {
      setMarketingLoading(true);
      try {
        const res = await request<{ data: Overview }>('/api/analytics/overview', {
          params: {
            centers: centersParam,
            salesRange,
            topRange,
          },
        });
        if (cancelled) return;
        setData((prev) =>
          prev
            ? {
                ...prev,
                marketingOverview: res.data.marketingOverview,
                updatedAt: res.data.updatedAt,
              }
            : res.data,
        );
      } catch {
        if (!cancelled) message.error('更新营销总览失败');
      } finally {
        if (!cancelled) setMarketingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 仅在 salesRange 变化时更新营销总览；首屏由 loadPage 带入，此处用 data 判空跳过首帧
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesRange]);

  const marketing = data?.marketingOverview;
  const channel = data?.channelUsage;

  const assetTotal = (() => {
    const rows = data?.assetOverview || [];
    return {
      center: '合计',
      potential: rows.reduce((s, r) => s + r.potential, 0),
      active: rows.reduce((s, r) => s + r.active, 0),
      silent: rows.reduce((s, r) => s + r.silent, 0),
      churned: rows.reduce((s, r) => s + r.churned, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    };
  })();

  const goActivityList = (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    history.push(`/crowd-marketing/activity${q}`);
  };

  if (!allowed.length) {
    return (
      <PageContainer title={false}>
        <Card>
          <Typography.Title level={4}>首页</Typography.Title>
          <Typography.Paragraph type="secondary">
            当前账号角色未配置平台数据权限，请联系管理员在「系统管理 · 角色权限」中勾选平台。
          </Typography.Paragraph>
        </Card>
      </PageContainer>
    );
  }

  const entry = data?.activityEntryCounts;
  const entryItems = [
    { key: 'designing', label: '设计中', count: entry?.designing, status: '草稿' },
    { key: 'pending', label: '待审批', count: entry?.pendingApprove, status: '待审批' },
    { key: 'running', label: '执行中', count: entry?.running, status: '进行中' },
    { key: 'done', label: '执行完成', count: entry?.finished, status: '已结束' },
  ];

  return (
    <PageContainer title={false} className="analytics-page">
      <div className="analytics-filters">
        <Space wrap size={8}>
          <span className="analytics-filter-label">平台</span>
          <Select
            mode="multiple"
            allowClear
            style={{ minWidth: 280 }}
            options={centerOptions}
            value={centerFilter}
            onChange={setCenterFilter}
            placeholder="选择平台"
          />
        </Space>
      </div>

      <Card
        className="analytics-section"
        loading={loading || marketingLoading}
        title="营销总览"
        extra={
          <Select
            style={{ width: 120 }}
            options={RANGE_OPTIONS}
            value={salesRange}
            onChange={setSalesRange}
          />
        }
      >
        <span className="sales-updated">数据更新至：{data?.updatedAt || '--'}</span>
        <div className="sales-grid sales-grid-4">
          <div className="sales-metric is-hero">
            <div className="sales-metric-label">
              营销总金额
              {tip('所选时间范围内，营销活动归因产生的成交总金额（演示）')}
            </div>
            <div className="sales-metric-value">¥ {money(marketing?.marketingAmount)}</div>
          </div>
          <div className="sales-metric">
            <div className="sales-metric-label">
              营销次数
              {tip('所选时间范围内活动正式执行的次数（演示）')}
            </div>
            <div className="sales-metric-value">
              {(marketing?.marketingTimes ?? 0).toLocaleString()}
              <span className="metric-unit">次</span>
            </div>
          </div>
          <div className="sales-metric">
            <div className="sales-metric-label">
              转化人数
              {tip('因营销触达产生成交的去重人数（演示）')}
            </div>
            <div className="sales-metric-value">
              {(marketing?.convertUsers ?? 0).toLocaleString()}
              <span className="metric-unit">人</span>
            </div>
          </div>
          <div className="sales-metric">
            <div className="sales-metric-label">
              转化率
              {tip('转化人数 ÷ 营销触达人数，衡量触达转化效率（演示）')}
            </div>
            <div className="sales-metric-value is-accent">
              {(marketing?.convertRate ?? 0).toFixed(2)}%
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="analytics-pair" align="stretch">
        <Col xs={24} lg={14} className="analytics-pair-col">
          <Card title="营销活动入口" loading={loading}>
            <div className="entry-grid">
              {entryItems.map((item) => (
                <div
                  key={item.key}
                  className="entry-tile"
                  role="button"
                  tabIndex={0}
                  onClick={() => goActivityList(item.status)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') goActivityList(item.status);
                  }}
                >
                  <div className="entry-tile-label">{item.label}</div>
                  <div className="entry-tile-value">
                    {item.count ?? 0}
                    <span className="entry-tile-suffix">个</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10} className="analytics-pair-col">
          <Card title="通道用量" loading={loading}>
            <div className="channel-usage-grid">
              <div className="channel-panel">
                <div className="channel-panel-meta">短信发送</div>
                <div className="channel-panel-value">
                  {(channel?.smsSent ?? 0).toLocaleString()}
                  <span className="entry-tile-suffix">条</span>
                </div>
              </div>
              <div className="channel-panel">
                <div className="channel-panel-meta">企微推送</div>
                <div className="channel-panel-value">
                  {(channel?.wecomPushes ?? 0).toLocaleString()}
                  <span className="entry-tile-suffix">次</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="analytics-section"
        title="营销活动"
        loading={loading}
        extra={
          <Select
            style={{ width: 120 }}
            options={RANGE_OPTIONS}
            value={topRange}
            onChange={setTopRange}
          />
        }
      >
        <Table
          className="analytics-table"
          size="middle"
          rowKey="id"
          scroll={{ x: 1100 }}
          dataSource={data?.topActivities || []}
          pagination={{
            ...listPagination,
            current: actPage.current,
            pageSize: actPage.pageSize,
            onChange: (current, pageSize) => setActPage({ current, pageSize }),
            showTotal: (total) => `共 ${total} 条`,
          }}
          columns={[
            {
              title: '序号',
              width: 64,
              align: 'center',
              render: (_: unknown, __: TopActivityRow, index: number) =>
                (actPage.current - 1) * actPage.pageSize + index + 1,
            },
            {
              title: '活动名称',
              dataIndex: 'name',
              ellipsis: true,
              width: 180,
              render: (_, row) => (
                <a onClick={() => history.push(`/crowd-marketing/activity/report/${row.id}`)}>
                  {row.name}
                </a>
              ),
            },
            {
              title: '营销触达人数',
              dataIndex: 'reachUsers',
              width: 118,
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: '访问人数',
              dataIndex: 'visitUsers',
              width: 96,
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: '加购人数',
              dataIndex: 'cartUsers',
              width: 96,
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: '下单人数',
              dataIndex: 'orderUsers',
              width: 96,
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: '营销方式',
              dataIndex: 'channel',
              width: 140,
              ellipsis: true,
            },
            {
              title: '活动时间',
              dataIndex: 'activityTime',
              width: 210,
              className: 'col-activity-time',
            },
          ]}
        />
      </Card>

      <Card className="analytics-section" title="客户资产概览" loading={loading}>
        <Table
          className="analytics-table"
          size="middle"
          rowKey="center"
          pagination={false}
          dataSource={[...(data?.assetOverview || []), assetTotal]}
          columns={[
            { title: '平台', dataIndex: 'center', width: 160 },
            {
              title: (
                <span>
                  潜客
                  {tip('尚未成交或处于早期意向的客户（演示）')}
                </span>
              ),
              dataIndex: 'potential',
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: (
                <span>
                  活跃客户
                  {tip('近周期有登录或下单（演示）')}
                </span>
              ),
              dataIndex: 'active',
              align: 'right',
              render: (v: number, row) =>
                row.center === '合计' ? (
                  v.toLocaleString()
                ) : (
                  <a onClick={() => history.push('/platform-members')}>{v.toLocaleString()}</a>
                ),
            },
            {
              title: (
                <span>
                  沉默客户
                  {tip('曾活跃、近周期无互动（演示）')}
                </span>
              ),
              dataIndex: 'silent',
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: (
                <span>
                  流失客户
                  {tip('长期无互动（演示）')}
                </span>
              ),
              dataIndex: 'churned',
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
            {
              title: (
                <span>
                  全体客户
                  {tip('四态合计')}
                </span>
              ),
              dataIndex: 'total',
              align: 'right',
              render: (v: number) => v.toLocaleString(),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default AnalyticsPage;
