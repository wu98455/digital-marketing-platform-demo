import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, message } from 'antd';
import React, { useRef } from 'react';
import CenterTags from '@/components/CenterTags';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { AuditLog } from '@/utils/systemAdminStore';

function downloadCsv(filename: string, rows: AuditLog[]) {
  const header = ['时间', '操作人', '动作', '分中心', '详情'];
  const lines = rows.map((r) =>
    [r.at, r.actor, r.action, (r.centers || []).join('、'), r.detail || '']
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = `\uFEFF${[header.join(','), ...lines].join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SystemAuditPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const lastQuery = useRef<Record<string, any>>({});

  const columns: ProColumns<AuditLog>[] = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '动作 / 详情' },
    },
    {
      title: '操作人',
      dataIndex: 'actor',
      hideInTable: true,
      fieldProps: { placeholder: '操作人账号' },
    },
    {
      title: '动作',
      dataIndex: 'actionSearch',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { allowClear: true, showSearch: true },
      valueEnum: {
        登录: { text: '登录' },
        新建用户: { text: '新建用户' },
        编辑用户: { text: '编辑用户' },
        删除用户: { text: '删除用户' },
        重置密码: { text: '重置密码' },
        新建角色: { text: '新建角色' },
        编辑角色: { text: '编辑角色' },
        删除角色: { text: '删除角色' },
        复制角色: { text: '复制角色' },
        新增菜单: { text: '新增菜单' },
        更新菜单: { text: '更新菜单' },
        删除菜单: { text: '删除菜单' },
        创建活动: { text: '创建活动' },
        审批通过: { text: '审批通过' },
        审批驳回: { text: '审批驳回' },
        正式执行: { text: '正式执行' },
      },
    },
    {
      title: '时间',
      dataIndex: 'atRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '序号',
      dataIndex: 'index',
      valueType: 'index',
      search: false,
      width: 72,
      align: 'center',
    },
    {
      title: '操作人',
      dataIndex: 'actor',
      search: false,
      width: '14%',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'at',
      search: false,
      width: '20%',
      ellipsis: true,
    },
    {
      title: '动作',
      dataIndex: 'action',
      search: false,
      width: '14%',
      ellipsis: true,
    },
    {
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: '18%',
      render: (_, row) => <CenterTags centers={row.centers} />,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      search: false,
      width: '26%',
      ellipsis: true,
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<AuditLog>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={listSearchProps}
        pagination={listPagination as any}
        tableLayout="fixed"
        toolBarRender={() => [
          <Button
            key="export"
            onClick={async () => {
              const range = lastQuery.current.atRange as string[] | undefined;
              const res = await request<{ data: AuditLog[] }>('/api/system/audit-logs', {
                params: {
                  ...lastQuery.current,
                  keyword: lastQuery.current.keyword,
                  actor: lastQuery.current.actor,
                  action: lastQuery.current.actionSearch,
                  atRange: range?.length === 2 ? range.join(',') : lastQuery.current.atRange,
                  current: 1,
                  pageSize: 500,
                },
              });
              const rows = res.data || [];
              if (!rows.length) {
                message.warning('当前筛选下无数据可导出');
                return;
              }
              downloadCsv(`操作日志-${new Date().toISOString().slice(0, 10)}.csv`, rows);
              message.success(`已导出 ${rows.length} 条`);
            }}
          >
            导出
          </Button>,
        ]}
        request={async (params) => {
          lastQuery.current = params;
          const range = params.atRange as string[] | undefined;
          return request('/api/system/audit-logs', {
            params: {
              ...params,
              keyword: params.keyword,
              actor: params.actor,
              action: params.actionSearch,
              atRange: range?.length === 2 ? range.join(',') : undefined,
            },
          });
        }}
      />
    </PageContainer>
  );
};

export default SystemAuditPage;
