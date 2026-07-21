import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Col, Progress, Row, Typography } from 'antd';
import React from 'react';

const Analysis: React.FC = () => {
  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: '总销售额',
              value: 126560,
              precision: 2,
              prefix: '¥',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: '访问量',
              value: 8846,
              suffix: '次',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: '支付笔数',
              value: 6560,
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            statistic={{
              title: '运营活动效果',
              value: 78,
              suffix: '%',
            }}
          />
        </Col>
      </Row>
      <ProCard title="销售趋势" style={{ marginTop: 16 }} bordered>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          原型演示数据，可按客户业务替换为真实指标与图表。
        </Typography.Paragraph>
        <Progress percent={78} status="active" />
        <Progress percent={62} />
        <Progress percent={45} />
      </ProCard>
    </PageContainer>
  );
};

export default Analysis;
