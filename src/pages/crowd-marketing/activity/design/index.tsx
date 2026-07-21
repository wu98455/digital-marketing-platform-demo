import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Input, Space, Steps, Tag, message } from 'antd';
import React, { useEffect, useState } from 'react';

const ActivityDesign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setLoading(true);
    request(`/api/crowd-marketing/activities/${id}`)
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
      onBack={() => history.push('/crowd-marketing/activity')}
      extra={[
        <Button key="saveTpl" onClick={() => message.success('已保存为模板（演示）')}>
          保存为模板
        </Button>,
        <Button key="download" onClick={() => message.success('已下载节点信息（演示）')}>
          下载节点信息
        </Button>,
        <Button key="report" onClick={() => message.info('查看报告（演示）')}>
          查看报告
        </Button>,
        <Button key="fullscreen" onClick={() => message.info('全屏画布（演示）')}>
          全屏
        </Button>,
      ]}
    >
      <ProCard className="panel-surface" style={{ marginBottom: 16 }}>
        <Space wrap>
          <strong>{data?.name || '活动设计'}</strong>
          <Tag>{data?.status || '--'}</Tag>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>活动ID：{data?.id}</span>
          <Input.Search
            placeholder="搜索节点"
            allowClear
            style={{ width: 220 }}
            onSearch={setKeyword}
          />
        </Space>
      </ProCard>

      <ProCard title="活动流程画布（演示）" className="panel-surface">
        <Steps
          direction="vertical"
          current={nodes.length - 1}
          items={nodes.map((n: any) => ({
            title: `${n.name}（${n.type}）`,
            description: (
              <Space>
                <span>{n.config || '--'}</span>
                <a onClick={() => message.info(`配置节点「${n.name}」（演示）`)}>配置</a>
              </Space>
            ),
          }))}
        />
        <div style={{ marginTop: 16, color: 'rgba(0,0,0,0.45)' }}>
          支持开始/人群/触达等节点配置与合并去重；缩放/缩略图为演示能力。
        </div>
      </ProCard>
    </PageContainer>
  );
};

export default ActivityDesign;
