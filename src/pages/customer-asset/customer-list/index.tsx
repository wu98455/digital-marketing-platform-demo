import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Space } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import RegionSelectModal from './components/RegionSelectModal';
import StoreSelectModal from './components/StoreSelectModal';

export type CustomerItem = {
  id: string;
  customerId: string;
  customerIdMasked: string;
  name?: string;
  age?: number;
  phoneMasked: string;
  memberPhone?: string;
  email?: string;
  province?: string;
  city?: string;
  district?: string;
  gender?: string;
  birthday?: string;
  constellation?: string;
};

/** xlsx：店铺、全渠道客户ID、全渠道会员ID、订单号、手机号、平台账号、姓名、性别、年龄、邮箱、地区、出生日期 */
const CustomerList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<{ id: string; name: string }[]>([]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<{ code: string; name: string }[]>([]);

  const columns: ProColumns<CustomerItem>[] = [
    {
      title: '店铺',
      dataIndex: 'storeFilter',
      hideInTable: true,
      formItemRender: () => (
        <Button type="link" onClick={() => setStoreOpen(true)} style={{ paddingLeft: 0 }}>
          {selectedStores.length > 0
            ? `已选择 ${selectedStores.length} 个`
            : '选择店铺'}
        </Button>
      ),
    },
    {
      title: '全渠道客户ID',
      dataIndex: 'customerId',
      hideInTable: true,
      fieldProps: { placeholder: '请输入全渠道客户ID' },
    },
    {
      title: '全渠道会员ID',
      dataIndex: 'memberId',
      hideInTable: true,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      hideInTable: true,
      fieldProps: { placeholder: '默认基于近两年订单数据' },
      tooltip: '默认基于近两年订单数据筛选客户',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      hideInTable: true,
    },
    {
      title: '平台账号',
      dataIndex: 'platformAccount',
      hideInTable: true,
    },
    {
      title: '姓名',
      dataIndex: 'nameSearch',
      hideInTable: true,
      fieldProps: { placeholder: '请输入姓名' },
    },
    {
      title: '性别',
      dataIndex: 'genderSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        男: { text: '男' },
        女: { text: '女' },
        未知: { text: '未知' },
      },
    },
    {
      title: '年龄',
      dataIndex: 'ageRange',
      hideInTable: true,
      valueType: 'digitRange',
      fieldProps: { placeholder: ['请输入', '请输入'] },
      search: {
        transform: (value) => ({ ageMin: value?.[0], ageMax: value?.[1] }),
      },
    },
    {
      title: '邮箱',
      dataIndex: 'emailSearch',
      hideInTable: true,
    },
    {
      title: '出生日期',
      dataIndex: 'birthdayRange',
      hideInTable: true,
      valueType: 'dateRange',
      fieldProps: { placeholder: ['开始日期', '结束日期'] },
      search: {
        transform: (value) => ({ birthdayStart: value?.[0], birthdayEnd: value?.[1] }),
      },
    },
    {
      title: '地区',
      dataIndex: 'regionFilter',
      hideInTable: true,
      formItemRender: () => (
        <Button type="link" onClick={() => setRegionOpen(true)} style={{ paddingLeft: 0 }}>
          {selectedRegions.length > 0
            ? `已选择 ${selectedRegions.length} 个`
            : '不限地区'}
        </Button>
      ),
    },
    // —— 以下仅表格列，不进查询 ——
    {
      title: '全渠道客户ID',
      dataIndex: 'customerIdMasked',
      search: false,
      copyable: false,
      render: (_, row) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => history.push(`/customer-asset/customer-list/view/${row.id}`)}
        >
          {row.customerIdMasked}
        </Button>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      search: false,
      render: (v) => v ?? '--',
    },
    {
      title: '最新手机号',
      dataIndex: 'phoneMasked',
      search: false,
    },
    {
      title: '会员手机号',
      dataIndex: 'memberPhone',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '省份',
      dataIndex: 'province',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '城市',
      dataIndex: 'city',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '区县',
      dataIndex: 'district',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '生日',
      dataIndex: 'birthday',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '星座',
      dataIndex: 'constellation',
      search: false,
      render: (v) => v || '--',
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<CustomerItem>
        headerTitle="客户列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        toolBarRender={() => [
          <Space key="store">
            {selectedStores.length > 0 && (
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                当前筛选店铺：{selectedStores.map((s) => s.name).join('、')}
              </span>
            )}
          </Space>,
        ]}
        request={async (params) => {
          const res = await request<{
            data: CustomerItem[];
            total: number;
            success: boolean;
          }>('/api/customer-asset/customers', {
            params: {
              ...params,
              name: params.nameSearch || params.name,
              phone: params.phone,
              customerId: params.customerId,
              storeIds: selectedStores.map((s) => s.id).join(','),
              regionCodes: selectedRegions.map((r) => r.code).join(','),
            },
          });
          return res;
        }}
      />
      <StoreSelectModal
        open={storeOpen}
        value={selectedStores}
        onCancel={() => setStoreOpen(false)}
        onOk={(rows) => {
          setSelectedStores(rows);
          setStoreOpen(false);
          actionRef.current?.reload();
        }}
      />
      <RegionSelectModal
        open={regionOpen}
        value={selectedRegions}
        onCancel={() => setRegionOpen(false)}
        onOk={(rows) => {
          setSelectedRegions(rows);
          setRegionOpen(false);
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default CustomerList;
