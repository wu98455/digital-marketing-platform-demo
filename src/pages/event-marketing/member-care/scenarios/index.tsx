import {
  ModalForm,
  PageContainer,
  ProCard,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Card, Checkbox, Col, Row, Select, Space, Tabs, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

type Scenario = {
  id: string;
  category: string;
  name: string;
  desc: string;
};

const ScenariosPage: React.FC = () => {
  const [list, setList] = useState<Scenario[]>([]);
  const [tab, setTab] = useState('全部');
  const [onlyEnabled, setOnlyEnabled] = useState(true);
  const [channel, setChannel] = useState('全部触达通道');
  const [createOpen, setCreateOpen] = useState(false);
  const [current, setCurrent] = useState<Scenario>();

  useEffect(() => {
    request('/api/event-marketing/scenarios').then((res) => setList(res.data || []));
  }, []);

  const filtered = useMemo(() => {
    if (tab === '全部') return list;
    return list.filter((x) => x.category === tab);
  }, [list, tab]);

  return (
    <PageContainer title={false}>
      <ProCard className="panel-surface" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Checkbox checked={onlyEnabled} onChange={(e) => setOnlyEnabled(e.target.checked)}>
            使用中的场景
          </Checkbox>
          <Select
            value={channel}
            onChange={setChannel}
            style={{ width: 220 }}
            options={[
              { label: '全部触达通道', value: '全部触达通道' },
              { label: '普通短信', value: '普通短信' },
              { label: '淘宝短信', value: '淘宝短信' },
              { label: '微信', value: '微信' },
              { label: '企业微信', value: '企业微信' },
              { label: '积分发放', value: '积分发放' },
              { label: '权益发放', value: '权益发放' },
            ]}
          />
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>
            {onlyEnabled ? '仅展示使用中场景' : '展示全部场景'} · 通道：{channel}
          </span>
        </Space>
      </ProCard>

      <ProCard className="panel-surface">
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={['全部', '入会绑定', '等级变更', '积分变更', '生日关怀'].map((key) => ({
            key,
            label: key,
          }))}
        />
        <Row gutter={[16, 16]}>
          {filtered.map((item) => (
            <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
              <Card
                title={item.name}
                extra={<Tag color="blue">{item.category}</Tag>}
                actions={[
                  <Button
                    key="create"
                    type="link"
                    onClick={() => {
                      setCurrent(item);
                      setCreateOpen(true);
                    }}
                  >
                    立即创建
                  </Button>,
                ]}
              >
                <div style={{ color: 'rgba(0,0,0,0.65)', minHeight: 48 }}>{item.desc}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </ProCard>

      <ModalForm
        title={`创建营销计划 · ${current?.name || ''}`}
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={640}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          message.success(`已创建计划「${values.name}」（演示）`);
          history.push('/event-marketing/member-care/plans');
          return true;
        }}
      >
        <ProFormSelect
          name="memberCard"
          label="会员卡"
          options={[
            { label: '文旅大会员卡', value: '文旅大会员卡' },
            { label: '惠游会员卡', value: '惠游会员卡' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="name" label="计划名称" rules={[{ required: true }]} />
        <ProFormTextArea name="desc" label="计划说明" />
        <ProFormSelect
          name="execTime"
          label="执行时间"
          options={[
            { label: '始终', value: '始终' },
            { label: '30天', value: '30天' },
            { label: '自定义', value: '自定义' },
          ]}
          initialValue="始终"
        />
        <ProFormSelect
          name="strategy"
          label="策略"
          options={[
            { label: '简单策略', value: '简单' },
            { label: '个性化策略', value: '个性化' },
          ]}
          initialValue="简单"
        />
        <ProFormSelect
          name="reach"
          label="触达方式"
          options={[
            { label: '发沟通消息', value: '消息' },
            { label: '发权益与积分', value: '权益积分' },
          ]}
          initialValue="消息"
        />
        <ProFormSelect
          name="channel"
          label="通道模板"
          options={[
            { label: '普通短信模板', value: 'sms' },
            { label: '微信模板', value: 'wechat' },
            { label: '企微模板', value: 'wecom' },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ScenariosPage;
