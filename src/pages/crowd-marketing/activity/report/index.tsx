import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Col, Empty, Row, Space, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

type NodeStat = {
  id: string;
  nodeName: string;
  nodeType: string;
  entered: number;
  success: number;
  failed: number;
  duration: string;
};

function rateText(success = 0, failed = 0) {
  const total = success + failed;
  if (!total) return '-';
  return `${((success / total) * 100).toFixed(1)}%`;
}

const ActivityReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    request(`/api/crowd-marketing/activities/${id}/report`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const reachRate = useMemo(() => {
    const success = data?.summary?.reachSuccess ?? 0;
    const fail = data?.summary?.reachFail ?? 0;
    return rateText(success, fail);
  }, [data]);

  const columns: ProColumns<NodeStat>[] = [
    { title: '节点', dataIndex: 'nodeName' },
    { title: '类型', dataIndex: 'nodeType', width: 100 },
    { title: '进入', dataIndex: 'entered', width: 90 },
    { title: '成功', dataIndex: 'success', width: 90 },
    {
      title: '失败',
      dataIndex: 'failed',
      width: 90,
      render: (_, row) => (
        <span style={{ color: row.failed > 0 ? '#cf1322' : undefined }}>{row.failed}</span>
      ),
    },
    {
      title: '成功率',
      search: false,
      width: 100,
      render: (_, row) => rateText(row.success, row.failed),
    },
    { title: '耗时', dataIndex: 'duration', width: 100 },
  ];

  const executed = data?.executed !== false && data?.execStatus !== '未执行';

  return (
    <PageContainer
      title={false}
      loading={loading}
      onBack={() => history.push('/crowd-marketing/activity')}
      extra={
        <Space>
          <Button onClick={() => history.push(`/crowd-marketing/activity/design/${id}`)}>
            返回画布
          </Button>
        </Space>
      }
    >
      {!executed ? (
        <ProCard title="执行结果">
          <Empty
            description={
              <span>
                {data?.status === '已通过'
                  ? '活动已审批通过，尚未正式执行'
                  : data?.status === '待审批' || data?.status === '已驳回'
                    ? `当前状态「${data.status}」，正式执行后可在此查看结果`
                    : '活动尚未执行，正式执行后可在此查看结果'}
                {data?.name ? `（${data.name}）` : ''}
              </span>
            }
          >
            <Button
              type="primary"
              onClick={() => history.push(`/crowd-marketing/activity/design/${id}`)}
            >
              去画布
            </Button>
          </Empty>
        </ProCard>
      ) : (
        <>
          <ProCard
            title="执行结果"
            subTitle={
              <Typography.Text type="secondary">
                {data?.name || '营销活动'} · ID {data?.id || id}
              </Typography.Text>
            }
            extra={<Tag color="processing">{data?.execStatus || '执行完成'}</Tag>}
            style={{ marginBottom: 16 }}
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              本页为该营销活动的执行结果汇总（非跨活动分析大盘）。执行时段：
              {data?.startAt || '-'} ~ {data?.endAt || '-'}
            </Typography.Paragraph>
            <Row gutter={16}>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="进入人数" value={data?.summary?.entered ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达成功" value={data?.summary?.reachSuccess ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达失败" value={data?.summary?.reachFail ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达成功率" value={reachRate} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="权益发放" value={data?.summary?.benefitIssued ?? 0} />
              </Col>
            </Row>
          </ProCard>

          <ProTable<NodeStat>
            headerTitle="按画布节点明细"
            rowKey="id"
            search={false}
            options={false}
            pagination={false}
            columns={columns}
            dataSource={data?.nodes || []}
          />
        </>
      )}
    </PageContainer>
  );
};

export default ActivityReportPage;
