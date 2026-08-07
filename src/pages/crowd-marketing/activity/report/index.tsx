import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Col, Row, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

type NodeStat = {
  id: string;
  nodeName: string;
  nodeType: string;
  entered: number;
  success: number;
  failed: number;
  duration: string;
};

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

  const columns: ProColumns<NodeStat>[] = [
    { title: '节点', dataIndex: 'nodeName' },
    { title: '类型', dataIndex: 'nodeType', width: 100 },
    { title: '进入', dataIndex: 'entered', width: 90 },
    { title: '成功', dataIndex: 'success', width: 90 },
    { title: '失败', dataIndex: 'failed', width: 90 },
    { title: '耗时', dataIndex: 'duration', width: 100 },
  ];

  return (
    <PageContainer
      title={false}
      loading={loading}
      onBack={() => history.push('/crowd-marketing/activity')}
    >
      <ProCard
        title="活动执行结果"
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
          <Col xs={12} md={6}>
            <Statistic title="进入人数" value={data?.summary?.entered ?? 0} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="触达成功" value={data?.summary?.reachSuccess ?? 0} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="触达失败" value={data?.summary?.reachFail ?? 0} />
          </Col>
          <Col xs={12} md={6}>
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
    </PageContainer>
  );
};

export default ActivityReportPage;
