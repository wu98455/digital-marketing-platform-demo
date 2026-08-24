import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, Tree, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TagItem = {
  id: string;
  name: string;
  status: string;
  type: string;
  productCount: number;
  group: string;
};

const treeData = [
  {
    title: '全部',
    key: '全部',
    children: [
      { title: '营销属性', key: '营销属性' },
      { title: '品类属性', key: '品类属性' },
    ],
  },
];

const ProductTagPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [group, setGroup] = useState('全部');
  const [createOpen, setCreateOpen] = useState(false);

  const columns: ProColumns<TagItem>[] = [
    {
      title: '标签可用状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        启用: { text: '启用' },
        停用: { text: '停用' },
      },
    },
    { title: '创建人', dataIndex: 'creator', hideInTable: true },
    { title: '标签名称', dataIndex: 'name', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      valueEnum: {
        启用: { text: '启用', status: 'Success' },
        停用: { text: '停用', status: 'Default' },
      },
    },
    { title: '类型', dataIndex: 'type', search: false },
    { title: '已打标商品', dataIndex: 'productCount', search: false },
    { title: '分组', dataIndex: 'group', search: false },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      render: () => [
        <a key="edit" onClick={() => message.info('编辑（演示）')}>
          编辑
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          className="panel-surface"
          style={{
            width: 220,
            padding: '16px 12px',
          }}
        >
          <Button block style={{ marginBottom: 8 }} onClick={() => setCreateOpen(true)}>
            新建标签
          </Button>
          <Tree.DirectoryTree
            defaultExpandAll
            treeData={treeData}
            selectedKeys={[group]}
            onSelect={(keys) => {
              if (keys[0]) {
                setGroup(String(keys[0]));
                actionRef.current?.reload();
              }
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProTable<TagItem>
            headerTitle="商品标签"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            request={async (params) =>
              request('/api/customer-asset/product-tags', { params: { ...params, group } })
            }
          />
        </div>
      </div>

      <ModalForm
        title="新建标签"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success('已创建（演示）');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="标签名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="group"
          label="分组"
          options={[
            { label: '营销属性', value: '营销属性' },
            { label: '品类属性', value: '品类属性' },
          ]}
        />
        <ProFormSelect
          name="type"
          label="类型"
          options={[
            { label: '手工', value: '手工' },
            { label: '规则', value: '规则' },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ProductTagPage;
