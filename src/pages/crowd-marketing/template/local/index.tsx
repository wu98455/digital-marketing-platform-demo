import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Checkbox, Modal, Tree, message } from 'antd';
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
};

const treeData = [
  {
    title: '所有',
    key: '所有',
    children: [
      { title: '业务目录', key: '业务目录' },
      { title: '未分类', key: '未分类' },
    ],
  },
];

const LocalTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [catalog, setCatalog] = useState('所有');
  const [createOpen, setCreateOpen] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TemplateItem[]>([]);

  const columns: ProColumns<TemplateItem>[] = [
    { title: '模板名称/ID', dataIndex: 'keyword', hideInTable: true },
    { title: '模板ID', dataIndex: 'id', search: false, width: 100 },
    {
      title: '模板名称',
      dataIndex: 'name',
      search: false,
      render: (_, row) => (
        <a onClick={() => history.push(`/crowd-marketing/template/local/design/${row.id}`)}>
          {row.name}
        </a>
      ),
    },
    { title: '营销对象', dataIndex: 'target', search: false, width: 120 },
    { title: '分类', dataIndex: 'category', search: false, width: 100 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 110 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      search: false,
      render: (_, row) => [
        <a
          key="createAct"
          onClick={() => {
            message.success('已基于模板创建活动（演示）');
            history.push('/crowd-marketing/activity');
          }}
        >
          创建活动
        </a>,
        <a
          key="edit"
          onClick={() => history.push(`/crowd-marketing/template/local/design/${row.id}`)}
        >
          编辑
        </a>,
        <a key="copy" onClick={() => message.success('已复制（演示）')}>
          复制
        </a>,
        <a
          key="del"
          onClick={() =>
            Modal.confirm({
              title: '确认删除模板？',
              onOk: () => {
                message.success('已删除（演示）');
                actionRef.current?.reload();
              },
            })
          }
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="panel-surface" style={{ width: 220, padding: '16px 12px' }}>
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
          <ProTable<TemplateItem>
            headerTitle="本地模板"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
            toolBarRender={() => [
              <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
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
                  catalog,
                  onlyMine: onlyMine ? 'true' : undefined,
                },
              })
            }
          />
        </div>
      </div>

      <ModalForm
        title="新建模板"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
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
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="category"
          label="分类"
          options={[
            { label: '召回', value: '召回' },
            { label: '促活', value: '促活' },
            { label: '关怀', value: '关怀' },
          ]}
        />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>
    </PageContainer>
  );
};

export default LocalTemplatePage;
