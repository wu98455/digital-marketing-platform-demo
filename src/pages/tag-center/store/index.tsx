import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Alert, Button, message } from 'antd';
import React, { useRef, useState } from 'react';
import {
  TagChips,
  TagLibraryDrawer,
  remapTagInOverrides,
  removeTagFromOverrides,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import { goDataTagCreate } from '../utils/dataTagCreate';

type StoreItem = {
  id: string;
  name: string;
  storeId: string;
  platform: string;
  type: string;
  operateType?: string;
  area?: string;
  attr?: string;
  tags?: TagItem[];
};

/** 演示用量统计用的种子行（与 mock stores s1–s5 对齐） */
const SEED_STORE_ROWS: Pick<StoreItem, 'id' | 'name' | 'operateType' | 'attr'>[] = [
  { id: 's1', name: '测试店铺', operateType: '自营', attr: '线上' },
  { id: 's2', name: '国企优品', operateType: '自营', attr: '线上' },
  { id: 's3', name: '重庆文旅集团大会员', operateType: '自营', attr: '线上' },
  { id: 's4', name: '惠游重庆', operateType: '自营', attr: '线上' },
  { id: 's5', name: '惠游向导', operateType: '三方', attr: '线下' },
];

const seedTags = (row: Pick<StoreItem, 'name' | 'operateType' | 'attr'>): TagItem[] => {
  if (row.operateType === '三方') return [{ group: '经营属性', tag: '三方合作' }];
  if (row.attr === '线下') return [{ group: '区域特征', tag: '周边景区' }];
  if (row.name.includes('惠游')) {
    return [
      { group: '经营属性', tag: '自营重点' },
      { group: '运营状态', tag: '高转化' },
    ];
  }
  return [{ group: '经营属性', tag: '旗舰店' }];
};

const seedTagsById = (id: string): TagItem[] => {
  const row = SEED_STORE_ROWS.find((s) => s.id === id);
  return row ? seedTags(row) : [];
};

const StoreTaggingPage: React.FC = () => {
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('store');
  const actionRef = useRef<ActionType | null>(null);
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [selectedRows, setSelectedRows] = useState<StoreItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const getTags = (row: StoreItem) => tagOverrides[row.id] || row.tags || seedTags(row);

  const countUsage = (item: TagItem) => {
    const key = tagKey(item);
    let n = 0;
    SEED_STORE_ROWS.forEach(({ id }) => {
      const tags = tagOverrides[id] || seedTagsById(id);
      if (tags.some((t) => tagKey(t) === key)) n += 1;
    });
    return n;
  };

  const goTagRow = (row: StoreItem) =>
    goDataTagCreate('store', [{ id: row.id, name: row.name }]);

  const columns: ProColumns<StoreItem>[] = [
    {
      title: '平台',
      dataIndex: 'platformSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        不限: { text: '不限' },
        惠游重庆: { text: '惠游重庆' },
        国企优品: { text: '国企优品' },
        测试平台: { text: '测试平台' },
        重庆文旅集团大会员: { text: '重庆文旅集团大会员' },
      },
      initialValue: '不限',
    },
    {
      title: '经营类型',
      dataIndex: 'operateTypeSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        不限: { text: '不限' },
        自营: { text: '自营' },
        三方: { text: '三方' },
      },
      initialValue: '不限',
    },
    { title: '店铺名称', dataIndex: 'nameSearch', hideInTable: true },
    { title: '区域', dataIndex: 'areaSearch', hideInTable: true },
    { title: '店铺名称', dataIndex: 'name', search: false },
    { title: '店铺ID', dataIndex: 'storeId', search: false, width: 100 },
    { title: '平台', dataIndex: 'platform', search: false },
    { title: '店铺类型', dataIndex: 'type', search: false, width: 110 },
    {
      title: '经营类型',
      dataIndex: 'operateType',
      search: false,
      width: 100,
      render: (v) => v || '自营',
    },
    {
      title: '区域 / 属性',
      dataIndex: 'area',
      search: false,
      render: (_, row) => [row.area, row.attr].filter(Boolean).join(' · ') || '--',
    },
    {
      title: '已打标签',
      dataIndex: 'tags',
      search: false,
      width: 240,
      render: (_, row) => (
        <TagChips tags={getTags(row)} catalog={catalog} onClick={() => goTagRow(row)} />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 120,
      render: (_, row) => [
        <a key="tag" onClick={() => goTagRow(row)}>
          打标
        </a>,
        <a key="view" onClick={() => message.info(`查看店铺「${row.name}」（演示）`)}>
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
        message="店铺标签用于圈人条件（如「曾在自营重点店下单」），结果永远是人包。"
      />
      <ProTable<StoreItem>
        headerTitle="店铺 · 打标"
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
                'store',
                selectedRows.map((r) => ({ id: r.id, name: r.name })),
              )
            }
          >
            批量打标{selectedRows.length ? `（${selectedRows.length}）` : ''}
          </Button>,
        ]}
        request={async (params) => {
          const res = await request<{ data: StoreItem[]; total: number; success: boolean }>(
            '/api/customer-asset/stores',
            { params },
          );
          let data = (res.data || []).map((s) => ({
            ...s,
            operateType: s.operateType || '自营',
          }));
          if (params.platformSearch && params.platformSearch !== '不限') {
            data = data.filter((x) => x.platform === params.platformSearch);
          }
          if (params.operateTypeSearch && params.operateTypeSearch !== '不限') {
            data = data.filter((x) => (x.operateType || '自营') === params.operateTypeSearch);
          }
          if (params.nameSearch) {
            data = data.filter((x) => x.name.includes(String(params.nameSearch)));
          }
          if (params.areaSearch) {
            data = data.filter((x) => (x.area || '').includes(String(params.areaSearch)));
          }
          return { ...res, data, total: data.length };
        }}
      />
      <TagLibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        kind="store"
        countUsage={countUsage}
        onRenameApply={(from, to) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            SEED_STORE_ROWS.forEach(({ id }) => {
              if (!base[id]) base[id] = seedTagsById(id);
            });
            return remapTagInOverrides(base, from, to);
          });
          actionRef.current?.reload();
        }}
        onDeleteApply={(item) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            SEED_STORE_ROWS.forEach(({ id }) => {
              if (!base[id]) base[id] = seedTagsById(id);
            });
            return removeTagFromOverrides(base, item);
          });
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default StoreTaggingPage;
