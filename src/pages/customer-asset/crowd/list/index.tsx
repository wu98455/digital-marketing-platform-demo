import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation } from '@umijs/max';
import { Alert, Button, Checkbox, Modal, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import CrowdCreateModal from '../components/CrowdCreateModal';

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

const CrowdList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [copyName, setCopyName] = useState<string>();
  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search || '');
    if (q.get('create') === '1') {
      setCopyName(undefined);
      setCreateOpen(true);
      history.replace('/crowd');
    }
  }, [location.search]);

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
        临时人群: { text: '临时人群' },
      },
    },
    {
      title: '人群ID',
      dataIndex: 'id',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '人群名称',
      dataIndex: 'name',
      search: false,
      width: 220,
      ellipsis: true,
      render: (_, row) => (
        <a
          onClick={() => history.push(`/crowd/detail/${row.id}`)}
          style={{ whiteSpace: 'nowrap' }}
        >
          {row.name}
          {row.type === '临时人群' ? (
            <Tag color="orange" style={{ marginLeft: 6 }}>
              临时
            </Tag>
          ) : null}
        </a>
      ),
    },
    {
      title: '人数',
      dataIndex: 'count',
      search: false,
      width: 90,
      ellipsis: true,
    },
    {
      title: '人群类型',
      dataIndex: 'type',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: '创建来源',
      dataIndex: 'source',
      search: false,
      width: 110,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      width: 170,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      search: false,
      width: 170,
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 160,
      fixed: 'right',
      render: (_, row) => [
        <Button
          key="edit"
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => history.push(`/crowd/detail/${row.id}`)}
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
            setCopyName(`${row.name}（副本）`);
            setCreateOpen(true);
          }}
        >
          复制
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <Alert
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
        message={
          <span>
            还没有合适的标签？
            <a onClick={() => history.push('/tag-center/customer')} style={{ marginLeft: 4 }}>
              先去数据打标
            </a>
            ，再回来新建目标人群。
          </span>
        }
      />
      <ProTable<CrowdItem>
        headerTitle="目标人群"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        scroll={{ x: 1220 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => {
              setCopyName(undefined);
              setCreateOpen(true);
            }}
          >
            新建目标人群
          </Button>,
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
              onlyMine: onlyMine ? 'true' : undefined,
            },
          });
          return res;
        }}
      />
      <CrowdCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        initialName={copyName}
        onSuccess={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default CrowdList;
