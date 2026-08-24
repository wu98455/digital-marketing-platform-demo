import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import { Button, Modal, Space, Switch, Tag, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listSearchProps } from '@/utils/listSearch';
import type { MenuTreeNode } from '@/utils/systemAdminStore';
import styles from './index.less';

type MenuRow = MenuTreeNode & { children?: MenuRow[] };

const ICON_OPTIONS = [
  'HomeOutlined',
  'TagsOutlined',
  'UsergroupAddOutlined',
  'NotificationOutlined',
  'SettingOutlined',
  'TeamOutlined',
  'AppstoreOutlined',
  'LinkOutlined',
  'FileTextOutlined',
  'ApartmentOutlined',
];

const flattenOptions = (
  nodes: MenuRow[],
  depth = 0,
): { label: string; value: string }[] => {
  const out: { label: string; value: string }[] = [];
  nodes.forEach((n) => {
    out.push({ label: `${'　'.repeat(depth)}${n.name}`, value: n.key });
    if (n.children?.length) out.push(...flattenOptions(n.children, depth + 1));
  });
  return out;
};

function filterMenuTree(
  nodes: MenuRow[],
  filters: { name?: string; path?: string; visible?: string; kind?: string },
): MenuRow[] {
  const name = String(filters.name || '').trim();
  const path = String(filters.path || '').trim();
  const visible = filters.visible;
  const kind = filters.kind;

  const walk = (list: MenuRow[]): MenuRow[] =>
    list
      .map((n) => {
        const children = n.children?.length ? walk(n.children) : undefined;
        const nameOk = !name || n.name.includes(name);
        const pathOk = !path || (n.path || '').includes(path);
        const visibleOk =
          !visible ||
          visible === '全部' ||
          (visible === '显示' ? !n.hideInMenu : !!n.hideInMenu);
        const kindOk =
          !kind ||
          kind === '全部' ||
          (kind === '内置' ? !!n.builtin : !n.builtin);
        const selfHit = nameOk && pathOk && visibleOk && kindOk;
        if (selfHit || children?.length) {
          return { ...n, children };
        }
        return null;
      })
      .filter(Boolean) as MenuRow[];

  return walk(nodes);
}

const SystemMenusPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const actor = initialState?.currentUser?.username || 'demo';
  const [tree, setTree] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<MenuRow | null>(null);
  const [defaultParentKey, setDefaultParentKey] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ data: { tree: MenuRow[] } }>('/api/system/menus');
      setTree(res.data?.tree || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parentOptions = useMemo(
    () => [{ label: '（顶级菜单）', value: '' }, ...flattenOptions(tree)],
    [tree],
  );

  const openCreate = (parentKey?: string) => {
    setMode('create');
    setEditing(null);
    setDefaultParentKey(parentKey);
    setOpen(true);
  };

  const openEdit = (row: MenuRow) => {
    setMode('edit');
    setEditing(row);
    setDefaultParentKey(undefined);
    setOpen(true);
  };

  const remove = (row: MenuRow) => {
    Modal.confirm({
      title: `删除菜单「${row.name}」？`,
      content: row.children?.length
        ? '将同时删除其下所有子菜单。重置默认可恢复内置菜单。'
        : '重置默认可恢复内置菜单。',
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string; data?: { tree: MenuRow[] } }>(
          `/api/system/menus/${encodeURIComponent(row.key)}`,
          { method: 'DELETE', data: { actor } },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '删除失败');
          return;
        }
        message.success('已删除');
        setTree(res.data?.tree || []);
        await load();
      },
    });
  };

  const reset = async () => {
    Modal.confirm({
      title: '恢复默认菜单树？',
      content: '自定义菜单将被清除，名称/显隐等改动也会还原。',
      onOk: async () => {
        await request('/api/system/menus/reset', { method: 'POST', data: { actor } });
        message.success('已恢复默认菜单，刷新页面后侧栏同步');
        await load();
      },
    });
  };

  const columns: ProColumns<MenuRow>[] = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      fieldProps: { placeholder: '菜单名称' },
      render: (_, row) => (
        <span className={styles.menuName}>
          {row.name}
          {row.builtin ? (
            <Tag style={{ marginLeft: 8 }} color="blue">
              内置
            </Tag>
          ) : (
            <Tag style={{ marginLeft: 8 }}>自定义</Tag>
          )}
        </span>
      ),
    },
    {
      title: '路径',
      dataIndex: 'path',
      width: 220,
      ellipsis: true,
      fieldProps: { placeholder: '路径关键词' },
      render: (_, row) => row.path || <span className={styles.muted}>（目录）</span>,
    },
    {
      title: '显示',
      dataIndex: 'visible',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        显示: { text: '显示' },
        隐藏: { text: '隐藏' },
      },
    },
    {
      title: '类型',
      dataIndex: 'kind',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        内置: { text: '内置' },
        自定义: { text: '自定义' },
      },
    },
    {
      title: '图标',
      dataIndex: 'icon',
      width: 160,
      search: false,
      render: (_, row) => row.icon || '-',
    },
    {
      title: '排序',
      dataIndex: 'order',
      width: 80,
      search: false,
    },
    {
      title: '显示',
      dataIndex: 'hideInMenu',
      width: 90,
      search: false,
      render: (_, row) => (
        <Switch
          checked={!row.hideInMenu}
          onChange={async (checked) => {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              `/api/system/menus/${encodeURIComponent(row.key)}`,
              {
                method: 'PUT',
                data: {
                  name: row.name,
                  path: row.path,
                  icon: row.icon,
                  order: row.order,
                  hideInMenu: !checked,
                  actor,
                },
              },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '更新失败');
              return;
            }
            message.success(checked ? '已显示' : '已隐藏');
            await load();
          }}
        />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      search: false,
      render: (_, row) => (
        <Space>
          <a onClick={() => openEdit(row)}>编辑</a>
          <a onClick={() => openCreate(row.key)}>新增子级</a>
          <a onClick={() => remove(row)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.menuTreeTable}>
        <ProTable<MenuRow>
          rowKey="key"
          search={listSearchProps}
          pagination={false}
          loading={loading}
          columns={columns}
          expandable={{ defaultExpandAllRows: true }}
          indentSize={24}
          params={{ treeLen: tree.length }}
          toolBarRender={() => [
            <Button key="reset" onClick={reset}>
              重置默认
            </Button>,
            <Button key="add" type="primary" onClick={() => openCreate()}>
              新建菜单
            </Button>,
          ]}
          request={async (params) => {
            const data = filterMenuTree(tree, {
              name: params.name,
              path: params.path,
              visible: params.visible,
              kind: params.kind,
            });
            return { data, success: true, total: data.length };
          }}
        />
      </div>

      <ModalForm
        title={mode === 'edit' ? '编辑菜单' : '新建菜单'}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditing(null);
            setDefaultParentKey(undefined);
          }
        }}
        modalProps={{ destroyOnHidden: true, width: 560 }}
        initialValues={
          mode === 'edit' && editing
            ? {
                name: editing.name,
                path: editing.path,
                icon: editing.icon,
                order: editing.order ?? 0,
                hideInMenu: !!editing.hideInMenu,
              }
            : {
                parentKey: defaultParentKey || '',
                name: '',
                path: '',
                icon: undefined,
                order: 99,
                hideInMenu: false,
              }
        }
        onFinish={async (values) => {
          if (mode === 'edit' && editing) {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              `/api/system/menus/${encodeURIComponent(editing.key)}`,
              {
                method: 'PUT',
                data: {
                  name: values.name,
                  path: values.path,
                  icon: values.icon,
                  order: values.order,
                  hideInMenu: values.hideInMenu,
                  actor,
                },
              },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '保存失败');
              return false;
            }
            message.success('已更新菜单（刷新后侧栏同步）');
          } else {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              '/api/system/menus',
              {
                method: 'POST',
                data: {
                  parentKey: values.parentKey || null,
                  name: values.name,
                  path: values.path,
                  icon: values.icon,
                  order: values.order,
                  hideInMenu: values.hideInMenu,
                  actor,
                },
              },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '创建失败');
              return false;
            }
            message.success('已新增菜单');
          }
          await load();
          return true;
        }}
      >
        {mode === 'create' && (
          <ProFormSelect
            name="parentKey"
            label="上级菜单"
            options={parentOptions}
            fieldProps={{ allowClear: true }}
          />
        )}
        <ProFormText name="name" label="菜单名称" rules={[{ required: true }]} />
        <ProFormText
          name="path"
          label="路径"
          disabled={mode === 'edit' && !!editing?.builtin}
          placeholder="如 /welcome 或 https://example.com；目录可留空"
          extra={
            mode === 'edit' && editing?.builtin
              ? '内置菜单路径只读'
              : '自定义菜单可填业务路径或外链'
          }
        />
        <ProFormSelect
          name="icon"
          label="图标"
          options={ICON_OPTIONS.map((x) => ({ label: x, value: x }))}
          fieldProps={{ allowClear: true, showSearch: true }}
        />
        <ProFormDigit name="order" label="排序" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSwitch name="hideInMenu" label="隐藏（侧栏不展示）" />
      </ModalForm>
    </PageContainer>
  );
};

export default SystemMenusPage;
