import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProFormSwitch, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Checkbox, Modal, Space, Tree, message } from 'antd';
import React, { useRef, useState } from 'react';
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

const treeData = [
  {
    title: '所有',
    key: '所有',
    children: [
      { title: '文旅营销', key: '文旅营销' },
      { title: '业务目录', key: '业务目录' },
      { title: '未分类', key: '未分类' },
    ],
  },
];

const ActivityList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [catalog, setCatalog] = useState('所有');
  const [createOpen, setCreateOpen] = useState(false);
  const [onlyPeriodic, setOnlyPeriodic] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [pendingApprove, setPendingApprove] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ActivityItem[]>([]);

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
      width: 220,
      search: false,
      render: (_, row) => [
        <a key="pin" onClick={() => message.success('已置顶（演示）')}>
          置顶
        </a>,
        <a key="copy" onClick={() => message.success('已复制（演示）')}>
          复制
        </a>,
        <Button
          key="edit"
          type="link"
          size="small"
          style={{ padding: 0 }}
          disabled={!row.canEdit}
          onClick={() => history.push(`/crowd-marketing/activity/design/${row.id}`)}
        >
          编辑
        </Button>,
        <a key="data" onClick={() => message.info('活动数据（演示）')}>
          数据
        </a>,
        <Button
          key="del"
          type="link"
          size="small"
          style={{ padding: 0 }}
          disabled={!row.canDelete}
          onClick={() =>
            Modal.confirm({
              title: '确认删除该活动？',
              onOk: () => {
                message.success('已删除（演示）');
                actionRef.current?.reload();
              },
            })
          }
        >
          删除
        </Button>,
        <a key="export" onClick={() => message.success('已导出（演示）')}>
          导出
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
          <ProTable<ActivityItem>
            headerTitle="营销活动"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
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
          options={[
            { label: '文旅营销', value: '文旅营销' },
            { label: '业务目录', value: '业务目录' },
            { label: '未分类', value: '未分类' },
          ]}
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
    </PageContainer>
  );
};

export default ActivityList;
