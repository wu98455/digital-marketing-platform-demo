import { PageContainer, ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Col, Row, Statistic, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { listPagination } from '@/utils/listSearch';

const CrowdDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await request(`/api/customer-asset/crowds/${id}`);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <PageContainer
      loading={loading}
      title={false}
      onBack={() => history.push('/customer-asset/crowd/custom')}
      extra={[
        <Button key="edit" onClick={() => message.info('编辑（演示）')}>
          编辑
        </Button>,
        <Button
          key="est"
          type="primary"
          onClick={() => message.success(`估算人数：${data?.count ?? '-'}`)}
        >
          估算人数
        </Button>,
      ]}
    >
      <ProCard style={{ marginBottom: 16 }}>
        <ProDescriptions column={3}>
          <ProDescriptions.Item label="人群ID">{data?.id}</ProDescriptions.Item>
          <ProDescriptions.Item label="人数">{data?.count}</ProDescriptions.Item>
          <ProDescriptions.Item label="类型">{data?.type}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建人">{data?.creator}</ProDescriptions.Item>
          <ProDescriptions.Item label="目录">{data?.catalog}</ProDescriptions.Item>
          <ProDescriptions.Item label="同步状态">{data?.syncStatus}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{data?.createdAt}</ProDescriptions.Item>
          <ProDescriptions.Item label="更新时间">{data?.updatedAt}</ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>

      <ProCard>
        <Tabs
          items={[
            {
              key: 'cond',
              label: '人群条件',
              children: <div style={{ padding: 8 }}>{data?.conditions || '--'}</div>,
            },
            {
              key: 'members',
              label: '人群明细',
              children: (
                <ProTable
                  search={false}
                  options={false}
                  pagination={listPagination}
                  rowKey="customerId"
                  dataSource={data?.members || []}
                  columns={[
                    { title: '全渠道客户ID', dataIndex: 'customerId' },
                    { title: '姓名', dataIndex: 'name' },
                    { title: '手机号', dataIndex: 'phone' },
                  ]}
                />
              ),
            },
            {
              key: 'portrait',
              label: '人群画像',
              children: (
                <Row gutter={16}>
                  <Col span={12}>
                    <ProCard title="性别分布" bordered>
                      {(data?.portrait?.gender || []).map((g: any) => (
                        <Statistic
                          key={g.name}
                          title={g.name}
                          value={g.value}
                          suffix="%"
                          style={{ marginBottom: 12 }}
                        />
                      ))}
                    </ProCard>
                  </Col>
                  <Col span={12}>
                    <ProCard title="年龄分布" bordered>
                      {(data?.portrait?.age || []).map((g: any) => (
                        <Statistic
                          key={g.name}
                          title={g.name}
                          value={g.value}
                          suffix="%"
                          style={{ marginBottom: 12 }}
                        />
                      ))}
                    </ProCard>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};

export default CrowdDetail;
