import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import { Button, Form, Modal, Space, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { MenuTreeNode, OpPermission, SystemRole } from '@/utils/systemAdminStore';

const MENU_PREFIX = 'menu:';
const OP_PREFIX = 'op:';

/** 操作权限挂到对应业务菜单下，按菜单树顺序展示 */
const OPS_UNDER_MENU: Record<string, { key: OpPermission; title: string }[]> = {
  'tag-center': [{ key: 'tag.write', title: '标签规则写' }],
  crowd: [{ key: 'crowd.write', title: '人群写' }],
  'marketing-activity': [
    { key: 'activity.write', title: '活动写' },
    { key: 'activity.approve', title: '活动审批' },
    { key: 'activity.execute', title: '正式执行' },
  ],
  system: [{ key: 'system.manage', title: '系统管理操作' }],
};

function buildPermissionTree(menuTree: MenuTreeNode[]): DataNode[] {
  const walk = (nodes: MenuTreeNode[]): DataNode[] =>
    [...nodes]
      .filter((n) => !n.hideInMenu)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((n) => {
        const menuChildren = n.children?.length ? walk(n.children) : [];
        const opChildren: DataNode[] = (OPS_UNDER_MENU[n.key] || []).map((op) => ({
          key: `${OP_PREFIX}${op.key}`,
          title: op.title,
          isLeaf: true,
        }));
        const children = [...menuChildren, ...opChildren];
        return {
          key: `${MENU_PREFIX}${n.key}`,
          title: n.name,
          children: children.length ? children : undefined,
        };
      });
  return walk(menuTree);
}

function collectTreeKeys(nodes: DataNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: DataNode[]) => {
    list.forEach((n) => {
      keys.push(String(n.key));
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

function roleToCheckedKeys(role: Partial<SystemRole> | null): string[] {
  const menus = (role?.menus || []).map((m) => `${MENU_PREFIX}${m}`);
  const ops = (role?.operations || []).map((o) => `${OP_PREFIX}${o}`);
  return [...menus, ...ops];
}

function checkedKeysToRole(keys: React.Key[]) {
  const menus: string[] = [];
  const operations: OpPermission[] = [];
  keys.forEach((k) => {
    const key = String(k);
    if (key.startsWith(MENU_PREFIX)) menus.push(key.slice(MENU_PREFIX.length));
    if (key.startsWith(OP_PREFIX)) operations.push(key.slice(OP_PREFIX.length) as OpPermission);
  });
  return { menus, operations };
}

const SystemRolesPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const { initialState } = useModel('@@initialState');
  const actor = initialState?.currentUser?.username || 'demo';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRole | null>(null);
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const permissionTree = useMemo(() => buildPermissionTree(menuTree), [menuTree]);

  const loadMenuTree = async () => {
    const res = await request<{ data: { tree: MenuTreeNode[] } }>('/api/system/menus');
    setMenuTree(res.data?.tree || []);
  };

  useEffect(() => {
    loadMenuTree();
  }, []);

  const openModal = async (role: SystemRole | null) => {
    await loadMenuTree();
    setEditing(role);
    setCheckedKeys(roleToCheckedKeys(role));
    form.setFieldsValue({
      name: role?.name || '',
      description: role?.description || '',
    });
    setOpen(true);
  };

  const columns: ProColumns<SystemRole>[] = [
    { title: '角色名称', dataIndex: 'name', search: false },
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
    },
    { title: '说明', dataIndex: 'description', search: false, ellipsis: true },
    {
      title: '菜单权限数',
      dataIndex: 'menus',
      search: false,
      width: 120,
      render: (_, row) => row.menus?.length || 0,
    },
    {
      title: '操作权限数',
      dataIndex: 'operations',
      search: false,
      width: 120,
      render: (_, row) => row.operations?.length || 0,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      render: (_, row) => [
        <a key="edit" onClick={() => openModal(row)}>
          编辑
        </a>,
        <a
          key="del"
          onClick={() => {
            Modal.confirm({
              title: `删除角色「${row.name}」？`,
              content: '若仍有用户绑定该角色将无法删除。',
              onOk: async () => {
                const res = await request<{ success: boolean; errorMessage?: string }>(
                  `/api/system/roles/${row.id}`,
                  { method: 'DELETE', data: { actor } },
                );
                if (res?.success === false) {
                  message.error(res.errorMessage || '删除失败');
                  return;
                }
                message.success('已删除角色');
                actionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<SystemRole>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={listSearchProps}
        pagination={listPagination as any}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={() => openModal(null)}>
            新建角色
          </Button>,
        ]}
        request={async (params) => {
          const res = await request<{ data: SystemRole[] }>('/api/system/roles');
          let list = res.data || [];
          const kw = String(params.keyword || '').trim();
          if (kw) {
            list = list.filter(
              (r) => r.name.includes(kw) || (r.description || '').includes(kw),
            );
          }
          return {
            data: list,
            total: list.length,
            success: true,
          };
        }}
      />

      <ModalForm
        form={form}
        title={editing ? '编辑角色' : '新建角色'}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditing(null);
            setCheckedKeys([]);
          }
        }}
        modalProps={{ destroyOnHidden: true, width: 640 }}
        onFinish={async (values) => {
          const { menus, operations } = checkedKeysToRole(checkedKeys);
          const payload = { ...values, menus, operations, actor };
          if (editing) {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              `/api/system/roles/${editing.id}`,
              { method: 'PUT', data: payload },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '保存失败');
              return false;
            }
            message.success('角色已更新（相关用户重新登录后权限完全生效）');
          } else {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              '/api/system/roles',
              { method: 'POST', data: payload },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '创建失败');
              return false;
            }
            message.success('已创建角色');
          }
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="角色名称" rules={[{ required: true }]} />
        <ProFormTextArea name="description" label="说明" fieldProps={{ rows: 2 }} />
        <Form.Item
          label="菜单与操作权限"
          extra="按侧栏菜单顺序展示；勾选父级可联动子级。叶子节点中带「写/审批/执行」的为操作权限。"
        >
          <Space style={{ marginBottom: 8 }}>
            <Button
              size="small"
              onClick={() => setCheckedKeys(collectTreeKeys(permissionTree))}
            >
              全选
            </Button>
            <Button
              size="small"
              onClick={() => {
                const all = collectTreeKeys(permissionTree);
                const set = new Set(checkedKeys.map(String));
                setCheckedKeys(all.filter((k) => !set.has(k)));
              }}
            >
              反选
            </Button>
            <Button size="small" onClick={() => setCheckedKeys([])}>
              清空
            </Button>
          </Space>
          <div
            style={{
              maxHeight: 360,
              overflow: 'auto',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <Tree
              checkable
              defaultExpandAll
              treeData={permissionTree}
              checkedKeys={checkedKeys}
              onCheck={(keys) => {
                const next = Array.isArray(keys) ? keys : keys.checked;
                setCheckedKeys(next);
              }}
            />
          </div>
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
};

export default SystemRolesPage;
