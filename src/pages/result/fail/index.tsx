import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Card, Result, Typography } from 'antd';
import React from 'react';

const FailResult: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <Result
          status="error"
          title="提交失败"
          subTitle="请核对并修改以下信息后，再重新提交。"
          extra={[
            <Button type="primary" key="console" onClick={() => history.push('/form/basic-form')}>
              返回修改
            </Button>,
            <Button key="buy" onClick={() => history.push('/welcome')}>
              返回首页
            </Button>,
          ]}
        >
          <Typography.Paragraph>
            <Typography.Text strong>您提交的内容有如下错误：</Typography.Text>
          </Typography.Paragraph>
          <Typography.Paragraph>账户余额不足</Typography.Paragraph>
          <Typography.Paragraph>不满足最低金额要求</Typography.Paragraph>
        </Result>
      </Card>
    </PageContainer>
  );
};

export default FailResult;
