import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Alert, Button, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  TagChips,
  TagLibraryDrawer,
  parseFlatTags,
  remapTagInOverrides,
  removeTagFromOverrides,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import { goDataTagCreate } from '../utils/dataTagCreate';

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

const PRODUCT_SEED_COUNT = 20;

const seedTagValues = (id: string): string => {
  const n = Number(String(id).replace(/\D/g, '') || 0);
  const i = Math.max(n - 1, 0);
  return i % 3 === 0 ? '热销,推荐' : '--';
};

const ProductTaggingPage: React.FC = () => {
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('product');
  const actionRef = useRef<ActionType | null>(null);
  const [summary, setSummary] = useState({
    productCount: 0,
    skuCount: 0,
    productTotal: 0,
    skuTotal: 0,
  });
  const [selectedRows, setSelectedRows] = useState<ProductItem[]>([]);
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    request('/api/customer-asset/products/summary').then((res) => {
      if (res?.data) setSummary(res.data);
    });
  }, []);

  const resolveFlat = (raw: string): TagItem[] =>
    parseFlatTags(raw, '销售策略').map((t) => {
      const found = catalog.find((g) => g.tags.includes(t.tag));
      return { group: found?.group || t.group, tag: t.tag };
    });

  const seedTags = (id: string): TagItem[] => resolveFlat(seedTagValues(id));

  const getTags = (row: ProductItem): TagItem[] => {
    if (tagOverrides[row.id]) return tagOverrides[row.id];
    return resolveFlat(row.tagValues);
  };

  const countUsage = (item: TagItem) => {
    const key = tagKey(item);
    let n = 0;
    for (let i = 1; i <= PRODUCT_SEED_COUNT; i += 1) {
      const id = `p${i}`;
      const tags = tagOverrides[id] || seedTags(id);
      if (tags.some((t) => tagKey(t) === key)) n += 1;
    }
    return n;
  };

  const goTagRow = (row: ProductItem) =>
    goDataTagCreate('product', [{ id: row.id, name: row.name }]);

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
    { title: '商品标题', dataIndex: 'productTitle', hideInTable: true },
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
      title: '商品标签',
      dataIndex: 'tagFilter',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: catalog.flatMap((g) =>
          g.tags.map((t) => ({ label: `${g.group}/${t}`, value: t })),
        ),
        placeholder: '按已打标签筛选',
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
    {
      title: '已打标签',
      dataIndex: 'tagValues',
      search: false,
      width: 240,
      render: (_, row) => (
        <TagChips
          tags={getTags(row)}
          catalog={catalog}
          onClick={() => goTagRow(row)}
        />
      ),
    },
    { title: '同步时间', dataIndex: 'syncedAt', search: false },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 120,
      render: (_, row) => [
        <a key="tag" onClick={() => goTagRow(row)}>
          打标
        </a>,
        <a key="view" onClick={() => message.info('查看商品（演示）')}>
          查看
        </a>,
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
        message="商品标签像贴纸：点色块贴上；可用于人群工坊圈选「买过某类商品」的人。"
      />
      <ProCard ghost gutter={16} style={{ marginBottom: 16 }}>
        <StatisticCard statistic={{ title: '上架商品数', value: summary.productCount }} />
        <StatisticCard statistic={{ title: '上架 SKU 数', value: summary.skuCount }} />
        <StatisticCard statistic={{ title: '商品总数', value: summary.productTotal }} />
        <StatisticCard statistic={{ title: 'SKU 总数', value: summary.skuTotal }} />
      </ProCard>
      <ProTable<ProductItem>
        headerTitle="商品 · 打标"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
        toolBarRender={() => [
          <Button key="lib" onClick={() => setLibraryOpen(true)}>
            管理标签库
          </Button>,
          <Button
            key="batchTag"
            type="primary"
            disabled={!selectedRows.length}
            onClick={() =>
              goDataTagCreate(
                'product',
                selectedRows.map((r) => ({ id: r.id, name: r.name })),
              )
            }
          >
            批量打标{selectedRows.length ? `（${selectedRows.length}）` : ''}
          </Button>,
        ]}
        request={async (params) => {
          const res = await request<{ data: ProductItem[]; total: number; success: boolean }>(
            '/api/customer-asset/products',
            { params },
          );
          const tagFilter = (params.tagFilter as string[]) || [];
          let data = res.data || [];
          if (tagFilter.length) {
            data = data.filter((row) => {
              const tags = getTags(row).map((t) => t.tag);
              return tagFilter.every((t) => tags.includes(t));
            });
          }
          return { ...res, data, total: tagFilter.length ? data.length : res.total };
        }}
      />
      <TagLibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        kind="product"
        countUsage={countUsage}
        onRenameApply={(from, to) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            for (let i = 1; i <= PRODUCT_SEED_COUNT; i += 1) {
              const id = `p${i}`;
              if (!base[id]) base[id] = seedTags(id);
            }
            return remapTagInOverrides(base, from, to);
          });
          actionRef.current?.reload();
        }}
        onDeleteApply={(item) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            for (let i = 1; i <= PRODUCT_SEED_COUNT; i += 1) {
              const id = `p${i}`;
              if (!base[id]) base[id] = seedTags(id);
            }
            return removeTagFromOverrides(base, item);
          });
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default ProductTaggingPage;
