import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation } from '@umijs/max';
import { Button, Space } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import TitleWithTip from '@/components/TitleWithTip';
import {
  TagChips,
  flattenGroups,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { MARKETING_CENTERS } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import RegionSelectModal from '@/pages/customer-asset/customer-list/components/RegionSelectModal';
import StoreSelectModal from '@/pages/customer-asset/customer-list/components/StoreSelectModal';

export type CustomerItem = {
  id: string;
  customerId: string;
  customerIdMasked: string;
  oneId?: string;
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
  tagInstances?: { group: string; tag: string; source?: string }[];
  centers?: string[];
};

const seedCenters = (id: string): string[] => {
  const n = Number(String(id).replace(/\D/g, '') || 0);
  return [MARKETING_CENTERS[n % MARKETING_CENTERS.length]];
};

/** 人员标签只读展示，来源于人群标签规则命中（演示种子） */
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
  headerTitle?: string;
};

const CustomerTaggingList: React.FC<Props> = ({ headerTitle }) => {
  const location = useLocation();
  const resolvedTitle =
    headerTitle ||
    (location.pathname.startsWith('/tag-center/customer') ? '人员数据' : '会员标签');
  const titleTip = '人员标签由人群标签规则命中产生，本页仅查看，不可手动打标。';
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');
  const actionRef = useRef<ActionType | null>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<{ id: string; name: string }[]>([]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<{ code: string; name: string }[]>([]);

  const viewBase = location.pathname.startsWith('/tag-center')
    ? '/tag-center/customer'
    : '/customer-asset/customer-list';

  const getTags = (row: CustomerItem): TagItem[] => {
    if (row.tagInstances?.length) {
      return row.tagInstances.map((t) => ({ group: t.group, tag: t.tag }));
    }
    if (row.tags?.length) return flattenGroups(row.tags);
    return seedTags(row.id);
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
    { title: '手机号', dataIndex: 'phone', hideInTable: true },
    {
      title: '人员 OneID',
      dataIndex: 'oneIdSearch',
      hideInTable: true,
      fieldProps: { placeholder: '如 OID202608120001' },
    },
    {
      title: '姓名',
      dataIndex: 'nameSearch',
      hideInTable: true,
      fieldProps: { placeholder: '请输入姓名' },
    },
    {
      title: '分中心',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
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
      title: '人员标签',
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
      title: '序号',
      dataIndex: 'index',
      search: false,
      width: 64,
      render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
    },
    {
      title: '人员 OneID',
      dataIndex: 'oneId',
      search: false,
      width: 150,
      render: (_, row) =>
        row.oneId || `OID20260812${String(row.id).replace(/\D/g, '').padStart(4, '0')}`,
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
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 180,
      render: (_, row) => (
        <CenterTags centers={row.centers?.length ? row.centers : seedCenters(row.id)} />
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      search: false,
      width: 280,
      render: (_, row) => (
        <TagChips tags={getTags(row)} catalog={catalog} emptyText="暂无标签" />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 80,
      render: (_, row) => [
        <a key="view" onClick={() => history.push(`${viewBase}/view/${row.id}`)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<CustomerItem>
        headerTitle={<TitleWithTip title={resolvedTitle} tip={titleTip} />}
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
              oneId: params.oneIdSearch,
              center: params.centerSearch,
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
    </PageContainer>
  );
};

export default CustomerTaggingList;
