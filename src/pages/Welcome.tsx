import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { history, request, useModel } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import { DEMO_SMS_UNIT_COST } from '@/utils/centers';
import { useAllowedCenters } from '@/utils/useAllowedCenters';

type Overview = {
  kpi: {
    activeOneId: number;
    highValue: number;
    reached: number;
    reachRate: number;
    estimatedCost: number;
    deltas?: Record<string, number>;
  };
  valueLayers: { name: string; count: number }[];
  opportunities: {
    name: string;
    centers: string[];
    oneIdCount: number;
    estimatedCost: number;
  }[];
  funnel: { name: string; count: number }[];
  trend: { date: string; browse: number; cart: number; share: number; order: number }[];
  centerCompare: { center: string; highValue: number; activeOneId: number }[];
  recentActivities: {
    id: string;
    name: string;
    centers: string[];
    entered: number;
    success: number;
    failed: number;
  }[];
  costBreakdown: { channel: string; amount: number }[];
};

const RANGE_OPTIONS = [
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
];

const AnalyticsPage: React.FC = () => {
  const { options: centerOptions, centers: allowed } = useAllowedCenters();
  const { initialState } = useModel('@@initialState');
  const [centerFilter, setCenterFilter] = useState<string[]>([]);
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!centerFilter.length && allowed.length) {
      setCenterFilter([...allowed]);
    }
  }, [allowed, centerFilter.length]);

  const load = useCallback(async () => {
    if (!allowed.length) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await request<{ data: Overview }>('/api/analytics/overview', {
        params: {
          centers: (centerFilter.length ? centerFilter : allowed).join(','),
          range,
        },
      });
      setData(res.data);
    } catch {
      message.error('加载经营分析失败');
    } finally {
      setLoading(false);
    }
  }, [allowed, centerFilter, range]);

  useEffect(() => {
    load();
  }, [load]);

  const maxFunnel = useMemo(
    () => Math.max(...(data?.funnel.map((f) => f.count) || [1]), 1),
    [data],
  );

  if (!allowed.length) {
    return (
      <PageContainer title={false}>
        <Card>
          <Typography.Title level={4}>经营分析</Typography.Title>
          <Typography.Paragraph type="secondary">
            当前账号角色未配置分中心数据权限，请联系管理员在「系统管理 · 角色权限」中勾选分中心。
          </Typography.Paragraph>
        </Card>
      </PageContainer>
    );
  }

  const kpi = data?.kpi;

  return (
    <PageContainer title={false}>
      <Card style={{ marginBottom: 16 }} loading={loading && !data}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div>
            <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
              经营分析
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              当前账号：{initialState?.currentUser?.name || '--'} · 按分中心与时间范围查看价值人群、行为与触达成本
            </Typography.Text>
          </div>
          <Space wrap>
            <span>分中心</span>
            <Select
              mode="multiple"
              allowClear
              style={{ minWidth: 260 }}
              options={centerOptions}
              value={centerFilter}
              onChange={setCenterFilter}
              placeholder="选择分中心"
            />
            <span>时间</span>
            <Select style={{ width: 120 }} options={RANGE_OPTIONS} value={range} onChange={setRange} />
            <Button type="primary" onClick={load} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      <ProCard ghost gutter={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          statistic={{
            title: '活跃 OneID 数',
            value: kpi?.activeOneId ?? 0,
            description:
              kpi?.deltas?.activeOneId != null ? (
                <Typography.Text type={kpi.deltas.activeOneId >= 0 ? 'success' : 'danger'}>
                  环比 {kpi.deltas.activeOneId >= 0 ? '↑' : '↓'}
                  {Math.abs(kpi.deltas.activeOneId)}%
                </Typography.Text>
              ) : undefined,
          }}
        />
        <StatisticCard statistic={{ title: '高价值人数', value: kpi?.highValue ?? 0 }} />
        <StatisticCard statistic={{ title: '近周期触达人数', value: kpi?.reached ?? 0 }} />
        <StatisticCard
          statistic={{
            title: '触达成功率',
            value: kpi?.reachRate ?? 0,
            suffix: '%',
          }}
        />
        <StatisticCard
          statistic={{
            title: '预估可投放成本',
            value: kpi?.estimatedCost ?? 0,
            prefix: '¥',
            precision: 2,
            description: (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                高价值未触达 × ¥{DEMO_SMS_UNIT_COST}/条
              </Typography.Text>
            ),
          }}
        />
      </ProCard>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="价值人群分层" loading={loading}>
            {(data?.valueLayers || []).map((layer) => (
              <div key={layer.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{layer.name}</span>
                  <span>{layer.count.toLocaleString()} OneID</span>
                </div>
                <Progress
                  percent={Math.round(
                    (layer.count /
                      Math.max(...(data?.valueLayers.map((x) => x.count) || [1]), 1)) *
                      100,
                  )}
                  showInfo={false}
                />
              </div>
            ))}
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              演示口径：高=近90天成交≥2；中=有成交；其余按行为/首单 Mock。
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="高价值机会榜" loading={loading}>
            <Table
              size="small"
              rowKey="name"
              pagination={false}
              dataSource={data?.opportunities || []}
              columns={[
                { title: '人群/标签', dataIndex: 'name', ellipsis: true },
                {
                  title: '分中心',
                  dataIndex: 'centers',
                  width: 160,
                  render: (v: string[]) => <CenterTags centers={v} max={2} />,
                },
                { title: 'OneID 人数', dataIndex: 'oneIdCount', width: 100 },
                {
                  title: '预估成本',
                  dataIndex: 'estimatedCost',
                  width: 100,
                  render: (v: number) => `¥${Number(v).toFixed(2)}`,
                },
                {
                  title: '操作',
                  width: 140,
                  render: () => (
                    <Space>
                      <a onClick={() => history.push('/crowd/create')}>去圈人</a>
                      <a onClick={() => history.push('/crowd-marketing/activity')}>去开活动</a>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="用户行为漏斗" loading={loading}>
            {(data?.funnel || []).map((step, idx) => {
              const prev = idx === 0 ? step.count : data!.funnel[idx - 1].count;
              const rate = prev ? Math.round((step.count / prev) * 1000) / 10 : 0;
              return (
                <div key={step.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {step.name}
                      {idx > 0 ? (
                        <Typography.Text type="secondary">（转化 {rate}%）</Typography.Text>
                      ) : null}
                    </span>
                    <span>{step.count.toLocaleString()}</span>
                  </div>
                  <Progress percent={Math.round((step.count / maxFunnel) * 100)} showInfo={false} />
                </div>
              );
            })}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="分中心对比 · 高价值 / 活跃 OneID" loading={loading}>
            <Table
              size="small"
              pagination={false}
              rowKey="center"
              dataSource={data?.centerCompare || []}
              columns={[
                { title: '分中心', dataIndex: 'center' },
                { title: '高价值', dataIndex: 'highValue' },
                { title: '活跃 OneID', dataIndex: 'activeOneId' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="行为趋势（浏览 / 加购 / 分享 / 下单）" loading={loading} style={{ marginBottom: 16 }}>
        <Table
          size="small"
          pagination={false}
          rowKey="date"
          scroll={{ x: 560 }}
          dataSource={data?.trend || []}
          columns={[
            { title: '日期', dataIndex: 'date', width: 110 },
            { title: '浏览', dataIndex: 'browse' },
            { title: '加购', dataIndex: 'cart' },
            { title: '分享', dataIndex: 'share' },
            { title: '下单', dataIndex: 'order' },
          ]}
          locale={{ emptyText: '暂无趋势数据' }}
        />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title="近期活动效果"
            loading={loading}
            extra={
              <a onClick={() => history.push('/crowd-marketing/node-record')}>
                查看全部执行记录
              </a>
            }
          >
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={data?.recentActivities || []}
              onRow={(row) => ({
                onClick: () =>
                  history.push(`/crowd-marketing/activity/report/${row.id || 'ACT202603'}`),
                style: { cursor: 'pointer' },
              })}
              columns={[
                { title: '活动', dataIndex: 'name', ellipsis: true },
                {
                  title: '分中心',
                  dataIndex: 'centers',
                  width: 140,
                  render: (v: string[]) => <CenterTags centers={v} max={2} />,
                },
                { title: '进入', dataIndex: 'entered', width: 70 },
                { title: '成功', dataIndex: 'success', width: 70 },
                { title: '失败', dataIndex: 'failed', width: 70 },
                {
                  title: '成功率',
                  width: 80,
                  render: (_, row) =>
                    row.entered
                      ? `${Math.round((row.success / row.entered) * 1000) / 10}%`
                      : '--',
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="渠道成本构成（演示）" loading={loading}>
            <Table
              size="small"
              pagination={false}
              rowKey="channel"
              dataSource={data?.costBreakdown || []}
              columns={[
                { title: '渠道', dataIndex: 'channel' },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (v: number) => `¥${Number(v).toFixed(2)}`,
                },
              ]}
              summary={(pageData) => {
                const total = pageData.reduce((s, r) => s + Number(r.amount || 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>¥{total.toFixed(2)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AnalyticsPage;
