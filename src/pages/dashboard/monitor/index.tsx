import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { Badge, Col, List, Progress, Row, Tag } from 'antd';
import React from 'react';

const Monitor: React.FC = () => {
  return (
    <PageContainer>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <StatisticCard
            title="实时在线"
            statistic={{ title: '当前在线用户', value: 1286 }}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ProCard title="系统负载" bordered>
            <Progress type="dashboard" percent={68} />
          </ProCard>
        </Col>
        <Col xs={24} lg={8}>
          <ProCard title="服务状态" bordered>
            <List
              size="small"
              dataSource={[
                { name: 'API 网关', status: 'success' },
                { name: '消息队列', status: 'processing' },
                { name: '对象存储', status: 'success' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.name}</span>
                  <Badge
                    status={item.status as 'success' | 'processing'}
                    text={item.status === 'success' ? '正常' : '运行中'}
                  />
                </List.Item>
              )}
            />
          </ProCard>
        </Col>
      </Row>
      <ProCard title="告警列表" style={{ marginTop: 16 }} bordered>
        <Tag color="error">CPU 过高</Tag>
        <Tag color="warning">磁盘将满</Tag>
        <Tag color="success">备份完成</Tag>
      </ProCard>
    </PageContainer>
  );
};

export default Monitor;
