import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, Tree, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TagItem = {
  id: string;
  name: string;
  type: string;
  group: string;
  object: string;
  taggedCount: number;
  creator: string;
  createdAt: string;
};

const treeData = [
  {
    title: '全部',
    key: '全部',
    children: [
      { title: '专题活动', key: '专题活动' },
      { title: '渠道投放', key: '渠道投放' },
      { title: '节日营销', key: '节日营销' },
    ],
  },
];

const ActivityTagPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [group, setGroup] = useState('全部');
  const [createOpen, setCreateOpen] = useState(false);

  const columns: ProColumns<TagItem>[] = [
    { title: '标签名称', dataIndex: 'keyword', hideInTable: true },
    { title: '标签ID', dataIndex: 'id', search: false, width: 100 },
    { title: '标签名称', dataIndex: 'name', search: false },
    { title: '对象', dataIndex: 'object', search: false, width: 80 },
    { title: '类型', dataIndex: 'type', search: false, width: 100 },
    { title: '分组', dataIndex: 'group', search: false, width: 120 },
    { title: '已打标活动', dataIndex: 'taggedCount', search: false, width: 110 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 80,
      render: () => [
        <a key="edit" onClick={() => message.info('编辑活动标签（演示）')}>
          编辑
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
            headerTitle="活动标签（专题 / 活动）"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            toolBarRender={() => [
              <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
                新建标签
              </Button>,
            ]}
            request={async (params) =>
              request('/api/customer-asset/tags/activity', {
                params: { ...params, group, keyword: params.keyword },
              })
            }
          />
        </div>
      </div>

      <ModalForm
        title="新建活动标签"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          message.success(`已创建活动标签「${values.name}」（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="标签名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="group"
          label="分组"
          options={[
            { label: '专题活动', value: '专题活动' },
            { label: '渠道投放', value: '渠道投放' },
            { label: '节日营销', value: '节日营销' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="type"
          label="类型"
          options={[
            { label: '手工标签', value: '手工标签' },
            { label: '规则标签', value: '规则标签' },
          ]}
          initialValue="手工标签"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ActivityTagPage;
