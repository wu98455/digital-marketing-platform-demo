import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import { Button, Empty, Input, Modal, Space, Tag, Tree, Typography, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import type { OrgNodeType, OrgPerson, OrgTreeNode } from '@/utils/systemAdminStore';
import styles from './index.less';

type PersonRow = OrgPerson;

function toTreeData(nodes: OrgTreeNode[]): DataNode[] {
  return nodes.map((n) => ({
    key: n.key,
    title: n.title,
    type: n.type,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

const SystemOrgPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const actor = initialState?.currentUser?.username || 'demo';
  const actionRef = useRef<ActionType | null>(null);
  const [tree, setTree] = useState<OrgTreeNode[]>([]);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>();
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedType, setSelectedType] = useState<OrgNodeType>();
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgMode, setOrgMode] = useState<'create-org' | 'create-dept' | 'edit'>('create-org');
  const [editingNode, setEditingNode] = useState<OrgTreeNode | null>(null);

  const loadTree = useCallback(async (kw?: string) => {
    const res = await request<{ data: { tree: OrgTreeNode[] } }>('/api/system/org/tree', {
      params: kw ? { keyword: kw } : undefined,
    });
    setTree(res.data?.tree || []);
  }, []);

  useEffect(() => {
    loadTree(searchKeyword);
  }, [loadTree, searchKeyword]);

  const treeData = useMemo(() => toTreeData(tree), [tree]);

  const openCreateOrg = () => {
    setOrgMode('create-org');
    setEditingNode(null);
    setOrgModalOpen(true);
  };

  const openCreateDept = () => {
    if (!selectedKey || selectedType !== '组织') {
      message.warning('请先在左侧选择组织，再新增部门');
      return;
    }
    setOrgMode('create-dept');
    setEditingNode(null);
    setOrgModalOpen(true);
  };

  const openEditNode = (node: OrgTreeNode) => {
    setOrgMode('edit');
    setEditingNode(node);
    setOrgModalOpen(true);
  };

  const handleDeleteNode = (node: OrgTreeNode) => {
    Modal.confirm({
      title: `删除「${node.title}」？`,
      content: node.type === '组织' ? '需先删除下属部门且无人员。' : '需确保部门下无人员。',
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
        }
        loadTree(searchKeyword);
      },
    });
  };

  const findNode = (nodes: OrgTreeNode[], key: string): OrgTreeNode | undefined => {
    for (const n of nodes) {
      if (n.key === key) return n;
      if (n.children?.length) {
        const hit = findNode(n.children, key);
        if (hit) return hit;
      }
    }
    return undefined;
  };

  const columns: ProColumns<PersonRow>[] = [
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '手机号', dataIndex: 'phone', width: 140, search: false },
    { title: '岗位', dataIndex: 'role', width: 140, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      search: false,
      render: (_, row) => (
        <Tag color={row.status === '在职' ? 'success' : 'default'}>{row.status}</Tag>
      ),
    },
  ];

  return (
    <PageContainer title="组织架构">
      <div className={styles.orgLayout}>
        <div className={styles.orgLeft}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                组织结构
              </Typography.Title>
              <Typography.Text type="secondary">维护组织及其下属部门</Typography.Text>
            </div>
            <Button type="primary" onClick={openCreateOrg}>
              新增组织
            </Button>
          </div>
          <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
            <Input
              placeholder="搜索组织或部门名称，回车"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => setSearchKeyword(keyword.trim())}
            />
            <Button type="primary" onClick={() => setSearchKeyword(keyword.trim())}>
              搜索
            </Button>
          </Space.Compact>
          <Tree
            showLine
            blockNode
            treeData={treeData}
            selectedKeys={selectedKey ? [selectedKey] : []}
            titleRender={(node) => {
              const raw = findNode(tree, String(node.key));
              return (
                <div className={styles.orgTreeNode}>
                  <span className={styles.orgTreeTitle}>{String(node.title)}</span>
                  <Tag color={raw?.type === '组织' ? 'blue' : 'default'}>{raw?.type || '部门'}</Tag>
                  {raw ? (
                    <Space size={0}>
                      <Button type="link" size="small" onClick={() => openEditNode(raw)}>
                        编辑
                      </Button>
                      <Button type="link" size="small" danger onClick={() => handleDeleteNode(raw)}>
                        删
                      </Button>
                    </Space>
                  ) : null}
                </div>
              );
            }}
            onSelect={(keys, info) => {
              const key = String(keys[0] || '');
              if (!key) return;
              const node = findNode(tree, key);
              setSelectedKey(key);
              setSelectedTitle(node?.title || String(info.node.title));
              setSelectedType(node?.type);
              actionRef.current?.reload();
            }}
          />
        </div>

        <div className={styles.orgRight}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                人员管理
              </Typography.Title>
              <Typography.Text type="secondary">
                {selectedKey ? `当前：${selectedTitle}` : '请从左侧选择组织或部门'}
              </Typography.Text>
            </div>
            <Button disabled={!selectedKey} onClick={openCreateDept}>
              新增部门
            </Button>
          </div>

          {!selectedKey ? (
            <div className={styles.orgEmpty}>
              <Empty description="请先在左侧组织树选择组织或部门，再进行人员管理" />
            </div>
          ) : (
            <ProTable<PersonRow>
              actionRef={actionRef}
              rowKey="id"
              columns={columns}
              search={listSearchProps}
              pagination={listPagination}
              params={{ orgKey: selectedKey }}
              request={async (params) => {
                const res = await request<{
                  data: PersonRow[];
                  total: number;
                  success: boolean;
                }>('/api/system/org/persons', {
                  params: {
                    orgKey: params.orgKey,
                    keyword: params.name,
                    current: params.current,
                    pageSize: params.pageSize,
                  },
                });
                return res;
              }}
            />
          )}
        </div>
      </div>

      <ModalForm
        title={
          orgMode === 'create-org'
            ? '新增组织'
            : orgMode === 'create-dept'
              ? '新增部门'
              : '编辑节点'
        }
        open={orgModalOpen}
        modalProps={{ destroyOnClose: true, onCancel: () => setOrgModalOpen(false) }}
        initialValues={{
          title: editingNode?.title || '',
          type: editingNode?.type || (orgMode === 'create-dept' ? '部门' : '组织'),
        }}
        onFinish={async (values) => {
          const res = await request<{ success: boolean; errorMessage?: string }>(
            '/api/system/org/nodes',
            {
              method: 'POST',
              data: {
                key: editingNode?.key,
                parentKey: orgMode === 'create-dept' ? selectedKey : undefined,
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
          setOrgModalOpen(false);
          loadTree(searchKeyword);
          return true;
        }}
      >
        <ProFormText name="title" label="名称" rules={[{ required: true, message: '请输入名称' }]} />
        <ProFormSelect
          name="type"
          label="类型"
          disabled={orgMode === 'create-dept'}
          options={[
            { label: '组织', value: '组织' },
            { label: '部门', value: '部门' },
          ]}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default SystemOrgPage;
