import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Checkbox, Modal, Tooltip, Tree, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type CrowdItem = {
  id: string;
  name: string;
  count: number;
  type: string;
  creator: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  catalog: string;
  canDelete?: boolean;
  canCopy?: boolean;
};

const treeData = [
  {
    title: '所有',
    key: '所有',
    children: [
      { title: '文旅人群', key: '文旅人群' },
      { title: '业务目录', key: '业务目录' },
      { title: '未分类', key: '未分类' },
    ],
  },
];

const syncTip = (
  <div style={{ maxWidth: 360 }}>
    <div>1.可将自己创建的静态分群同步至开放平台。</div>
    <div>
      2.同步有一定时效，依据同步数据的大小不等，请以列表显示的“同步开放平台状态”结果为准。
    </div>
    <div>
      3.开放平台的文件有效期为6个月（超时自动清除），同步成功后需尽快从开放平台下载文件。
    </div>
  </div>
);

const CrowdList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [catalog, setCatalog] = useState('所有');
  const [selectedRows, setSelectedRows] = useState<CrowdItem[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);

  const columns: ProColumns<CrowdItem>[] = [
    {
      title: '人群名称/ID',
      dataIndex: 'keyword',
      hideInTable: true,
    },
    {
      title: '创建人',
      dataIndex: 'creatorSearch',
      hideInTable: true,
    },
    {
      title: '人群类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        静态人群: { text: '静态人群' },
        条件人群: { text: '条件人群' },
      },
    },
    { title: '人群ID', dataIndex: 'id', search: false, width: 100 },
    {
      title: '人群名称',
      dataIndex: 'name',
      search: false,
      render: (_, row) => (
        <a onClick={() => history.push(`/customer-asset/crowd/detail/${row.id}`)}>{row.name}</a>
      ),
    },
    { title: '人数', dataIndex: 'count', search: false, width: 100 },
    { title: '人群类型', dataIndex: 'type', search: false, width: 110 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 120 },
    { title: '创建来源', dataIndex: 'source', search: false, width: 110 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    { title: '更新时间', dataIndex: 'updatedAt', search: false, width: 170 },
    {
      title: '同步开放平台状态',
      dataIndex: 'syncStatus',
      search: false,
      width: 140,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      search: false,
      width: 180,
      render: (_, row) => [
        <Button
          key="edit"
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => history.push(`/customer-asset/crowd/detail/${row.id}`)}
        >
          编辑
        </Button>,
        <Button
          key="del"
          type="link"
          size="small"
          disabled={!row.canDelete}
          style={{ padding: 0 }}
          onClick={() => {
            Modal.confirm({
              title: '确认删除该人群？',
              onOk: () => {
                message.success('已删除（演示）');
                actionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </Button>,
        <Button
          key="copy"
          type="link"
          size="small"
          disabled={!row.canCopy}
          style={{ padding: 0 }}
          onClick={() => {
            message.success(`已复制「${row.name}」（演示）`);
            history.push('/customer-asset/crowd/create');
          }}
        >
          复制
        </Button>,
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
          <ProTable<CrowdItem>
            headerTitle="人群列表"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            rowSelection={{
              onChange: (_, rows) => setSelectedRows(rows),
            }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                onClick={() => history.push('/customer-asset/crowd/create')}
              >
                新建人群
              </Button>,
              <Tooltip key="sync" title={syncTip}>
                <span>
                  <Button
                    disabled={!selectedRows.length}
                    onClick={() => {
                      Modal.confirm({
                        title: '确认同步开放平台',
                        content: `将同步已选 ${selectedRows.length} 个人群。同步有时限，以列表「同步开放平台状态」为准；开放平台侧文件有效期约 6 个月。`,
                        onOk: async () => {
                          await request('/api/customer-asset/crowds/sync', {
                            method: 'POST',
                          });
                          message.success('已提交同步（演示）');
                          actionRef.current?.reload();
                        },
                      });
                    }}
                  >
                    确认同步开放平台
                  </Button>
                </span>
              </Tooltip>,
              <Checkbox
                key="mine"
                checked={onlyMine}
                onChange={(e) => {
                  setOnlyMine(e.target.checked);
                  actionRef.current?.reload();
                }}
              >
                只显示我创建的
              </Checkbox>,
            ]}
            request={async (params) => {
              const res = await request('/api/customer-asset/crowds', {
                params: {
                  ...params,
                  keyword: params.keyword,
                  creator: params.creatorSearch || params.creator,
                  type: params.typeSearch || params.type,
                  catalog,
                  onlyMine: onlyMine ? 'true' : undefined,
                },
              });
              return res;
            }}
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default CrowdList;
