import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { message } from 'antd';
import React, { useRef } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type NodeRecord = {
  id: string;
  activityId: string;
  activityName: string;
  periodic: boolean;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: string;
  planAt: string;
  startAt: string;
  endAt: string;
};

const NodeRecordPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const columns: ProColumns<NodeRecord>[] = [
    { title: '活动ID', dataIndex: 'activityId', hideInTable: true },
    { title: '活动名称', dataIndex: 'activityName', hideInTable: true },
    {
      title: '是否周期活动',
      dataIndex: 'periodicSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: { 全部: { text: '全部' }, 是: { text: '是' }, 否: { text: '否' } },
    },
    { title: '节点ID', dataIndex: 'nodeIdSearch', hideInTable: true },
    { title: '节点名称', dataIndex: 'nodeNameSearch', hideInTable: true },
    {
      title: '节点类型',
      dataIndex: 'nodeTypeSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        开始: { text: '开始' },
        人群: { text: '人群' },
        触达: { text: '触达' },
        等待: { text: '等待' },
        结束: { text: '结束' },
      },
    },
    {
      title: '节点状态',
      dataIndex: 'nodeStatus',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        待执行: { text: '待执行' },
        执行中: { text: '执行中' },
        成功: { text: '成功' },
        失败: { text: '失败' },
        已跳过: { text: '已跳过' },
      },
    },
    {
      title: '节点计划时间',
      dataIndex: 'planAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '执行开始时间',
      dataIndex: 'startAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '执行结束时间',
      dataIndex: 'endAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '活动ID', dataIndex: 'activityId', search: false, width: 110 },
    { title: '活动名称', dataIndex: 'activityName', search: false },
    {
      title: '周期活动',
      dataIndex: 'periodic',
      search: false,
      width: 90,
      render: (_, row) => (row.periodic ? '是' : '否'),
    },
    { title: '节点ID', dataIndex: 'nodeId', search: false, width: 100 },
    { title: '节点名称', dataIndex: 'nodeName', search: false, width: 110 },
    { title: '节点类型', dataIndex: 'nodeType', search: false, width: 90 },
    { title: '节点状态', dataIndex: 'status', search: false, width: 90 },
    { title: '计划时间', dataIndex: 'planAt', search: false, width: 170 },
    { title: '开始时间', dataIndex: 'startAt', search: false, width: 170 },
    { title: '结束时间', dataIndex: 'endAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      search: false,
      render: () => [
        <a key="run" onClick={() => message.success('已触发执行（演示）')}>
          执行
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<NodeRecord>
        headerTitle="节点执行记录（近1个月）"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        request={async (params) =>
          request('/api/crowd-marketing/node-records', {
            params: {
              ...params,
              activityId: params.activityId,
              activityName: params.activityName,
              nodeStatus: params.nodeStatus,
            },
          })
        }
      />
    </PageContainer>
  );
};

export default NodeRecordPage;
