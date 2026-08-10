import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import React from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { AuditLog } from '@/utils/systemAdminStore';

const SystemAuditPage: React.FC = () => {
  const columns: ProColumns<AuditLog>[] = [
    { title: '关键词', dataIndex: 'keyword', hideInTable: true },
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
      width: '18%',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'at',
      search: false,
      width: '24%',
      ellipsis: true,
    },
    {
      title: '动作',
      dataIndex: 'action',
      search: false,
      width: '18%',
      ellipsis: true,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      search: false,
      width: '32%',
      ellipsis: true,
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<AuditLog>
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination as any}
        tableLayout="fixed"
        request={async (params) =>
          request('/api/system/audit-logs', {
            params: {
              ...params,
              keyword: params.keyword,
              actor: params.actor,
            },
          })
        }
      />
    </PageContainer>
  );
};

export default SystemAuditPage;
