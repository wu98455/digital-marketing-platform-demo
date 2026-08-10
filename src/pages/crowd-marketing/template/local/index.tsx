import type { ActionType, ProColumns } from '@ant-design/pro-components';
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
import { Button, Checkbox, Dropdown, Modal, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TemplateItem = {
  id: string;
  name: string;
  catalog: string;
  target: string;
  category: string;
  creator: string;
  createdAt: string;
  periodic?: boolean;
};

const CATALOGS = ['文旅营销', '业务目录', '未分类'];

const LocalTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TemplateItem[]>([]);

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: TemplateItem) => {
    setFormMode('edit');
    setEditing(row);
    setFormOpen(true);
  };

  const columns: ProColumns<TemplateItem>[] = [
    { title: '模板名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '分类',
      dataIndex: 'catalogSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        ...Object.fromEntries(CATALOGS.map((c) => [c, { text: c }])),
      },
    },
    {
      title: '是否周期活动',
      dataIndex: 'periodicSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: { 全部: { text: '全部' }, 是: { text: '是' }, 否: { text: '否' } },
    },
    { title: '模板ID', dataIndex: 'id', search: false, width: 100 },
    {
      title: '模板名称',
      dataIndex: 'name',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, row) => (
        <a onClick={() => history.push(`/crowd-marketing/template/local/design/${row.id}`)}>
          {row.name}
        </a>
      ),
    },
    { title: '营销对象', dataIndex: 'target', search: false, width: 120 },
    { title: '分类', dataIndex: 'catalog', search: false, width: 100 },
    {
      title: '周期活动',
      dataIndex: 'periodic',
      search: false,
      width: 90,
      render: (_, row) => (row.periodic ? '是' : '否'),
    },
    { title: '创建人', dataIndex: 'creator', search: false, width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      search: false,
      fixed: 'right',
      render: (_, row) => (
        <div className="table-op-row">
          <a key="edit" onClick={() => openEdit(row)}>
            编辑
          </a>
          <a
            key="copy"
            onClick={async () => {
              await request('/api/crowd-marketing/templates/local', {
                method: 'POST',
                data: {
                  name: `${row.name}-副本`,
                  catalog: row.catalog,
                  target: row.target,
                  category: row.category,
                  periodic: row.periodic,
                },
              });
              message.success('已复制（演示）');
              actionRef.current?.reload();
            }}
          >
            复制
          </a>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'export',
                  label: '导出',
                  onClick: () => message.success('已导出（演示）'),
                },
                {
                  key: 'delete',
                  label: '删除',
                  danger: true,
                  onClick: () => {
                    Modal.confirm({
                      title: '确认删除模板？',
                      onOk: async () => {
                        await request(`/api/crowd-marketing/templates/local/${row.id}`, {
                          method: 'DELETE',
                        });
                        message.success('已删除（演示）');
                        actionRef.current?.reload();
                      },
                    });
                  },
                },
              ],
            }}
          >
            <a>更多</a>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<TemplateItem>
        headerTitle="营销活动模板"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        scroll={{ x: 1000 }}
        rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={openCreate}>
            新建模板
          </Button>,
          <Button
            key="batchDel"
            disabled={!selectedRows.length}
            onClick={() =>
              Modal.confirm({
                title: `确认删除已选 ${selectedRows.length} 个模板？`,
                onOk: () => {
                  message.success('已批量删除（演示）');
                  actionRef.current?.reload();
                },
              })
            }
          >
            批量删除
          </Button>,
          <Checkbox
            key="mine"
            checked={onlyMine}
            onChange={(e) => {
              setOnlyMine(e.target.checked);
              actionRef.current?.reload();
            }}
          >
            只看我创建的
          </Checkbox>,
        ]}
        request={async (params) =>
          request('/api/crowd-marketing/templates/local', {
            params: {
              ...params,
              keyword: params.keyword,
              catalog: params.catalogSearch,
              periodic:
                params.periodicSearch && params.periodicSearch !== '全部'
                  ? params.periodicSearch
                  : undefined,
              onlyMine: onlyMine ? 'true' : undefined,
            },
          })
        }
      />

      <ModalForm
        title={formMode === 'create' ? '新建模板' : '编辑模板'}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        modalProps={{ destroyOnHidden: true }}
        initialValues={
          formMode === 'edit' && editing
            ? {
                name: editing.name,
                target: editing.target,
                catalog: editing.catalog,
                category: editing.category,
                periodic: !!editing.periodic,
                remark: '',
              }
            : {
                target: '全渠道会员',
                catalog: '未分类',
                periodic: false,
              }
        }
        onFinish={async (values) => {
          if (formMode === 'edit') {
            message.success(`已更新模板「${values.name}」（演示）`);
            actionRef.current?.reload();
            return true;
          }
          await request('/api/crowd-marketing/templates/local', {
            method: 'POST',
            data: values,
          });
          message.success(`已创建模板「${values.name}」（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="target"
          label="营销对象"
          options={[
            { label: '全渠道会员', value: '全渠道会员' },
            { label: '店铺会员', value: '店铺会员' },
            { label: '潜客', value: '潜客' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="catalog"
          label="分类"
          options={CATALOGS.map((c) => ({ label: c, value: c }))}
        />
        <ProFormSelect
          name="category"
          label="场景"
          options={[
            { label: '召回', value: '召回' },
            { label: '促活', value: '促活' },
            { label: '关怀', value: '关怀' },
          ]}
        />
        <ProFormSwitch name="periodic" label="周期性活动" />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>
    </PageContainer>
  );
};

export default LocalTemplatePage;
