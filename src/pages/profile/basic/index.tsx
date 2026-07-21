import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { Badge, Card } from 'antd';
import React from 'react';

const BasicProfile: React.FC = () => {
  return (
    <PageContainer>
      <Card title="基础详情">
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="取货单号">1000000000</ProDescriptions.Item>
          <ProDescriptions.Item label="状态">
            <Badge status="processing" text="进行中" />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="销售单号">1234123421</ProDescriptions.Item>
          <ProDescriptions.Item label="子订单">3214321432</ProDescriptions.Item>
          <ProDescriptions.Item label="产品名称" span={2}>
            固体化学材料 XZ-120
          </ProDescriptions.Item>
          <ProDescriptions.Item label="金额">¥ 123.45</ProDescriptions.Item>
          <ProDescriptions.Item label="联系人">曲丽丽 18100000000</ProDescriptions.Item>
          <ProDescriptions.Item label="备注" span={2}>
            原型详情页，可按客户字段扩展。
          </ProDescriptions.Item>
        </ProDescriptions>
      </Card>
    </PageContainer>
  );
};

export default BasicProfile;
