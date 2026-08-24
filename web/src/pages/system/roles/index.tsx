import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import { Button, Checkbox, Form, Modal, Space, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import { CENTER_OPTIONS, MARKETING_CENTERS } from '@/utils/centers';
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
  const [centers, setCenters] = useState<string[]>([]);
  const [treeExpanded, setTreeExpanded] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
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
    setCenters(role?.centers?.length ? [...role.centers] : [...MARKETING_CENTERS]);
    setTreeExpanded(false);
    setExpandedKeys([]);
    form.setFieldsValue({
      name: role?.name || '',
      description: role?.description || '',
    });
    setOpen(true);
  };

  const columns: ProColumns<SystemRole>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      hideInTable: true,
      fieldProps: { placeholder: '名称或说明' },
    },
    {
      title: '分中心',
      dataIndex: 'center',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        ...Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
      },
    },
    { title: '角色名称', dataIndex: 'name', search: false, width: 160 },
    { title: '说明', dataIndex: 'description', search: false, ellipsis: true },
    {
      title: '菜单权限数',
      dataIndex: 'menus',
      search: false,
      width: 110,
      render: (_, row) => row.menus?.length || 0,
    },
    {
      title: '分中心',
      dataIndex: 'centerNames',
      search: false,
      ellipsis: true,
      render: (_, row) => (row.centers || []).join('、') || '--',
    },
    {
      title: '操作权限数',
      dataIndex: 'operations',
      search: false,
      width: 110,
      render: (_, row) => row.operations?.length || 0,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, row) => [
        <a key="edit" onClick={() => openModal(row)}>
          编辑
        </a>,
        <a
          key="copy"
          onClick={() => {
            Modal.confirm({
              title: `复制角色「${row.name}」？`,
              content: '将生成同名权限的副本，可再编辑调整。',
              onOk: async () => {
                const res = await request<{ success: boolean; errorMessage?: string }>(
                  `/api/system/roles/${row.id}/copy`,
                  { method: 'POST', data: { actor } },
                );
                if (res?.success === false) {
                  message.error(res.errorMessage || '复制失败');
                  return;
                }
                message.success('已复制角色');
                actionRef.current?.reload();
              },
            });
          }}
        >
          复制
        </a>,
        <a
          key="del"
          onClick={() => {
            Modal.confirm({
              title: `删除角色「${row.name}」？`,
              content: '内置角色不可删；若仍有用户绑定将无法删除。',
              okButtonProps: { danger: true },
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
        request={async (params) =>
          request('/api/system/roles', {
            params: {
              name: params.name,
              center: params.center,
              current: params.current,
              pageSize: params.pageSize,
            },
          })
        }
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
            setCenters([]);
          }
        }}
        modalProps={{
          destroyOnHidden: true,
          width: 640,
          /** 不用 centered，改用 top:48 + max-height，保证上下外边距各约 48px */
          centered: false,
          className: 'role-edit-modal',
          style: { top: 48 },
        }}
        onFinish={async (values) => {
          const { menus, operations } = checkedKeysToRole(checkedKeys);
          if (!centers.length) {
            message.error('请至少选择一个分中心（数据权限）');
            return false;
          }
          const payload = { ...values, menus, operations, centers, actor };
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
          label="数据权限 · 分中心"
          required
          extra="控制可查看/选用的源数据范围；业务单据上的分中心选项也来自此处。"
        >
          <Checkbox.Group
            options={CENTER_OPTIONS}
            value={centers}
            onChange={(v) => setCenters(v as string[])}
          />
        </Form.Item>
        <Form.Item
          label="菜单与操作权限"
          extra="按侧栏菜单顺序展示；勾选父级可联动子级。叶子节点中带「写/审批/执行」的为操作权限。"
        >
          <Space style={{ marginBottom: 8 }} wrap>
            <Checkbox
              checked={treeExpanded}
              onChange={(e) => {
                const checked = e.target.checked;
                setTreeExpanded(checked);
                setExpandedKeys(checked ? collectTreeKeys(permissionTree) : []);
              }}
            >
              展开全部菜单树
            </Checkbox>
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
          <div className="role-perm-tree-scroll">
            <Tree
              checkable
              treeData={permissionTree}
              checkedKeys={checkedKeys}
              expandedKeys={expandedKeys}
              onExpand={(keys) => {
                setExpandedKeys(keys);
                setTreeExpanded(keys.length > 0);
              }}
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
