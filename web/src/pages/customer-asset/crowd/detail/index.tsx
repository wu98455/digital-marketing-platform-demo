import { PageContainer, ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Col, Modal, Row, Space, Statistic, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import { listPagination } from '@/utils/listSearch';
import { pageHeader } from '@/utils/pageHeader';

type CrowdMember = {
  id: string;
  oneId: string;
  memberId: string;
  name: string;
  phoneMasked: string;
  centers?: string[];
  source?: string;
};

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
      {...pageHeader({
        title: '人群详情',
        backTo: '/crowd',
        crumbs: [
          { title: '目标人群', path: '/crowd' },
          { title: '人群详情' },
        ],
        extra: (
          <Space>
            <Button
              disabled={data?.canCopy === false}
              onClick={() => {
                history.push(
                  `/crowd/create?copyName=${encodeURIComponent(`${data?.name || '人群'}（副本）`)}`,
                );
              }}
            >
              复制
            </Button>
            <Button
              danger
              disabled={data?.canDelete === false}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除该人群？',
                  onOk: () => {
                    message.success('已删除（演示）');
                    history.push('/crowd');
                  },
                });
              }}
            >
              删除
            </Button>
          </Space>
        ),
      })}
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
          defaultActiveKey="members"
          items={[
            {
              key: 'members',
              label: '人群明细',
              children: (
                <ProTable<CrowdMember>
                  search={false}
                  options={false}
                  pagination={listPagination as any}
                  rowKey="id"
                  dataSource={data?.members || []}
                  columns={[
                    { title: '人员 OneID', dataIndex: 'oneId', width: 160 },
                    { title: '会员ID', dataIndex: 'memberId', width: 100 },
                    { title: '姓名', dataIndex: 'name', width: 80 },
                    { title: '手机', dataIndex: 'phoneMasked', width: 120 },
                    {
                      title: '分中心',
                      dataIndex: 'centers',
                      width: 160,
                      render: (_, row) => <CenterTags centers={row.centers || []} />,
                    },
                    { title: '来源', dataIndex: 'source', ellipsis: true },
                  ]}
                />
              ),
            },
            {
              key: 'cond',
              label: '人群条件',
              children: <div style={{ padding: 8 }}>{data?.conditions || '--'}</div>,
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
