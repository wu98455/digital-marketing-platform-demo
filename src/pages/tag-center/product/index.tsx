import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import TitleWithTip from '@/components/TitleWithTip';
import {
  TagChips,
  TagLibraryDrawer,
  TagPickerModal,
  parseFlatTags,
  remapTagInOverrides,
  removeTagFromOverrides,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { MARKETING_CENTERS } from '@/utils/centers';
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
  centers?: string[];
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
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });
  const [summary, setSummary] = useState({
    productCount: 0,
    skuCount: 0,
    productTotal: 0,
    skuTotal: 0,
  });
  const [selectedRows, setSelectedRows] = useState<ProductItem[]>([]);
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRows, setPickerRows] = useState<ProductItem[]>([]);
  const [pickerValue, setPickerValue] = useState<TagItem[]>([]);
  const [pickerMode, setPickerMode] = useState<'replace' | 'append'>('replace');

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

  const openTagPicker = (rows: ProductItem[], mode: 'replace' | 'append') => {
    if (!rows.length) return;
    setPickerRows(rows);
    setPickerMode(mode);
    setPickerValue(mode === 'replace' ? getTags(rows[0]) : []);
    setPickerOpen(true);
  };

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
      title: '分中心',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
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
    {
      title: '序号',
      dataIndex: 'index',
      search: false,
      width: 64,
      render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
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
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 180,
      render: (_, row) => {
        const n = Number(String(row.id).replace(/\D/g, '') || 0);
        const fallback = [MARKETING_CENTERS[Math.max(n - 1, 0) % MARKETING_CENTERS.length]];
        return <CenterTags centers={row.centers?.length ? row.centers : fallback} />;
      },
    },
    {
      title: '标签',
      dataIndex: 'tagValues',
      search: false,
      width: 240,
      render: (_, row) => (
        <TagChips
          tags={getTags(row)}
          catalog={catalog}
          emptyText="点击打标"
          onClick={() => openTagPicker([row], 'replace')}
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
        <a key="tag" onClick={() => openTagPicker([row], 'replace')}>
          打标
        </a>,
        <a key="view" onClick={() => history.push(`/tag-center/product/view/${row.id}`)}>
          详情
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
        headerTitle={
          <TitleWithTip
            title="商品数据 · 打标"
            tip="商品标签可在本页直接手动打标，用于人群工坊圈选「买过某类商品」的人。"
          />
        }
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={{
          ...listPagination,
          current: pageInfo.current,
          pageSize: pageInfo.pageSize,
          onChange: (current: number, pageSize: number) =>
            setPageInfo({ current, pageSize: pageSize || pageInfo.pageSize }),
        } as any}
        rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
        toolBarRender={() => [
          <Button key="lib" onClick={() => setLibraryOpen(true)}>
            管理标签库
          </Button>,
          <Button
            key="batchTag"
            type="primary"
            disabled={!selectedRows.length}
            onClick={() => openTagPicker(selectedRows, 'append')}
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
          if (params.centerSearch) {
            data = data.filter((x) => {
              const n = Number(String(x.id).replace(/\D/g, '') || 0);
              const centers = x.centers?.length
                ? x.centers
                : [MARKETING_CENTERS[Math.max(n - 1, 0) % MARKETING_CENTERS.length]];
              return centers.includes(String(params.centerSearch));
            });
          }
          return { ...res, data, total: data.length };
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
      <TagPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={
          pickerRows.length > 1
            ? `批量打标 · ${pickerRows.length} 个商品`
            : `打标签 · ${pickerRows[0]?.name || ''}`
        }
        catalog={catalog}
        mode={pickerMode}
        value={pickerValue}
        onSave={(next) => {
          if (!pickerRows.length) return;
          setTagOverrides((prev) => {
            const copy = { ...prev };
            pickerRows.forEach((row) => {
              if (pickerMode === 'append') {
                const map = new Map<string, TagItem>();
                getTags(row).forEach((t) => map.set(tagKey(t), t));
                next.forEach((t) => map.set(tagKey(t), t));
                copy[row.id] = Array.from(map.values());
              } else {
                copy[row.id] = next;
              }
            });
            return copy;
          });
        }}
      />
    </PageContainer>
  );
};

export default ProductTaggingPage;
