import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Tabs, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type RecordItem = {
  id: string;
  channel: string;
  memberCard: string;
  scene: string;
  planId: string;
  planName: string;
  ruleName: string;
  memberName: string;
  memberPhone: string;
  account: string;
  status: string;
  submitAt: string;
  sendAt: string;
  cost: string;
};

const CHANNEL_TABS = [
  { key: '普通短信', label: '普通短信' },
  { key: '淘宝短信', label: '淘宝短信' },
  { key: '微信', label: '微信' },
  { key: '企微', label: '企业微信' },
  { key: '积分发放', label: '积分发放' },
  { key: '权益发放', label: '权益发放' },
];

const RecordsPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [channel, setChannel] = useState('普通短信');
  const [costTotal, setCostTotal] = useState('0.00');

  const columns: ProColumns<RecordItem>[] = [
    { title: '计划名称', dataIndex: 'planName', hideInTable: true },
    { title: '会员手机', dataIndex: 'memberPhone', hideInTable: true },
    {
      title: '发送状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        成功: { text: '成功' },
        失败: { text: '失败' },
        发送中: { text: '发送中' },
        已取消: { text: '已取消' },
      },
    },
    {
      title: '发送时间',
      dataIndex: 'sendAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '记录ID', dataIndex: 'id', search: false, width: 90 },
    { title: '计划名称', dataIndex: 'planName', search: false },
    { title: '场景', dataIndex: 'scene', search: false, width: 130 },
    { title: '规则', dataIndex: 'ruleName', search: false, width: 90 },
    { title: '会员卡', dataIndex: 'memberCard', search: false, width: 120 },
    { title: '会员', dataIndex: 'memberName', search: false, width: 80 },
    { title: '手机号', dataIndex: 'memberPhone', search: false, width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (_, row) => (
        <Tag
          color={
            row.status === '成功' ? 'success' : row.status === '失败' ? 'error' : 'processing'
          }
        >
          {row.status}
        </Tag>
      ),
    },
    { title: '提交时间', dataIndex: 'submitAt', search: false, width: 170 },
    { title: '发送时间', dataIndex: 'sendAt', search: false, width: 170 },
    { title: '费用(元)', dataIndex: 'cost', search: false, width: 90 },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      search: false,
      render: () => [
        <a key="detail" onClick={() => message.info('查看详情（演示）')}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <Tabs
        activeKey={channel}
        onChange={(key) => {
          setChannel(key);
          actionRef.current?.reload();
        }}
        items={CHANNEL_TABS}
        style={{ marginBottom: 0 }}
      />
      <ProTable<RecordItem>
        headerTitle={`${CHANNEL_TABS.find((t) => t.key === channel)?.label || channel} · 运行记录`}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        params={{ channel }}
        toolBarRender={() => [
          <span key="cost" style={{ color: 'rgba(0,0,0,0.65)' }}>
            本页通道累计费用：¥{costTotal}
          </span>,
        ]}
        request={async (params) => {
          const res = await request('/api/event-marketing/records', {
            params: {
              ...params,
              channel: params.channel,
              planName: params.planName,
              status: params.statusSearch !== '全部' ? params.statusSearch : undefined,
            },
          });
          setCostTotal(res.costTotal || '0.00');
          return res;
        }}
      />
    </PageContainer>
  );
};

export default RecordsPage;
