import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormSelect, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, Upload, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type BatchItem = {
  id: string;
  batchNo: string;
  level: string;
  platform: string;
  store: string;
  group: string;
  matchKey: string;
  status: string;
  successCount: number;
  failCount: number;
  createdAt: string;
};

const TaggedImportPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const columns: ProColumns<BatchItem>[] = [
    {
      title: '平台',
      dataIndex: 'platformSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部平台: { text: '全部平台' },
        测试平台: { text: '测试平台' },
        惠游重庆: { text: '惠游重庆' },
      },
    },
    {
      title: '状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        成功: { text: '成功' },
        失败: { text: '失败' },
        处理中: { text: '处理中' },
      },
    },
    { title: '批次', dataIndex: 'batchNoSearch', hideInTable: true },
    { title: '批次号', dataIndex: 'batchNo', search: false },
    { title: '层级', dataIndex: 'level', search: false },
    { title: '平台', dataIndex: 'platform', search: false },
    { title: '店铺', dataIndex: 'store', search: false },
    { title: '分组', dataIndex: 'group', search: false },
    { title: '匹配标识', dataIndex: 'matchKey', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      valueEnum: {
        成功: { text: '成功', status: 'Success' },
        失败: { text: '失败', status: 'Error' },
        处理中: { text: '处理中', status: 'Processing' },
      },
    },
    { title: '成功数', dataIndex: 'successCount', search: false },
    { title: '失败数', dataIndex: 'failCount', search: false },
    { title: '创建时间', dataIndex: 'createdAt', search: false },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<BatchItem>
        headerTitle="已打标客户导入"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        toolBarRender={() => [
          <Button key="import" type="primary" onClick={() => setImportOpen(true)}>
            导入客户
          </Button>,
        ]}
        request={async (params) => request('/api/customer-asset/tags/import', { params })}
      />

      <ModalForm
        title="导入客户"
        open={importOpen}
        onOpenChange={setImportOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success('匹配客户并执行打标（演示）');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormSelect
          name="level"
          label="标签层级"
          options={[
            { label: '店铺标签', value: '店铺标签' },
            { label: '全渠道标签', value: '全渠道标签' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="group"
          label="分组"
          options={[
            { label: '客户价值', value: '客户价值' },
            { label: '生命周期', value: '生命周期' },
            { label: 'RFM', value: 'RFM' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="matchKey"
          label="匹配标识"
          options={[
            { label: '手机号', value: '手机号' },
            { label: '全渠道客户ID', value: '全渠道客户ID' },
            { label: '平台账号', value: '平台账号' },
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

export default TaggedImportPage;
