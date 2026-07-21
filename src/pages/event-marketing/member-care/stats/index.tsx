import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Col, Row, Table, Tabs, message } from 'antd';
import React, { useEffect, useState } from 'react';

type StatCard = { title: string; value: number };
type StatDetail = {
  id: string;
  date: string;
  scene: string;
  execCount: number;
  successCount: number;
  points: number;
  benefits: number;
};

const CATEGORY_TABS = [
  { key: '入会绑定', label: '入会绑定' },
  { key: '等级变更', label: '等级变更' },
  { key: '积分变更', label: '积分变更' },
  { key: '生日关怀', label: '生日关怀' },
];

const StatsPage: React.FC = () => {
  const [category, setCategory] = useState('入会绑定');
  const [cards, setCards] = useState<StatCard[]>([]);
  const [details, setDetails] = useState<StatDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (cat: string) => {
    setLoading(true);
    try {
      const res = await request('/api/event-marketing/stats', {
        params: { category: cat },
      });
      setCards(res.data?.cards || []);
      setDetails(res.data?.details || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(category);
  }, [category]);

  const columns = [
    { title: '日期', dataIndex: 'date', width: 120 },
    { title: '场景', dataIndex: 'scene' },
    { title: '执行次数', dataIndex: 'execCount', width: 100 },
    { title: '成功人数', dataIndex: 'successCount', width: 100 },
    { title: '发放积分', dataIndex: 'points', width: 100 },
    { title: '发放权益', dataIndex: 'benefits', width: 100 },
    {
      title: '操作',
      width: 80,
      render: () => (
        <a onClick={() => message.info('查看明细（演示）')}>明细</a>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <ProCard className="panel-surface" style={{ marginBottom: 16 }} loading={loading}>
        <Tabs
          activeKey={category}
          onChange={setCategory}
          items={CATEGORY_TABS}
        />
        <Row gutter={[16, 16]}>
          {cards.map((card) => (
            <Col key={card.title} xs={12} sm={8} md={4}>
              <StatisticCard statistic={{ title: card.title, value: card.value }} />
            </Col>
          ))}
        </Row>
      </ProCard>

      <ProCard className="panel-surface" title="运行统计明细">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={details}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true }}
        />
      </ProCard>
    </PageContainer>
  );
};

export default StatsPage;
