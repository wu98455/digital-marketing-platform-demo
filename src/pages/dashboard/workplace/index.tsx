import { PageContainer, ProCard, ProList } from '@ant-design/pro-components';
import { Avatar, Col, Row, Typography } from 'antd';
import React from 'react';

const Workplace: React.FC = () => {
  return (
    <PageContainer>
      <ProCard style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Avatar size={64} src="https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png" />
          </Col>
          <Col flex="auto">
            <Typography.Title level={4} style={{ margin: 0 }}>
              早上好，Demo，开始今天的工作吧
            </Typography.Title>
            <Typography.Text type="secondary">交互专家 | 蚂蚁集团－某某事业群</Typography.Text>
          </Col>
        </Row>
      </ProCard>
      <ProList<{ title: string; description: string }>
        headerTitle="进行中的项目"
        rowKey="title"
        dataSource={[
          { title: 'React 原型', description: '后台管理演示骨架' },
          { title: '表单配置', description: '业务字段与校验' },
          { title: '列表联调', description: 'Mock 数据与筛选' },
        ]}
        metas={{
          title: {},
          description: {},
        }}
      />
    </PageContainer>
  );
};

export default Workplace;
