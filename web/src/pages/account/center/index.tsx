import { UserOutlined } from '@ant-design/icons';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Avatar, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import { getDemoUsername } from '@/utils/demoMock';
import { findUserByUsername, getRoleById } from '@/utils/systemAdminStore';

const AccountCenter: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const username = (currentUser as any)?.username || getDemoUsername() || 'demo';

  const meta = useMemo(() => {
    const user = findUserByUsername(username);
    const role = user ? getRoleById(user.roleId) : getRoleById((currentUser as any)?.roleId);
    return { user, role };
  }, [username, currentUser]);

  return (
    <PageContainer
      title="个人中心"
      extra={
        <Button type="primary" onClick={() => history.push('/account/settings')}>
          前往个人设置
        </Button>
      }
    >
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={72}
                src={currentUser?.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: 12 }}
              />
              <Typography.Title level={4} style={{ marginBottom: 4 }}>
                {currentUser?.name || '演示用户'}
              </Typography.Title>
              <Space>
                <Tag color="blue">{meta.role?.name || currentUser?.title || '未分配角色'}</Tag>
                <Typography.Text type="secondary">@{username}</Typography.Text>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="账号概览">
            <ProDescriptions column={1}>
              <ProDescriptions.Item label="手机">
                {currentUser?.phone || '--'}
              </ProDescriptions.Item>
              <ProDescriptions.Item label="数据权限">
                {(meta.role?.centers || []).length
                  ? meta.role!.centers.join('、')
                  : '未配置分中心'}
              </ProDescriptions.Item>
              <ProDescriptions.Item label="最近登录">
                {meta.user?.lastLoginAt || '--'}
              </ProDescriptions.Item>
            </ProDescriptions>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AccountCenter;
