import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import React from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type Row = {
  id: string;
  customerId: string;
  shop: string;
  tagName: string;
  tagValue: string;
  wid: string;
};

/** xlsx：全渠道客户ID、微盟店铺、标签组名称、标签值、微盟客户ID(WID) */
const WeimobTagPage: React.FC = () => {
  const columns: ProColumns<Row>[] = [
    { title: '全渠道客户ID', dataIndex: 'customerId' },
    { title: '微盟店铺', dataIndex: 'shop' },
    { title: '标签组名称', dataIndex: 'tagName' },
    { title: '标签值', dataIndex: 'tagValue' },
    { title: '微盟客户ID(WID)', dataIndex: 'wid' },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<Row>
        headerTitle="微盟标签"
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        request={async (params) => request('/api/customer-asset/tags/weimob', { params })}
      />
    </PageContainer>
  );
};

export default WeimobTagPage;
