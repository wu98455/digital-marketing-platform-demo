import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Modal, Space, Switch, Tag, message } from 'antd';
import React, { useRef } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { TagRule } from '@/utils/tagRuleTypes';

const RulesListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const runRule = async (row: TagRule) => {
    const res = await request<{ success: boolean; errorMessage?: string; data?: { count: number } }>(
      `/api/tag-center/rules/${row.id}/run`,
      { method: 'POST' },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '执行失败');
      return;
    }
    message.success(`已执行打标，覆盖 ${res.data?.count ?? 0} 人`);
    actionRef.current?.reload();
  };

  const createCrowd = async (row: TagRule) => {
    const res = await request<{ success: boolean; data?: { id: string; name: string } }>(
      '/api/tag-center/tags/create-crowd',
      {
        method: 'POST',
        data: {
          group: row.targetTag.group,
          tag: row.targetTag.tag,
          name: `${row.name}-人群`,
          ruleId: row.id,
        },
      },
    );
    if (res?.success === false) {
      message.error('生成人群失败');
      return;
    }
    message.success(`已生成目标人群「${res.data?.name}」`);
    history.push('/crowd');
  };

  const columns: ProColumns<TagRule>[] = [
    { title: '规则名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '状态',
      dataIndex: 'enabledSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        true: { text: '启用' },
        false: { text: '停用' },
      },
    },
    { title: '规则ID', dataIndex: 'id', search: false, width: 110 },
    { title: '规则名称', dataIndex: 'name', search: false, width: 180, ellipsis: true },
    {
      title: '目标标签',
      search: false,
      width: 160,
      render: (_, row) => (
        <Tag color="blue">
          {row.targetTag.group} · {row.targetTag.tag}
        </Tag>
      ),
    },
    {
      title: '最近覆盖',
      dataIndex: 'lastRunCount',
      search: false,
      width: 100,
      render: (_, row) => row.lastRunCount ?? '-',
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      search: false,
      width: 80,
      render: (_, row) => (
        <Switch
          checked={row.enabled}
          size="small"
          onChange={async (checked) => {
            await request(`/api/tag-center/rules/${row.id}`, {
              method: 'PUT',
              data: { enabled: checked },
            });
            message.success(checked ? '已启用' : '已停用');
            actionRef.current?.reload();
          }}
        />
      ),
    },
    { title: '最近执行', dataIndex: 'lastRunAt', search: false, width: 170 },
    { title: '更新时间', dataIndex: 'updatedAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      fixed: 'right',
      render: (_, row) => (
        <Space size={8} wrap>
          <a onClick={() => runRule(row)}>执行打标</a>
          <a onClick={() => history.push(`/tag-center/rules/edit/${row.id}`)}>编辑</a>
          <a onClick={() => createCrowd(row)}>生成目标人群</a>
          <a
            style={{ color: '#ff4d4f' }}
            onClick={() => {
              Modal.confirm({
                title: `删除规则「${row.name}」？`,
                onOk: async () => {
                  await request(`/api/tag-center/rules/${row.id}`, { method: 'DELETE' });
                  message.success('已删除');
                  actionRef.current?.reload();
                },
              });
            }}
          >
            删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<TagRule>
        headerTitle="打标规则"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        scroll={{ x: 1100 }}
        toolBarRender={() => [
          <Button key="new" type="primary" onClick={() => history.push('/tag-center/rules/create')}>
            新建规则
          </Button>,
        ]}
        request={async (params) =>
          request('/api/tag-center/rules', {
            params: {
              ...params,
              keyword: params.keyword,
              enabled:
                params.enabledSearch && params.enabledSearch !== '全部'
                  ? params.enabledSearch
                  : undefined,
            },
          })
        }
      />
    </PageContainer>
  );
};

export default RulesListPage;
