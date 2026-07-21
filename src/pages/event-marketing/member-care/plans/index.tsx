import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Modal, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type PlanItem = {
  id: string;
  name: string;
  scene: string;
  memberCard: string;
  status: string;
  triggerType: string;
  execTime: string;
  creator: string;
  createdAt: string;
};

const statusColor: Record<string, string> = {
  草稿: 'default',
  启用: 'processing',
  停用: 'warning',
};

const PlansPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const columns: ProColumns<PlanItem>[] = [
    { title: '计划名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '场景',
      dataIndex: 'sceneSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        新会员入会关怀: { text: '新会员入会关怀' },
        会员等级升级关怀: { text: '会员等级升级关怀' },
        会员积分到账通知: { text: '会员积分到账通知' },
        生日关怀: { text: '生日关怀' },
      },
      initialValue: '全部',
    },
    {
      title: '状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        草稿: { text: '草稿' },
        启用: { text: '启用' },
        停用: { text: '停用' },
      },
      initialValue: '全部',
    },
    { title: '计划ID', dataIndex: 'id', search: false, width: 100 },
    { title: '计划名称', dataIndex: 'name', search: false },
    { title: '所属场景', dataIndex: 'scene', search: false, width: 140 },
    { title: '会员卡', dataIndex: 'memberCard', search: false, width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (_, row) => <Tag color={statusColor[row.status]}>{row.status}</Tag>,
    },
    { title: '触发方式', dataIndex: 'triggerType', search: false, width: 90 },
    { title: '执行时间', dataIndex: 'execTime', search: false, width: 90 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      search: false,
      render: (_, row) => [
        <a key="edit" onClick={() => message.info('编辑计划（演示）')}>
          编辑
        </a>,
        row.status === '启用' ? (
          <a
            key="pause"
            onClick={() =>
              Modal.confirm({
                title: '停用该计划？',
                onOk: () => message.success('已停用（演示）'),
              })
            }
          >
            停用
          </a>
        ) : (
          <a key="start" onClick={() => message.success('已启用（演示）')}>
            启用
          </a>
        ),
        <a key="copy" onClick={() => message.success('已复制（演示）')}>
          复制
        </a>,
        <a
          key="del"
          onClick={() =>
            Modal.confirm({
              title: '确认删除该计划？',
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
      <ProTable<PlanItem>
        headerTitle="营销计划"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        toolBarRender={() => [
          <Button key="scene" onClick={() => history.push('/event-marketing/member-care/scenarios')}>
            从场景创建
          </Button>,
          <Button key="add" type="primary" onClick={() => setCreateOpen(true)}>
            新建计划
          </Button>,
        ]}
        request={async (params) =>
          request('/api/event-marketing/plans', {
            params: {
              ...params,
              keyword: params.keyword,
              scene: params.sceneSearch !== '全部' ? params.sceneSearch : undefined,
              status: params.statusSearch !== '全部' ? params.statusSearch : undefined,
            },
          })
        }
      />

      <ModalForm
        title="新建营销计划"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          message.success(`已创建「${values.name}」（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormSelect
          name="scene"
          label="营销场景"
          options={[
            { label: '新会员入会关怀', value: '新会员入会关怀' },
            { label: '会员等级升级关怀', value: '会员等级升级关怀' },
            { label: '会员积分到账通知', value: '会员积分到账通知' },
            { label: '生日关怀', value: '生日关怀' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="memberCard"
          label="会员卡"
          options={[
            { label: '文旅大会员卡', value: '文旅大会员卡' },
            { label: '惠游会员卡', value: '惠游会员卡' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="name" label="计划名称" rules={[{ required: true }]} />
        <ProFormTextArea name="desc" label="计划说明" />
        <ProFormSelect
          name="triggerType"
          label="触发方式"
          options={[
            { label: '即时', value: '即时' },
            { label: '定时', value: '定时' },
            { label: '周期', value: '周期' },
          ]}
          initialValue="即时"
        />
        <ProFormSelect
          name="execTime"
          label="执行时间"
          options={[
            { label: '始终', value: '始终' },
            { label: '30天', value: '30天' },
            { label: '自定义', value: '自定义' },
          ]}
          initialValue="始终"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default PlansPage;
