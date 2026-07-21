import { PageContainer, ProList } from '@ant-design/pro-components';
import { Avatar, Card, Typography } from 'antd';
import React from 'react';

const CardList: React.FC = () => {
  return (
    <PageContainer>
      <ProList
        rowKey="id"
        headerTitle="卡片列表"
        grid={{ gutter: 16, column: 3 }}
        dataSource={[
          { id: 1, title: 'Alipay', desc: '那是一种内在的东西，他们无法达到' },
          { id: 2, title: 'Angular', desc: '希望是一个好东西，也许是最好的' },
          { id: 3, title: '私域社群运营', desc: '通过社群互动提升用户粘性与复购' },
          { id: 4, title: '618 大促活动', desc: '全渠道联动，提升活动转化与 ROI' },
          { id: 5, title: 'Bootstrap', desc: '凛冬将至' },
          { id: 6, title: 'React', desc: '生命就像一盒巧克力' },
        ]}
        metas={{
          title: {},
          content: {
            render: (_, row) => (
              <Card hoverable>
                <Card.Meta
                  avatar={<Avatar>{row.title?.[0]}</Avatar>}
                  title={row.title}
                  description={<Typography.Paragraph ellipsis={{ rows: 2 }}>{row.desc}</Typography.Paragraph>}
                />
              </Card>
            ),
          },
        }}
      />
    </PageContainer>
  );
};

export default CardList;
