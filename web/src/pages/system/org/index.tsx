import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import {
  ApartmentOutlined,
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { request, useModel } from '@umijs/max';
import { Button, Dropdown, Empty, Input, Modal, Space, Tag, Tooltip, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { OrgNodeType, OrgPerson, OrgTreeNode } from '@/utils/systemAdminStore';
import styles from './index.less';

type PersonRow = OrgPerson;
type TreeNodeData = DataNode & { orgType?: OrgNodeType };

/** 仅当文字被省略时才展示 Tooltip */
const EllipsisTooltip: React.FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      title={title}
      placement="topLeft"
      mouseEnterDelay={0.3}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpen(false);
          return;
        }
        const el = ref.current;
        const truncated = !!el && el.scrollWidth > el.clientWidth + 1;
        setOpen(truncated);
      }}
    >
      <span ref={ref} className={className}>
        {title}
      </span>
    </Tooltip>
  );
};

function toTreeData(nodes: OrgTreeNode[]): TreeNodeData[] {
  return nodes.map((n) => {
    const children = n.children?.length ? toTreeData(n.children) : undefined;
    return {
      key: n.key,
      title: n.title,
      orgType: n.type,
      isLeaf: n.type === '部门' && !children?.length,
      children,
    };
  });
}

function collectKeys(nodes: OrgTreeNode[]): React.Key[] {
  const keys: React.Key[] = [];
  const walk = (list: OrgTreeNode[]) => {
    list.forEach((n) => {
      keys.push(n.key);
      if (n.children?.length) walk(n.children);
    });
  };
  walk(nodes);
  return keys;
}

function findNode(nodes: OrgTreeNode[], key: string): OrgTreeNode | undefined {
  for (const n of nodes) {
    if (n.key === key) return n;
    if (n.children?.length) {
      const hit = findNode(n.children, key);
      if (hit) return hit;
    }
  }
  return undefined;
}

/** 扁平化树，供人员所属节点选择 */
function flattenOrgOptions(nodes: OrgTreeNode[], prefix = ''): { label: string; value: string }[] {
  const list: { label: string; value: string }[] = [];
  nodes.forEach((n) => {
    const label = prefix ? `${prefix} / ${n.title}` : n.title;
    list.push({ label: `${label}（${n.type}）`, value: n.key });
    if (n.children?.length) list.push(...flattenOrgOptions(n.children, label));
  });
  return list;
}

const SystemOrgPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const actor = initialState?.currentUser?.username || 'demo';
  const actionRef = useRef<ActionType | null>(null);

  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [treeKeyword, setTreeKeyword] = useState('');
  const [treeQuery, setTreeQuery] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>();
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedType, setSelectedType] = useState<OrgNodeType>();

  const [nodeOpen, setNodeOpen] = useState(false);
  const [nodeMode, setNodeMode] = useState<'create-org' | 'create-dept' | 'edit'>('create-org');
  const [editingNode, setEditingNode] = useState<OrgTreeNode | null>(null);
  const [deptParentKey, setDeptParentKey] = useState<string>();

  const [personOpen, setPersonOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonRow | null>(null);
  const [moreOpenKey, setMoreOpenKey] = useState<string>();

  const loadTree = useCallback(async (kw?: string) => {
    const res = await request<{ data: { tree: OrgTreeNode[] } }>('/api/system/org/tree', {
      params: kw ? { keyword: kw } : undefined,
    });
    const next = res.data?.tree || [];
    setTree(next);
    // 默认折叠；仅搜索时展开以便看到命中节点
    if (kw?.trim()) {
      setExpandedKeys(collectKeys(next));
    }
  }, []);

  useEffect(() => {
    loadTree(treeQuery);
  }, [loadTree, treeQuery]);

  const treeData = useMemo(() => toTreeData(tree), [tree]);
  const orgOptions = useMemo(() => flattenOrgOptions(tree), [tree]);

  const selectNode = (key: string) => {
    const hit = findNode(tree, key);
    if (!hit) return;
    setSelectedKey(key);
    setSelectedTitle(hit.title);
    setSelectedType(hit.type);
    actionRef.current?.reload();
  };

  const openCreateOrg = () => {
    setNodeMode('create-org');
    setEditingNode(null);
    setDeptParentKey(undefined);
    setNodeOpen(true);
  };

  const openCreateDept = (org: OrgTreeNode) => {
    if (org.type !== '组织') {
      message.warning('只能在组织下新增部门');
      return;
    }
    selectNode(org.key);
    setNodeMode('create-dept');
    setEditingNode(null);
    setDeptParentKey(org.key);
    setNodeOpen(true);
  };

  const openEditNode = (node: OrgTreeNode) => {
    selectNode(node.key);
    setNodeMode('edit');
    setEditingNode(node);
    setDeptParentKey(undefined);
    setNodeOpen(true);
  };

  const handleDeleteNode = async (node: OrgTreeNode) => {
    const check = await request<{
      data?: { canDelete?: boolean; reason?: string };
    }>(`/api/system/org/nodes/${node.key}/check-delete`);
    const canDelete = !!check.data?.canDelete;
    const reason = check.data?.reason;

    if (!canDelete) {
      Modal.info({
        title: `无法删除「${node.title}」`,
        content: reason || '需先删除下属部门，且节点下不能有人员。',
        okText: '我知道了',
        centered: true,
      });
      return;
    }

    Modal.confirm({
      title: `删除「${node.title}」？`,
      content: '删除后不可恢复，请确认。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string }>(
          `/api/system/org/nodes/${node.key}`,
          { method: 'DELETE', data: { actor } },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '删除失败');
          return;
        }
        message.success('已删除');
        if (selectedKey === node.key) {
          setSelectedKey(undefined);
          setSelectedTitle('');
          setSelectedType(undefined);
        }
        await loadTree(treeQuery);
      },
    });
  };

  const openCreatePerson = () => {
    if (!selectedKey) {
      message.warning('请先选择左侧组织或部门');
      return;
    }
    setEditingPerson(null);
    setPersonOpen(true);
  };

  const openEditPerson = (row: PersonRow) => {
    setEditingPerson(row);
    setPersonOpen(true);
  };

  const handleDeletePerson = (row: PersonRow) => {
    Modal.confirm({
      title: `删除人员「${row.name}」？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string }>(
          `/api/system/org/persons/${row.id}`,
          { method: 'DELETE', data: { actor } },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '删除失败');
          return;
        }
        message.success('已删除');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<PersonRow>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 120,
      fieldProps: { placeholder: '姓名 / 手机号' },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 140,
      hideInSearch: true,
    },
    {
      title: '岗位',
      dataIndex: 'role',
      width: 140,
      hideInSearch: true,
    },
    {
      title: '所属部门',
      dataIndex: 'orgKey',
      width: 160,
      hideInSearch: true,
      ellipsis: true,
      render: (_, row) => findNode(tree, row.orgKey)?.title || row.orgKey,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        在职: { text: '在职', status: 'Success' },
        离职: { text: '离职', status: 'Default' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      search: false,
      render: (_, row) => [
        <a key="edit" onClick={() => openEditPerson(row)}>
          编辑
        </a>,
        <a key="del" onClick={() => handleDeletePerson(row)}>
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <div className={styles.orgPage}>
        <aside className={`panel-surface ${styles.orgSider}`}>
          <div className={styles.orgSiderTools}>
            <Button
              type="default"
              block
              icon={<PlusOutlined />}
              className={styles.addOrgBtn}
              onClick={openCreateOrg}
            >
              新增组织
            </Button>
          </div>

          <Input.Search
            allowClear
            placeholder="搜索组织 / 部门"
            value={treeKeyword}
            onChange={(e) => setTreeKeyword(e.target.value)}
            onSearch={(v) => setTreeQuery(v.trim())}
          />

          <div className={styles.orgTreeScroll}>
            {treeData.length ? (
              <Tree
                blockNode
                treeData={treeData}
                expandedKeys={expandedKeys}
                onExpand={setExpandedKeys}
                selectedKeys={selectedKey ? [selectedKey] : []}
                titleRender={(node) => {
                  const raw = findNode(tree, String(node.key));
                  const name = String(node.title || '');
                  const active = selectedKey === String(node.key);
                  const isOrg = raw?.type === '组织';
                  const menuItems: MenuProps['items'] = [
                    ...(isOrg
                      ? [
                          {
                            key: 'add-dept',
                            icon: <PlusOutlined />,
                            label: '新增部门',
                            onClick: () => raw && openCreateDept(raw),
                          },
                        ]
                      : []),
                    {
                      key: 'edit',
                      icon: <EditOutlined />,
                      label: '编辑',
                      onClick: () => raw && openEditNode(raw),
                    },
                    { type: 'divider' as const },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除',
                      danger: true,
                      onClick: () => raw && handleDeleteNode(raw),
                    },
                  ];
                  const moreOpen = moreOpenKey === String(node.key);
                  return (
                    <div
                      className={`${styles.orgTreeRow} ${active ? styles.orgTreeRowActive : ''} ${
                        moreOpen ? styles.orgTreeRowMoreOpen : ''
                      }`}
                    >
                      {isOrg ? (
                        <BankOutlined className={styles.orgIcon} />
                      ) : (
                        <ApartmentOutlined className={styles.deptIcon} />
                      )}
                      <EllipsisTooltip title={name} className={styles.orgTreeName} />
                      {raw ? (
                        <span
                          className={styles.orgTreeActions}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Dropdown
                            menu={{ items: menuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                            open={moreOpen}
                            onOpenChange={(open) =>
                              setMoreOpenKey(open ? String(node.key) : undefined)
                            }
                          >
                            <Button
                              type="text"
                              size="small"
                              className={styles.moreBtn}
                              icon={<EllipsisOutlined />}
                              aria-label="更多操作"
                            />
                          </Dropdown>
                        </span>
                      ) : null}
                    </div>
                  );
                }}
                onSelect={(keys) => {
                  const key = String(keys[0] || '');
                  if (key) selectNode(key);
                }}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无组织，请先新增" />
            )}
          </div>
        </aside>

        <main className={styles.orgMain}>
          {!selectedKey ? (
            <div className={`panel-surface ${styles.orgEmpty}`}>
              <Empty description="请选择左侧组织或部门，管理对应人员" />
            </div>
          ) : (
            <ProTable<PersonRow>
              actionRef={actionRef}
              rowKey="id"
              headerTitle={
                <Space size={8}>
                  <span>人员</span>
                  <Tag color={selectedType === '组织' ? 'processing' : 'default'}>
                    {selectedTitle}
                  </Tag>
                  {selectedType === '组织' ? (
                    <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                      含下属部门人员
                    </span>
                  ) : null}
                </Space>
              }
              columns={columns}
              search={listSearchProps}
              pagination={listPagination}
              params={{ orgKey: selectedKey }}
              toolBarRender={() => [
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={openCreatePerson}
                >
                  新增人员
                </Button>,
              ]}
              request={async (params) =>
                request('/api/system/org/persons', {
                  params: {
                    orgKey: params.orgKey,
                    name: params.name,
                    status: params.status,
                    current: params.current,
                    pageSize: params.pageSize,
                  },
                })
              }
            />
          )}
        </main>
      </div>

      <ModalForm
        title={
          nodeMode === 'create-org'
            ? '新增组织'
            : nodeMode === 'create-dept'
              ? '新增部门'
              : '编辑'
        }
        open={nodeOpen}
        width={440}
        modalProps={{
          destroyOnHidden: true,
          centered: true,
          onCancel: () => setNodeOpen(false),
        }}
        initialValues={{
          title: editingNode?.title || '',
          type: editingNode?.type || (nodeMode === 'create-dept' ? '部门' : '组织'),
        }}
        onFinish={async (values) => {
          const res = await request<{ success: boolean; errorMessage?: string }>(
            '/api/system/org/nodes',
            {
              method: 'POST',
              data: {
                key: editingNode?.key,
                parentKey: nodeMode === 'create-dept' ? deptParentKey : undefined,
                title: values.title,
                type: values.type,
                actor,
              },
            },
          );
          if (res?.success === false) {
            message.error(res.errorMessage || '保存失败');
            return false;
          }
          message.success('已保存');
          setNodeOpen(false);
          await loadTree(treeQuery);
          return true;
        }}
      >
        <ProFormText name="title" label="名称" rules={[{ required: true, message: '请输入名称' }]} />
        <ProFormSelect
          name="type"
          label="类型"
          disabled={nodeMode !== 'edit'}
          options={[
            { label: '组织', value: '组织' },
            { label: '部门', value: '部门' },
          ]}
          rules={[{ required: true }]}
          extra={
            nodeMode === 'create-dept'
              ? `上级组织：${selectedTitle}`
              : nodeMode === 'create-org'
                ? '新增为顶层组织'
                : undefined
          }
        />
      </ModalForm>

      <ModalForm
        title={editingPerson ? '编辑人员' : '新增人员'}
        open={personOpen}
        width={480}
        modalProps={{
          destroyOnHidden: true,
          centered: true,
          onCancel: () => {
            setPersonOpen(false);
            setEditingPerson(null);
          },
        }}
        initialValues={
          editingPerson
            ? { ...editingPerson }
            : {
                orgKey: selectedKey,
                status: '在职',
                name: '',
                phone: '',
                role: '',
              }
        }
        onFinish={async (values) => {
          if (editingPerson) {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              `/api/system/org/persons/${editingPerson.id}`,
              { method: 'PUT', data: { ...values, id: editingPerson.id, actor } },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '保存失败');
              return false;
            }
            message.success('已更新');
          } else {
            const res = await request<{ success: boolean; errorMessage?: string }>(
              '/api/system/org/persons',
              { method: 'POST', data: { ...values, actor } },
            );
            if (res?.success === false) {
              message.error(res.errorMessage || '创建失败');
              return false;
            }
            message.success('已新增');
          }
          setPersonOpen(false);
          setEditingPerson(null);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]} />
        <ProFormText name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]} />
        <ProFormText name="role" label="岗位" rules={[{ required: true, message: '请输入岗位' }]} />
        <ProFormSelect
          name="orgKey"
          label="所属组织/部门"
          options={orgOptions}
          rules={[{ required: true, message: '请选择所属节点' }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '在职', value: '在职' },
            { label: '离职', value: '离职' },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SystemOrgPage;
