import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Avatar, Card, Col, Row, Typography } from 'antd';
import React from 'react';

const AccountCenter: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  return (
    <PageContainer>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={72}
                src={currentUser?.avatar}
                style={{ marginBottom: 12 }}
              />
              <Typography.Title level={4} style={{ marginBottom: 4 }}>
                {currentUser?.name || 'Demo User'}
              </Typography.Title>
              <Typography.Text type="secondary">交互专家</Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="个人信息">
            <ProDescriptions column={1}>
              <ProDescriptions.Item label="邮箱">
                {currentUser?.email || 'antdesign@alipay.com'}
              </ProDescriptions.Item>
              <ProDescriptions.Item label="手机">
                {currentUser?.phone || '0752-268888888'}
              </ProDescriptions.Item>
              <ProDescriptions.Item label="权限">
                {currentUser?.access || 'admin'}
              </ProDescriptions.Item>
            </ProDescriptions>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AccountCenter;
