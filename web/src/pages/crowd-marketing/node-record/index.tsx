import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Space, Tag, Tooltip, Typography } from 'antd';
import React, { useRef } from 'react';
import CenterTags from '@/components/CenterTags';
import { MARKETING_CENTERS } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type ActivityExecRecord = {
  id: string;
  activityId: string;
  activityName: string;
  periodic: boolean;
  status: string;
  startAt: string;
  endAt: string;
  targetCount: number;
  reachSuccess: number;
  reachFail: number;
  centers?: string[];
};

const statusColor: Record<string, string> = {
  待执行: 'default',
  执行中: 'processing',
  成功: 'success',
  失败: 'error',
  部分成功: 'warning',
};

const ActivityExecRecordPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const columns: ProColumns<ActivityExecRecord>[] = [
    { title: '活动名称', dataIndex: 'activityName', hideInTable: true },
    {
      title: '执行状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        待执行: { text: '待执行' },
        执行中: { text: '执行中' },
        成功: { text: '成功' },
        失败: { text: '失败' },
        部分成功: { text: '部分成功' },
      },
    },
    {
      title: '是否周期活动',
      dataIndex: 'periodicSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: { 全部: { text: '全部' }, 是: { text: '是' }, 否: { text: '否' } },
    },
    {
      title: '分中心',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
    },
    {
      title: '开始时间',
      dataIndex: 'startAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 56,
      search: false,
    },
    {
      title: '活动名称',
      dataIndex: 'activityName',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, row) => (
        <Tooltip title={`活动ID：${row.activityId}`}>
          <span>{row.activityName}</span>
        </Tooltip>
      ),
    },
    {
      title: '周期活动',
      dataIndex: 'periodic',
      search: false,
      width: 90,
      render: (_, row) => (row.periodic ? <Tag>是</Tag> : <Tag>否</Tag>),
    },
    {
      title: '执行状态',
      dataIndex: 'status',
      search: false,
      width: 100,
      render: (_, row) => <Tag color={statusColor[row.status] || 'default'}>{row.status}</Tag>,
    },
    {
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 180,
      render: (_, row) => {
        const n = Number(String(row.activityId).replace(/\D/g, '') || 0);
        const fallback = [MARKETING_CENTERS[n % MARKETING_CENTERS.length]];
        return <CenterTags centers={row.centers?.length ? row.centers : fallback} />;
      },
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      search: false,
      width: 170,
      render: (_, row) => row.startAt || '-',
    },
    {
      title: '结束时间',
      dataIndex: 'endAt',
      search: false,
      width: 170,
      render: (_, row) => row.endAt || '-',
    },
    {
      title: '目标人数',
      dataIndex: 'targetCount',
      search: false,
      width: 100,
    },
    {
      title: '触达成功',
      dataIndex: 'reachSuccess',
      search: false,
      width: 100,
    },
    {
      title: '触达失败',
      dataIndex: 'reachFail',
      search: false,
      width: 100,
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 100,
      fixed: 'right',
      render: (_, row) => {
        const canView = ['成功', '失败', '部分成功', '执行中'].includes(row.status);
        if (!canView) {
          return <Typography.Text type="secondary">—</Typography.Text>;
        }
        return (
          <Space size={8}>
            <a
              onClick={() =>
                history.push(`/crowd-marketing/node-record/result/${row.id}`)
              }
            >
              执行结果
            </a>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<ActivityExecRecord>
        headerTitle="活动执行记录（近1个月）"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination as any}
        scroll={{ x: 1300 }}
        request={async (params) => {
          const range = params.startAtRange as string[] | undefined;
          return request('/api/crowd-marketing/node-records', {
            params: {
              current: params.current,
              pageSize: params.pageSize,
              activityName: params.activityName,
              status: params.statusSearch,
              periodic:
                params.periodicSearch && params.periodicSearch !== '全部'
                  ? params.periodicSearch
                  : undefined,
              center: params.centerSearch,
              startAtRange: range?.length === 2 ? range.join(',') : undefined,
            },
          });
        }}
      />
    </PageContainer>
  );
};

export default ActivityExecRecordPage;
