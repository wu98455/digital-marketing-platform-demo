import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import React from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type Row = {
  id: string;
  customerId: string;
  tagName: string;
  nickname: string;
  openId: string;
  group: string;
  corp: string;
};

/** xlsx：全渠道客户ID、标签名称、微信昵称、微信OpenID、标签分组名称、企业微信名称 */
const WecomTagPage: React.FC = () => {
  const columns: ProColumns<Row>[] = [
    { title: '全渠道客户ID', dataIndex: 'customerId' },
    { title: '标签名称', dataIndex: 'tagName' },
    { title: '微信昵称', dataIndex: 'nickname' },
    { title: '微信OpenID', dataIndex: 'openId' },
    { title: '标签分组名称', dataIndex: 'group' },
    {
      title: '企业微信名称',
      dataIndex: 'corp',
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        重庆文旅企微: { text: '重庆文旅企微' },
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<Row>
        headerTitle="企业微信标签"
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        request={async (params) => request('/api/customer-asset/tags/wecom', { params })}
      />
    </PageContainer>
  );
};

export default WecomTagPage;
