import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card, Typography } from 'antd';
import React from 'react';

const Welcome: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer title={false}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          {intl.formatMessage({ id: 'pages.welcome.title', defaultMessage: '欢迎使用数字营销平台' })}
        </Typography.Title>
        <Typography.Paragraph>
          {intl.formatMessage({
            id: 'pages.welcome.description',
            defaultMessage:
              '演示框架已接入「客户资产」模块：客户列表、人群管理、标签管理、商品管理。请从左侧菜单进入对应页面验收。',
          })}
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {intl.formatMessage({
            id: 'pages.welcome.demoAccount',
            defaultMessage: '演示账号：demo / 123456',
          })}
        </Typography.Paragraph>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
