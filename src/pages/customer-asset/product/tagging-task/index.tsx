import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Modal, message } from 'antd';
import React, { useRef } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TaskItem = {
  id: string;
  tagName: string;
  status: string;
  startAt: string;
  creator: string;
  batchNo?: string;
};

const ProductTaggingTaskPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const columns: ProColumns<TaskItem>[] = [
    { title: '标签名称', dataIndex: 'tagNameSearch', hideInTable: true },
    {
      title: '任务执行状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        执行中: { text: '执行中' },
        已完成: { text: '已完成' },
        已终止: { text: '已终止' },
        待执行: { text: '待执行' },
      },
    },
    {
      title: '任务执行开始时间',
      dataIndex: 'startAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '导入批次', dataIndex: 'batchNoSearch', hideInTable: true },
    { title: '标签名称', dataIndex: 'tagName', search: false },
    {
      title: '任务状态',
      dataIndex: 'status',
      search: false,
      valueEnum: {
        执行中: { text: '执行中', status: 'Processing' },
        已完成: { text: '已完成', status: 'Success' },
        已终止: { text: '已终止', status: 'Default' },
        待执行: { text: '待执行', status: 'Warning' },
      },
    },
    { title: '执行开始时间', dataIndex: 'startAt', search: false },
    { title: '导入批次', dataIndex: 'batchNo', search: false, render: (v) => v || '--' },
    { title: '创建人', dataIndex: 'creator', search: false },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      render: (_, row) => [
        row.status === '执行中' || row.status === '待执行' ? (
          <a
            key="stop"
            onClick={() =>
              Modal.confirm({
                title: '确认终止任务？',
                onOk: () => {
                  message.success('已终止（演示）');
                  actionRef.current?.reload();
                },
              })
            }
          >
            终止
          </a>
        ) : null,
        <a
          key="del"
          onClick={() =>
            Modal.confirm({
              title: '确认删除任务？',
              onOk: () => {
                message.success('已删除（演示）');
                actionRef.current?.reload();
              },
            })
          }
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<TaskItem>
        headerTitle="商品打标任务"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        toolBarRender={() => [
          <a key="hint" onClick={() => message.info('仅展示近 3 个月任务')}>
            近 3 个月任务
          </a>,
        ]}
        request={async (params) =>
          request('/api/customer-asset/product-tagging-tasks', { params })
        }
      />
    </PageContainer>
  );
};

export default ProductTaggingTaskPage;
