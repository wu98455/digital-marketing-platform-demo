import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import { Button, Modal, Space, Tag, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { SystemUser } from '@/utils/systemAdminStore';

const SystemUsersPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const { initialState } = useModel('@@initialState');
  const actor = (initialState?.currentUser as any)?.username || 'demo';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

  const loadOptions = async () => {
    const [usersRes, rolesRes] = await Promise.all([
      request<{ data: SystemUser[] }>('/api/system/users', { params: { current: 1, pageSize: 200 } }),
      request<{ data: { id: string; name: string }[] }>('/api/system/roles', {
        params: { current: 1, pageSize: 200 },
      }),
    ]);
    setUserOptions(
      (usersRes.data || [])
        .filter((u) => u.status === '启用')
        .map((u) => ({ label: `${u.name}（${u.username}）`, value: u.username })),
    );
    setRoleOptions((rolesRes.data || []).map((r) => ({ label: r.name, value: r.id })));
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const toggleStatus = (row: SystemUser) => {
    const nextStatus = row.status === '启用' ? '停用' : '启用';
    Modal.confirm({
      title: `${nextStatus}账号「${row.username}」？`,
      content: nextStatus === '停用' ? '停用后该账号将无法登录。' : '启用后可正常登录系统。',
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string }>(
          `/api/system/users/${row.id}`,
          { method: 'PUT', data: { ...row, status: nextStatus, actor } },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '操作失败');
          return;
        }
        message.success(`已${nextStatus}`);
        await loadOptions();
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<SystemUser>[] = useMemo(
    () => [
      {
        title: '账号/姓名',
        dataIndex: 'keyword',
        hideInTable: true,
        fieldProps: { placeholder: '账号或姓名' },
      },
      {
        title: '状态',
        dataIndex: 'status',
        hideInTable: true,
        valueType: 'select',
        valueEnum: { 全部: { text: '全部' }, 启用: { text: '启用' }, 停用: { text: '停用' } },
        initialValue: '全部',
      },
      {
        title: '角色',
        dataIndex: 'roleId',
        hideInTable: true,
        valueType: 'select',
        fieldProps: { options: [{ label: '全部', value: '全部' }, ...roleOptions] },
        initialValue: '全部',
      },
      { title: '账号', dataIndex: 'username', search: false, width: 120 },
      { title: '姓名', dataIndex: 'name', search: false, width: 120 },
      {
        title: '角色',
        dataIndex: 'roleId',
        search: false,
        width: 140,
        render: (_, row) => roleOptions.find((r) => r.value === row.roleId)?.label || row.roleId,
      },
      {
        title: '状态',
        dataIndex: 'status',
        search: false,
        width: 80,
        render: (_, row) => (
          <Tag color={row.status === '启用' ? 'success' : 'default'}>{row.status}</Tag>
        ),
      },
      {
        title: '我的活动审批人',
        dataIndex: 'approverIds',
        search: false,
        ellipsis: true,
        render: (_, row) => (row.approverIds || []).join('、') || '-',
      },
      {
        title: '允许自审',
        dataIndex: 'allowSelfApprove',
        search: false,
        width: 90,
        render: (_, row) => (row.allowSelfApprove ? '是' : '否'),
      },
      { title: '最近登录', dataIndex: 'lastLoginAt', search: false, width: 170 },
      {
        title: '操作',
        valueType: 'option',
        width: 220,
        render: (_, row) => [
          <a
            key="edit"
            onClick={() => {
              setEditing(row);
              setOpen(true);
            }}
          >
            编辑
          </a>,
          <a key="status" onClick={() => toggleStatus(row)}>
            {row.status === '启用' ? '停用' : '启用'}
          </a>,
          <a
            key="reset"
            onClick={() => {
              Modal.confirm({
                title: `重置「${row.username}」密码？`,
                content: '密码将重置为 123456。',
                onOk: async () => {
                  await request(`/api/system/users/${row.id}/reset-password`, {
                    method: 'POST',
                    data: { password: '123456', actor },
                  });
                  message.success('已重置密码为 123456');
                },
              });
            }}
          >
            重置密码
          </a>,
          <a
            key="del"
            onClick={() => {
              Modal.confirm({
                title: `删除用户「${row.username}」？`,
                content: '删除后不可恢复；内置账号不可删。',
                okButtonProps: { danger: true },
                onOk: async () => {
                  const res = await request<{ success: boolean; errorMessage?: string }>(
                    `/api/system/users/${row.id}`,
                    { method: 'DELETE', data: { actor } },
                  );
                  if (res?.success === false) {
                    message.error(res.errorMessage || '删除失败');
                    return;
                  }
                  message.success('已删除');
                  await loadOptions();
                  actionRef.current?.reload();
                },
              });
            }}
          >
            删除
          </a>,
        ],
      },
    ],
    [actor, roleOptions],
  );

  return (
    <PageContainer title={false}>
      <ProTable<SystemUser>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={listSearchProps}
        pagination={listPagination as any}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            新建用户
          </Button>,
        ]}
        request={async (params) =>
          request('/api/system/users', {
            params: {
              ...params,
              keyword: params.keyword,
              status: params.status,
              roleId: params.roleId,
            },
          })
        }
      />

      <ModalForm
        title={editing ? '编辑用户' : '新建用户'}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        modalProps={{ destroyOnHidden: true, width: 640 }}
        initialValues={
          editing
            ? {
                ...editing,
                password: undefined,
              }
            : {
                status: '启用',
                roleId: 'marketer',
                allowSelfApprove: false,
                approverIds: [],
                password: '123456',
              }
        }
        onFinish={async (values) => {
          if (editing) {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              `/api/system/users/${editing.id}`,
              { method: 'PUT', data: { ...values, actor } },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '保存失败');
              return false;
            }
            message.success('已更新用户');
          } else {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              '/api/system/users',
              { method: 'POST', data: { ...values, actor } },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '创建失败');
              return false;
            }
            message.success('已创建用户');
          }
          await loadOptions();
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="username"
          label="账号"
          disabled={!!editing}
          rules={[{ required: true, message: '请输入账号' }]}
        />
        <ProFormText name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]} />
        {!editing && (
          <ProFormText.Password name="password" label="密码" rules={[{ required: true }]} />
        )}
        <ProFormSelect
          name="roleId"
          label="角色"
          options={roleOptions}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: '启用' },
            { label: '停用', value: '停用' },
          ]}
        />
        <ProFormSelect
          name="approverIds"
          label="我的活动审批人"
          mode="multiple"
          options={userOptions.filter((o) => !editing || o.value !== editing.username)}
          placeholder="多选：谁可以审批该账号创建的活动"
          extra="创建/提交营销活动时，只能从这份名单中选择审批人"
        />
        <ProFormSwitch
          name="allowSelfApprove"
          label="是否允许自己审批"
          extra="开启后可将本人加入可选审批人（仍须提交并通过）"
        />
        <Space style={{ marginBottom: 12 }}>
          <Tag color="blue">演示提示</Tag>
          <span style={{ color: 'rgba(0,0,0,0.45)' }}>
            三角色账号：demo / tagger / marketer，密码均为 123456
          </span>
        </Space>
      </ModalForm>
    </PageContainer>
  );
};

export default SystemUsersPage;
