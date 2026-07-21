import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable, StatisticCard } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type ProductItem = {
  id: string;
  name: string;
  sku: string;
  platform: string;
  store: string;
  status: string;
  category: string;
  price: string;
  syncedAt: string;
  tagValues: string;
};

const ProductListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [summary, setSummary] = useState({
    productCount: 0,
    skuCount: 0,
    productTotal: 0,
    skuTotal: 0,
  });

  useEffect(() => {
    request('/api/customer-asset/products/summary').then((res) => {
      if (res?.data) setSummary(res.data);
    });
  }, []);

  const columns: ProColumns<ProductItem>[] = [
    {
      title: '平台',
      dataIndex: 'platformSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        惠游重庆: { text: '惠游重庆' },
        国企优品: { text: '国企优品' },
        测试平台: { text: '测试平台' },
      },
    },
    { title: '店铺', dataIndex: 'storeSearch', hideInTable: true },
    { title: '商品ID', dataIndex: 'productId', hideInTable: true },
    { title: '商品标题', dataIndex: 'productTitle', hideInTable: true },
    { title: 'SKU ID', dataIndex: 'skuId', hideInTable: true },
    { title: 'SKU商家编码', dataIndex: 'skuCode', hideInTable: true },
    { title: 'SKU名称', dataIndex: 'skuName', hideInTable: true },
    { title: '商品商家编码', dataIndex: 'productCode', hideInTable: true },
    { title: '标准类目', dataIndex: 'stdCategory', hideInTable: true },
    { title: '自定义类目', dataIndex: 'customCategory', hideInTable: true },
    {
      title: '商品状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        上架: { text: '上架' },
        下架: { text: '下架' },
      },
    },
    {
      title: '库存',
      dataIndex: 'stockRange',
      hideInTable: true,
      valueType: 'digitRange',
    },
    {
      title: '价格',
      dataIndex: 'priceRange',
      hideInTable: true,
      valueType: 'digitRange',
    },
    {
      title: '上架时间',
      dataIndex: 'onlineAt',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '是否有SKU',
      dataIndex: 'hasSku',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        是: { text: '是' },
        否: { text: '否' },
      },
    },
    { title: '商品名称', dataIndex: 'name', search: false },
    { title: 'SKU', dataIndex: 'sku', search: false },
    { title: '平台', dataIndex: 'platform', search: false },
    { title: '店铺', dataIndex: 'store', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      valueEnum: {
        上架: { text: '上架', status: 'Success' },
        下架: { text: '下架', status: 'Default' },
      },
    },
    { title: '类目', dataIndex: 'category', search: false },
    { title: '价格', dataIndex: 'price', search: false },
    { title: '标签值', dataIndex: 'tagValues', search: false },
    { title: '同步时间', dataIndex: 'syncedAt', search: false },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      render: () => [
        <a key="view" onClick={() => message.info('查看商品（演示）')}>
          查看
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProCard ghost gutter={16} style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: '上架商品数', value: summary.productCount }} />
        <StatisticCard statistic={{ title: '上架 SKU 数', value: summary.skuCount }} />
        <StatisticCard statistic={{ title: '商品总数', value: summary.productTotal }} />
        <StatisticCard statistic={{ title: 'SKU 总数', value: summary.skuTotal }} />
      </ProCard>
      <ProTable<ProductItem>
        headerTitle="商品列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        rowSelection={{}}
        request={async (params) => request('/api/customer-asset/products', { params })}
      />
    </PageContainer>
  );
};

export default ProductListPage;
