import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const SuccessResult: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <Result
          status="success"
          title="提交成功"
          subTitle="提交结果页用于反馈一系列操作任务的处理结果。"
          extra={[
            <Button type="primary" key="console" onClick={() => history.push('/welcome')}>
              返回首页
            </Button>,
            <Button key="buy" onClick={() => history.push('/list/table-list')}>
              查看列表
            </Button>,
          ]}
        />
      </Card>
    </PageContainer>
  );
};

export default SuccessResult;
