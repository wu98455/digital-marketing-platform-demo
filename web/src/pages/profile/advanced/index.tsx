import { PageContainer, ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { Badge, Tabs } from 'antd';
import React from 'react';

const AdvancedProfile: React.FC = () => {
  return (
    <PageContainer
      title="单号：234231029431"
      content={
        <ProDescriptions column={3} size="small">
          <ProDescriptions.Item label="创建人">曲丽丽</ProDescriptions.Item>
          <ProDescriptions.Item label="订购产品">XX 服务</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">2026-07-15</ProDescriptions.Item>
          <ProDescriptions.Item label="关联单据">12421</ProDescriptions.Item>
          <ProDescriptions.Item label="生效日期">2026-07-16 ~ 2026-08-15</ProDescriptions.Item>
          <ProDescriptions.Item label="备注">高级详情分区示例</ProDescriptions.Item>
        </ProDescriptions>
      }
    >
      <ProCard>
        <Tabs
          items={[
            {
              key: 'detail',
              label: '详情',
              children: (
                <ProDescriptions title="流程进度" column={1}>
                  <ProDescriptions.Item label="当前状态">
                    <Badge status="processing" text="进行中" />
                  </ProDescriptions.Item>
                  <ProDescriptions.Item label="负责人">付小小</ProDescriptions.Item>
                  <ProDescriptions.Item label="耗时">2 小时 25 分</ProDescriptions.Item>
                </ProDescriptions>
              ),
            },
            {
              key: 'rules',
              label: '规则',
              children: (
                <ProTable
                  search={false}
                  options={false}
                  pagination={false}
                  rowKey="id"
                  dataSource={[
                    { id: 1, name: '规则一', desc: '启用满减' },
                    { id: 2, name: '规则二', desc: '限时折扣' },
                  ]}
                  columns={[
                    { title: '规则名称', dataIndex: 'name' },
                    { title: '描述', dataIndex: 'desc' },
                  ]}
                />
              ),
            },
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};

export default AdvancedProfile;
