import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Card, Steps, Typography } from 'antd';
import React from 'react';

const STEPS = [
  {
    title: '数据打标',
    description: '给客户/店铺/商品/专题活动贴标签',
    path: '/tag-center/customer',
  },
  {
    title: '目标人群',
    description: '用标签圈出人包',
    path: '/crowd',
  },
  {
    title: '营销活动',
    description: '画布选目标人群做自动化',
    path: '/crowd-marketing/activity',
  },
];

const Welcome: React.FC = () => {
  return (
    <PageContainer title={false}>
      <Card>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          欢迎使用数字营销平台
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          按下面三步走完演示主路径（点击即可跳转）：
        </Typography.Paragraph>
        <Steps
          type="navigation"
          size="small"
          current={-1}
          style={{ marginBottom: 24, marginTop: 8 }}
          items={STEPS.map((s) => ({
            title: (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  history.push(s.path);
                }}
                style={{ color: 'inherit' }}
              >
                {s.title}
              </a>
            ),
            description: (
              <a
                onClick={(e) => {
                  e.preventDefault();
                  history.push(s.path);
                }}
                style={{ color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
              >
                {s.description}
              </a>
            ),
            status: 'wait' as const,
          }))}
          onChange={(current) => {
            const target = STEPS[current];
            if (target) history.push(target.path);
          }}
        />
        <Typography.Paragraph type="secondary">
          「客户资产（旧）」保留在菜单末尾，便于继续完善企微/微盟/导入等细节，不影响主叙事。
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          演示账号：demo / 123456
        </Typography.Paragraph>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
