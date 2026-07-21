import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, Modal, Space, Tree, Upload, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TagItem = {
  id: string;
  name: string;
  type: string;
  group: string;
  taggedCount: number;
  creator: string;
  createdAt: string;
  hasChild?: boolean;
};

const treeData = [
  {
    title: '全部',
    key: '全部',
    children: [
      { title: 'RFM', key: 'RFM' },
      { title: '生命周期', key: '生命周期' },
      { title: '行为', key: '行为' },
    ],
  },
];

const OmnichannelTagPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [group, setGroup] = useState('全部');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const columns: ProColumns<TagItem>[] = [
    { title: '标签ID', dataIndex: 'tagId', hideInTable: true },
    { title: '标签名称', dataIndex: 'tagName', hideInTable: true },
    {
      title: '标签类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        手工标签: { text: '手工标签' },
        规则标签: { text: '规则标签' },
      },
    },
    { title: '创建人', dataIndex: 'creatorSearch', hideInTable: true },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
      search: {
        transform: (value) => ({ createdStart: value?.[0], createdEnd: value?.[1] }),
      },
    },
    { title: '标签ID', dataIndex: 'id', search: false, width: 100 },
    { title: '标签名称', dataIndex: 'name', search: false },
    { title: '类型', dataIndex: 'type', search: false, width: 100 },
    { title: '分组', dataIndex: 'group', search: false, width: 120 },
    { title: '已打标人数', dataIndex: 'taggedCount', search: false, width: 110 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 110 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      search: false,
      render: (_, row) => [
        <a key="view" onClick={() => message.info('查看（演示）')}>
          查看
        </a>,
        <a key="move" onClick={() => message.info('更改分组（演示）')}>
          改分组
        </a>,
        row.hasChild ? (
          <a key="child" onClick={() => message.info('创建子标签（演示）')}>
            子标签
          </a>
        ) : null,
        <a
          key="del"
          onClick={() =>
            Modal.confirm({
              title: '确认删除？',
              onOk: () => message.success('已删除（演示）'),
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
        <div
          className="panel-surface"
          style={{
            width: 220,
            padding: '16px 12px',
          }}
        >
          <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
            <Button block onClick={() => message.info('订阅行业标签模板（演示）')}>
              订阅行业标签模板
            </Button>
            <Button block onClick={() => message.info('新建分组（演示）')}>
              新建分组
            </Button>
          </Space>
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
            headerTitle="全渠道标签"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            toolBarRender={() => [
              <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
                新建标签
              </Button>,
              <Button key="import" onClick={() => setImportOpen(true)}>
                导入客户
              </Button>,
            ]}
            request={async (params) =>
              request('/api/customer-asset/tags/omnichannel', { params: { ...params, group } })
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
        <ProFormTextArea name="desc" label="说明" />
        <ProFormSelect
          name="type"
          label="类型"
          options={[
            { label: '手工标签', value: '手工标签' },
            { label: '规则标签', value: '规则标签' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="valid" label="有效期" />
        <ProFormSelect
          name="perm"
          label="权限控制"
          options={[
            { label: '仅自己', value: 'self' },
            { label: '本部门', value: 'dept' },
            { label: '全员', value: 'all' },
          ]}
        />
      </ModalForm>

      <ModalForm
        title="导入客户"
        open={importOpen}
        onOpenChange={setImportOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success('已提交导入（演示）');
          return true;
        }}
      >
        <ProFormSelect
          name="level"
          label="标签层级"
          options={[{ label: '全渠道标签', value: '全渠道标签' }]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="group"
          label="分组"
          options={[
            { label: 'RFM', value: 'RFM' },
            { label: '生命周期', value: '生命周期' },
            { label: '行为', value: '行为' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="matchKey"
          label="匹配标识"
          options={[
            { label: '手机号', value: '手机号' },
            { label: '全渠道客户ID', value: '全渠道客户ID' },
          ]}
        />
        <a style={{ display: 'inline-block', marginBottom: 12 }}>下载模板</a>
        <Upload beforeUpload={() => false} maxCount={1} accept=".csv">
          <Button>上传 CSV（≤10MB）</Button>
        </Upload>
      </ModalForm>
    </PageContainer>
  );
};

export default OmnichannelTagPage;
