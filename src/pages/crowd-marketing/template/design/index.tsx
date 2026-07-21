import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Input, Space, Steps, message } from 'antd';
import React, { useEffect, useState } from 'react';

const TemplateDesign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    request(`/api/crowd-marketing/templates/local/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const nodes = (data?.nodes || []).filter((n: any) =>
    keyword ? n.name.includes(keyword) : true,
  );

  return (
    <PageContainer
      title={false}
      loading={loading}
      onBack={() => history.push('/crowd-marketing/template/local')}
      extra={[
        <Button
          key="create"
          type="primary"
          onClick={() => {
            message.success('已创建活动（演示）');
            history.push('/crowd-marketing/activity');
          }}
        >
          创建活动
        </Button>,
        <Button key="fullscreen" onClick={() => message.info('全屏（演示）')}>
          全屏
        </Button>,
      ]}
    >
      <ProCard className="panel-surface" style={{ marginBottom: 16 }}>
        <Space wrap>
          <strong>{data?.name || '模板详情'}</strong>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>模板ID：{data?.id}</span>
          <Input.Search
            placeholder="搜索节点"
            allowClear
            style={{ width: 220 }}
            onSearch={setKeyword}
          />
        </Space>
      </ProCard>
      <ProCard title="模板流程画布（演示）" className="panel-surface">
        <Steps
          direction="vertical"
          current={nodes.length - 1}
          items={nodes.map((n: any) => ({
            title: `${n.name}（${n.type}）`,
            description: <a onClick={() => message.info(`编辑节点「${n.name}」（演示）`)}>编辑</a>,
          }))}
        />
      </ProCard>
    </PageContainer>
  );
};

export default TemplateDesign;
