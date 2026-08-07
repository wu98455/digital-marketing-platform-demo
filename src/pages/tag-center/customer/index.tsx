import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation } from '@umijs/max';
import { Alert, Button, Space } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  TagChips,
  TagLibraryDrawer,
  TagPickerModal,
  flattenGroups,
  remapTagInOverrides,
  removeTagFromOverrides,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import RegionSelectModal from '@/pages/customer-asset/customer-list/components/RegionSelectModal';
import StoreSelectModal from '@/pages/customer-asset/customer-list/components/StoreSelectModal';

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
  storeName?: string;
  tags?: { group: string; tags: string[] }[];
};

const seedTags = (id: string): TagItem[] => {
  const n = Number(String(id).replace(/\D/g, '') || 0);
  if (n % 5 === 0) return [];
  if (n % 3 === 0) {
    return [
      { group: '客户价值', tag: '高价值' },
      { group: '生命周期', tag: '活跃' },
    ];
  }
  if (n % 2 === 0) {
    return [
      { group: '兴趣偏好', tag: '亲子游' },
      { group: '生命周期', tag: '新客' },
    ];
  }
  return [{ group: '客户价值', tag: '大会员' }];
};

type Props = {
  showTaggingTip?: boolean;
  headerTitle?: string;
};

const CustomerTaggingList: React.FC<Props> = ({
  showTaggingTip = true,
  headerTitle = '客户 · 打标',
}) => {
  const location = useLocation();
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');
  const actionRef = useRef<ActionType | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<{ id: string; name: string }[]>([]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<{ code: string; name: string }[]>([]);
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [selectedRows, setSelectedRows] = useState<CustomerItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'replace' | 'append'>('replace');
  const [currentRow, setCurrentRow] = useState<CustomerItem>();

  const viewBase = location.pathname.startsWith('/tag-center')
    ? '/tag-center/customer'
    : '/customer-asset/customer-list';

  const getTags = (row: CustomerItem): TagItem[] => {
    if (tagOverrides[row.id]) return tagOverrides[row.id];
    if (row.tags?.length) return flattenGroups(row.tags);
    return seedTags(row.id);
  };

  const countUsage = (item: TagItem) => {
    const key = tagKey(item);
    let n = 0;
    for (let i = 1; i <= 48; i += 1) {
      const id = `c${i}`;
      const tags = tagOverrides[id] || seedTags(id);
      if (tags.some((t) => tagKey(t) === key)) n += 1;
    }
    return n;
  };

  const openSingle = (row: CustomerItem) => {
    setCurrentRow(row);
    setPickerMode('replace');
    setPickerOpen(true);
  };

  const openBatch = () => {
    setCurrentRow(undefined);
    setPickerMode('append');
    setPickerOpen(true);
  };

  const tagFilterOptions = useMemo(
    () =>
      catalog.flatMap((g) =>
        g.tags.map((t) => ({ label: `${g.group}/${t}`, value: `${g.group}::${t}` })),
      ),
    [catalog],
  );

  const columns: ProColumns<CustomerItem>[] = [
    {
      title: '店铺',
      dataIndex: 'storeFilter',
      hideInTable: true,
      formItemRender: () => (
        <Button type="link" onClick={() => setStoreOpen(true)} style={{ paddingLeft: 0 }}>
          {selectedStores.length > 0 ? `已选择 ${selectedStores.length} 个` : '选择店铺'}
        </Button>
      ),
    },
    {
      title: '全渠道客户ID',
      dataIndex: 'customerId',
      hideInTable: true,
      fieldProps: { placeholder: '请输入全渠道客户ID' },
    },
    { title: '手机号', dataIndex: 'phone', hideInTable: true },
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
      title: '地区',
      dataIndex: 'regionFilter',
      hideInTable: true,
      formItemRender: () => (
        <Button type="link" onClick={() => setRegionOpen(true)} style={{ paddingLeft: 0 }}>
          {selectedRegions.length > 0 ? `已选择 ${selectedRegions.length} 个` : '不限地区'}
        </Button>
      ),
    },
    {
      title: '客户标签',
      dataIndex: 'tagFilter',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: tagFilterOptions,
        placeholder: '按已打标签筛选',
      },
    },
    {
      title: '全渠道客户ID',
      dataIndex: 'customerIdMasked',
      search: false,
      render: (_, row) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => history.push(`${viewBase}/view/${row.id}`)}>
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
      title: '最新手机号',
      dataIndex: 'phoneMasked',
      search: false,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      search: false,
      width: 72,
      render: (v) => v || '--',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      search: false,
      width: 72,
      render: (v) => v ?? '--',
    },
    {
      title: '省市',
      dataIndex: 'province',
      search: false,
      render: (_, row) => [row.province, row.city].filter(Boolean).join(' ') || '--',
    },
    {
      title: '关联店铺',
      dataIndex: 'storeName',
      search: false,
      render: (_, row) => row.storeName || selectedStores[0]?.name || '惠游重庆',
    },
    {
      title: '已打标签',
      dataIndex: 'tags',
      search: false,
      width: 260,
      render: (_, row) => (
        <TagChips tags={getTags(row)} catalog={catalog} onClick={() => openSingle(row)} />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 120,
      render: (_, row) => [
        <a key="tag" onClick={() => openSingle(row)}>
          打标
        </a>,
        <a key="view" onClick={() => history.push(`${viewBase}/view/${row.id}`)}>
          查看
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      {showTaggingTip ? (
        <Alert
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          message="标签像贴纸：一条数据可贴多个；贴好后可在「目标人群」里用来圈人。可用「管理标签库」增删改标签。"
        />
      ) : null}
      <ProTable<CustomerItem>
        headerTitle={headerTitle}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        rowSelection={{
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        toolBarRender={() => [
          <Button key="lib" onClick={() => setLibraryOpen(true)}>
            管理标签库
          </Button>,
          <Button
            key="batch"
            type="primary"
            disabled={!selectedRows.length}
            onClick={openBatch}
          >
            批量打标{selectedRows.length ? `（${selectedRows.length}）` : ''}
          </Button>,
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
          const tagFilter = (params.tagFilter as string[]) || [];
          let data = res.data || [];
          if (tagFilter.length) {
            data = data.filter((row) => {
              const keys = new Set(getTags(row).map((t) => `${t.group}::${t.tag}`));
              return tagFilter.every((k) => keys.has(k));
            });
          }
          return { ...res, data, total: tagFilter.length ? data.length : res.total };
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
      <TagPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={
          pickerMode === 'append'
            ? `批量打标 · 已选 ${selectedRows.length} 人`
            : `客户打标 · ${currentRow?.name || currentRow?.customerIdMasked || ''}`
        }
        catalog={catalog}
        mode={pickerMode}
        value={
          pickerMode === 'append' ? [] : currentRow ? getTags(currentRow) : []
        }
        onSave={(next) => {
          if (pickerMode === 'append') {
            setTagOverrides((prev) => {
              const map = { ...prev };
              selectedRows.forEach((row) => {
                const base = getTags(row);
                const merged = new Map(base.map((t) => [`${t.group}::${t.tag}`, t]));
                next.forEach((t) => merged.set(`${t.group}::${t.tag}`, t));
                map[row.id] = Array.from(merged.values());
              });
              return map;
            });
            setSelectedRows([]);
          } else if (currentRow) {
            setTagOverrides((prev) => ({ ...prev, [currentRow.id]: next }));
          }
          actionRef.current?.reload();
        }}
      />
      <TagLibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        kind="customer"
        countUsage={countUsage}
        onRenameApply={(from, to) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            for (let i = 1; i <= 48; i += 1) {
              const id = `c${i}`;
              if (!base[id]) base[id] = seedTags(id);
            }
            return remapTagInOverrides(base, from, to);
          });
          actionRef.current?.reload();
        }}
        onDeleteApply={(item) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            for (let i = 1; i <= 48; i += 1) {
              const id = `c${i}`;
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

export default CustomerTaggingList;
