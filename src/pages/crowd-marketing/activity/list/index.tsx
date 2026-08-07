import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Checkbox, Modal, Space, Tree, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type ActivityItem = {
  id: string;
  name: string;
  status: string;
  catalog: string;
  creator: string;
  createdAt: string;
  periodic?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  pinned?: boolean;
};

const DEFAULT_CATALOGS = ['文旅营销', '业务目录', '未分类'];
const PROTECTED = new Set(['未分类']);

const ActivityList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const createFormRef = useRef<ProFormInstance>();
  const [catalogs, setCatalogs] = useState<string[]>(DEFAULT_CATALOGS);
  const [catalog, setCatalog] = useState('所有');
  const [createOpen, setCreateOpen] = useState(false);
  const [catalogFormOpen, setCatalogFormOpen] = useState(false);
  const [catalogFormMode, setCatalogFormMode] = useState<'create' | 'edit'>('create');
  const [editingCatalog, setEditingCatalog] = useState<string>();
  const [onlyPeriodic, setOnlyPeriodic] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [pendingApprove, setPendingApprove] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ActivityItem[]>([]);

  const treeData = useMemo(
    () => [
      {
        title: '所有',
        key: '所有',
        children: catalogs.map((name) => ({ title: name, key: name })),
      },
    ],
    [catalogs],
  );

  const catalogOptions = useMemo(
    () => catalogs.map((name) => ({ label: name, value: name })),
    [catalogs],
  );

  const openCreateCatalog = () => {
    setCatalogFormMode('create');
    setEditingCatalog(undefined);
    setCatalogFormOpen(true);
  };

  const openEditCatalog = (name?: string) => {
    const target = name || (catalog !== '所有' ? catalog : undefined);
    if (!target) {
      message.warning('请先在左侧选中要编辑的分类');
      return;
    }
    if (PROTECTED.has(target)) {
      message.warning('「未分类」为系统分类，不可编辑');
      return;
    }
    setCatalogFormMode('edit');
    setEditingCatalog(target);
    setCatalogFormOpen(true);
  };

  const removeCatalog = (name?: string) => {
    const target = name || (catalog !== '所有' ? catalog : undefined);
    if (!target) {
      message.warning('请先在左侧选中要删除的分类');
      return;
    }
    if (PROTECTED.has(target)) {
      message.warning('「未分类」为系统分类，不可删除');
      return;
    }
    Modal.confirm({
      title: `确认删除分类「${target}」？`,
      content: '该分类下的活动将归入「未分类」（演示）',
      onOk: () => {
        setCatalogs((prev) => prev.filter((x) => x !== target));
        if (catalog === target) setCatalog('所有');
        if (createFormRef.current?.getFieldValue('category') === target) {
          createFormRef.current?.setFieldsValue({ category: '未分类' });
        }
        message.success('已删除分类（演示）');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<ActivityItem>[] = [
    { title: '活动名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        草稿: { text: '草稿' },
        进行中: { text: '进行中' },
        已结束: { text: '已结束' },
        待审批: { text: '待审批' },
        已暂停: { text: '已暂停' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '活动ID', dataIndex: 'id', search: false, width: 110 },
    {
      title: '活动名称',
      dataIndex: 'name',
      search: false,
      render: (_, row) => (
        <Space>
          {row.pinned ? <span style={{ color: '#faad14' }}>置顶</span> : null}
          <a onClick={() => history.push(`/crowd-marketing/activity/design/${row.id}`)}>
            {row.name}
          </a>
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', search: false, width: 100 },
    { title: '目录', dataIndex: 'catalog', search: false, width: 100 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 110 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      search: false,
      fixed: 'right',
      render: (_, row) => (
        <div className="table-op-row">
          <a onClick={() => message.success(row.pinned ? '已取消置顶（演示）' : '已置顶（演示）')}>
            置顶
          </a>
          <a onClick={() => message.success('已复制（演示）')}>复制</a>
          <a
            className={row.canEdit === false ? 'disabled' : undefined}
            onClick={() => {
              if (row.canEdit === false) return;
              history.push(`/crowd-marketing/activity/design/${row.id}`);
            }}
          >
            编辑
          </a>
          <a onClick={() => history.push(`/crowd-marketing/activity/report/${row.id}`)}>数据</a>
          <a
            className={row.canDelete === false ? 'disabled' : undefined}
            onClick={() => {
              if (row.canDelete === false) return;
              Modal.confirm({
                title: '确认删除该活动？',
                onOk: () => {
                  message.success('已删除（演示）');
                  actionRef.current?.reload();
                },
              });
            }}
          >
            删除
          </a>
          <a onClick={() => message.success('已导出（演示）')}>导出</a>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="panel-surface" style={{ width: 240, padding: '16px 12px' }}>
          <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }} size={8}>
            <Button type="primary" block onClick={openCreateCatalog}>
              新建分类
            </Button>
            <Space.Compact style={{ width: '100%' }}>
              <Button
                style={{ flex: 1 }}
                disabled={catalog === '所有' || PROTECTED.has(catalog)}
                onClick={() => openEditCatalog()}
              >
                编辑
              </Button>
              <Button
                danger
                style={{ flex: 1 }}
                disabled={catalog === '所有' || PROTECTED.has(catalog)}
                onClick={() => removeCatalog()}
              >
                删除
              </Button>
            </Space.Compact>
          </Space>
          <Tree.DirectoryTree
            defaultExpandAll
            treeData={treeData}
            selectedKeys={[catalog]}
            onSelect={(keys) => {
              if (keys[0]) {
                setCatalog(String(keys[0]));
                actionRef.current?.reload();
              }
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProTable<ActivityItem>
            headerTitle="营销活动"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            scroll={{ x: 1200 }}
            rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
            toolBarRender={() => [
              <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
                新建活动
              </Button>,
              <Button
                key="batchDel"
                disabled={!selectedRows.length}
                onClick={() =>
                  Modal.confirm({
                    title: `确认删除已选 ${selectedRows.length} 个活动？`,
                    onOk: () => {
                      message.success('已批量删除（演示）');
                      actionRef.current?.reload();
                    },
                  })
                }
              >
                批量删除
              </Button>,
              <Button
                key="batchExport"
                disabled={!selectedRows.length}
                onClick={() => message.success('已批量导出（演示）')}
              >
                批量导出
              </Button>,
              <Checkbox
                key="periodic"
                checked={onlyPeriodic}
                onChange={(e) => {
                  setOnlyPeriodic(e.target.checked);
                  actionRef.current?.reload();
                }}
              >
                只看周期性活动
              </Checkbox>,
              <Checkbox
                key="mine"
                checked={onlyMine}
                onChange={(e) => {
                  setOnlyMine(e.target.checked);
                  actionRef.current?.reload();
                }}
              >
                只看我的活动
              </Checkbox>,
              <Checkbox
                key="approve"
                checked={pendingApprove}
                onChange={(e) => {
                  setPendingApprove(e.target.checked);
                  actionRef.current?.reload();
                }}
              >
                待我审批
              </Checkbox>,
            ]}
            request={async (params) =>
              request('/api/crowd-marketing/activities', {
                params: {
                  ...params,
                  keyword: params.keyword,
                  status: params.statusSearch,
                  catalog,
                  onlyPeriodic: onlyPeriodic ? 'true' : undefined,
                  onlyMine: onlyMine ? 'true' : undefined,
                  pendingApprove: pendingApprove ? 'true' : undefined,
                },
              })
            }
          />
        </div>
      </div>

      <ModalForm
        title="新建活动"
        formRef={createFormRef}
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          message.success(`已创建活动「${values.name}」（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="活动名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="template"
          label="空版/活动模板"
          options={[
            { label: '空白活动', value: 'blank' },
            { label: '新客欢迎流程模板', value: 'tpl1' },
            { label: '沉默召回模板', value: 'tpl2' },
          ]}
          initialValue="blank"
        />
        <ProFormSelect
          name="category"
          label="分类"
          options={catalogOptions}
          rules={[{ required: true, message: '请选择分类' }]}
          extra={
            <Space size={12} style={{ marginTop: 4 }}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  openCreateCatalog();
                }}
              >
                新建分类
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  openEditCatalog(createFormRef.current?.getFieldValue('category'));
                }}
              >
                编辑分类
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  removeCatalog(createFormRef.current?.getFieldValue('category'));
                }}
              >
                删除分类
              </a>
            </Space>
          }
        />
        <ProFormSelect
          name="target"
          label="营销对象"
          options={[
            { label: '全渠道会员', value: '全渠道会员' },
            { label: '店铺会员', value: '店铺会员' },
          ]}
        />
        <ProFormSelect
          name="approver"
          label="审批人"
          options={[
            { label: '自己审批', value: 'self' },
            { label: 'WangSiyi', value: 'WangSiyi' },
          ]}
          initialValue="self"
        />
        <ProFormSwitch name="balanceAlert" label="余额不足提醒" initialValue />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>

      <ModalForm
        title={catalogFormMode === 'create' ? '新建分类' : '编辑分类'}
        open={catalogFormOpen}
        onOpenChange={setCatalogFormOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ name: editingCatalog }}
        onFinish={async (values) => {
          const name = String(values.name || '').trim();
          if (!name) {
            message.error('请输入分类名称');
            return false;
          }
          if (catalogFormMode === 'create') {
            if (catalogs.includes(name)) {
              message.error('分类已存在');
              return false;
            }
            setCatalogs((prev) => [...prev, name]);
            message.success(`已新建分类「${name}」（演示）`);
          } else if (editingCatalog) {
            if (name !== editingCatalog && catalogs.includes(name)) {
              message.error('分类已存在');
              return false;
            }
            setCatalogs((prev) => prev.map((x) => (x === editingCatalog ? name : x)));
            if (catalog === editingCatalog) setCatalog(name);
            if (createFormRef.current?.getFieldValue('category') === editingCatalog) {
              createFormRef.current?.setFieldsValue({ category: name });
            }
            message.success(`已更新分类为「${name}」（演示）`);
          }
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="分类名称"
          rules={[{ required: true, message: '请输入分类名称' }]}
          placeholder="如：节庆营销"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ActivityList;
