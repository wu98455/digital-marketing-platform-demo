import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation } from '@umijs/max';
import { Cascader } from 'antd';
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
import { REGION_CASCADE } from '@/utils/tagRuleTypes';

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
  tags?: { group: string; tags: string[] }[];
  tagInstances?: { group: string; tag: string; source?: string }[];
  centers?: string[];
  userType?: string;
  availablePoints?: number;
  orderCount?: number;
  consumeAmount?: number;
  pointsExchangeOrderCount?: number;
  enterWay?: string;
  registeredAt?: string;
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
      { group: '消费类', tag: '近90天订单金额大于等于500' },
      { group: '行为类', tag: '近7天有登录' },
    ];
  }
  if (n % 2 === 0) {
    return [
      { group: '基础属性', tag: 'VIP001会员' },
      { group: '节日', tag: '端午重宾粽礼意向' },
    ];
  }
  return [{ group: '消费类', tag: '可用积分大于等于1000' }];
};

type Props = {
  headerTitle?: string;
};

const CustomerTaggingList: React.FC<Props> = ({ headerTitle }) => {
  const location = useLocation();
  const isPlatformMembers =
    location.pathname.startsWith('/platform-members') ||
    location.pathname.startsWith('/tag-center/customer');
  const resolvedTitle = headerTitle || (isPlatformMembers ? '平台会员' : '会员标签');
  const titleTip = isPlatformMembers
    ? '按账号平台数据权限展示对应平台的全量会员；命中标签只读，来自人群标签规则。'
    : '人员标签由人群标签规则命中产生，本页仅查看，不可手动打标。';
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');
  const actionRef = useRef<ActionType | null>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });

  const viewBase = location.pathname.startsWith('/customer-asset')
    ? '/customer-asset/customer-list'
    : '/platform-members';

  const getTags = (row: CustomerItem): TagItem[] => {
    if (row.tagInstances?.length) {
      return row.tagInstances.map((t) => ({ group: t.group, tag: t.tag }));
    }
    if (row.tags?.length) return flattenGroups(row.tags);
    return seedTags(row.id);
  };

  const tagCascadeOptions = useMemo(
    () =>
      catalog.map((g) => ({
        label: g.group,
        value: g.group,
        children: g.tags.map((t) => ({
          label: t,
          value: t,
        })),
      })),
    [catalog],
  );

  const columns: ProColumns<CustomerItem>[] = [
    // —— 筛选顺序：手机号 → OneID → 标签 → 用户类型 → 平台 → 姓名 → 性别 → 年龄 → 地区 ——
    {
      title: '手机号',
      dataIndex: 'phone',
      hideInTable: true,
      fieldProps: { placeholder: '请输入手机号' },
      order: 9,
    },
    {
      title: '会员 OneID',
      dataIndex: 'oneIdSearch',
      hideInTable: true,
      fieldProps: { placeholder: '如 OID202608120001' },
      order: 8,
    },
    {
      title: '标签',
      dataIndex: 'tagPaths',
      hideInTable: true,
      valueType: 'cascader',
      order: 7,
      fieldProps: {
        multiple: true,
        allowClear: true,
        changeOnSelect: false,
        expandTrigger: 'hover',
        showSearch: true,
        maxTagCount: 'responsive',
        placeholder: '分类 / 标签（可多选、可搜索）',
        options: tagCascadeOptions,
        showCheckedStrategy: Cascader.SHOW_CHILD,
        popupClassName: 'platform-members-tag-cascader-popup',
      },
    },
    {
      title: '用户类型',
      dataIndex: 'userTypeSearch',
      hideInTable: true,
      valueType: 'select',
      order: 6,
      fieldProps: {
        allowClear: true,
        options: [
          { label: '会员', value: '会员' },
          { label: '非会员', value: '非会员' },
        ],
        placeholder: '请选择',
      },
    },
    {
      title: '平台',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      order: 5,
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
    },
    {
      title: '姓名',
      dataIndex: 'nameSearch',
      hideInTable: true,
      fieldProps: { placeholder: '请输入姓名' },
      order: 4,
    },
    {
      title: '性别',
      dataIndex: 'genderSearch',
      hideInTable: true,
      valueType: 'select',
      order: 3,
      fieldProps: {
        allowClear: true,
        options: [
          { label: '男', value: '男' },
          { label: '女', value: '女' },
          { label: '未知', value: '未知' },
        ],
        placeholder: '请选择',
      },
    },
    {
      title: '年龄',
      dataIndex: 'ageRange',
      hideInTable: true,
      valueType: 'digitRange',
      order: 2,
      fieldProps: { placeholder: ['最小', '最大'] },
      search: {
        transform: (value) => ({ ageMin: value?.[0], ageMax: value?.[1] }),
      },
    },
    {
      title: '地区',
      dataIndex: 'regionPaths',
      hideInTable: true,
      valueType: 'cascader',
      order: 1,
      fieldProps: {
        multiple: true,
        allowClear: true,
        changeOnSelect: true,
        expandTrigger: 'hover',
        showSearch: true,
        maxTagCount: 'responsive',
        placeholder: '请选择省 / 市 / 区（可多选）',
        options: REGION_CASCADE,
        showCheckedStrategy: Cascader.SHOW_CHILD,
      },
    },
    // —— 列表列 ——
    {
      title: '序号',
      dataIndex: 'index',
      search: false,
      width: 64,
      fixed: 'left',
      render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
    },
    {
      title: '会员 OneID',
      dataIndex: 'oneId',
      search: false,
      width: 150,
      fixed: 'left',
      render: (_, row) =>
        row.oneId || `OID20260812${String(row.id).replace(/\D/g, '').padStart(4, '0')}`,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      search: false,
      width: 88,
      render: (v) => v || '--',
    },
    {
      title: '手机号',
      dataIndex: 'phoneMasked',
      search: false,
      width: 120,
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      search: false,
      width: 88,
      render: (v) => v || '--',
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
      title: '平台',
      dataIndex: 'centers',
      search: false,
      width: 160,
      render: (_, row) => (
        <CenterTags centers={row.centers?.length ? row.centers : seedCenters(row.id)} />
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      search: false,
      width: 240,
      render: (_, row) => (
        <TagChips tags={getTags(row)} catalog={catalog} emptyText="暂无标签" />
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 72,
      fixed: 'right',
      render: (_, row) => [
        <a key="view" onClick={() => history.push(`${viewBase}/view/${row.id}`)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <style>{`
        .platform-members-tag-cascader-popup .ant-cascader-menu {
          height: 240px !important;
          max-height: 240px !important;
          min-width: max-content;
          width: auto;
        }
        .platform-members-tag-cascader-popup .ant-cascader-menu-item {
          white-space: nowrap;
        }
      `}</style>
      <ProTable<CustomerItem>
        headerTitle={<TitleWithTip title={resolvedTitle} tip={titleTip} />}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ ...listSearchProps, defaultColsNumber: 9 }}
        scroll={{ x: 1200 }}
        pagination={{
          ...listPagination,
          current: pageInfo.current,
          pageSize: pageInfo.pageSize,
          onChange: (current: number, pageSize: number) =>
            setPageInfo({ current, pageSize: pageSize || pageInfo.pageSize }),
        } as any}
        request={async (params) => {
          const tagPaths = (params.tagPaths as string[][] | undefined) || [];
          const tagKeys = tagPaths
            .filter((p) => p?.length >= 2)
            .map((p) => `${p[0]}::${p[p.length - 1]}`);
          const regionPaths = (params.regionPaths as string[][] | undefined) || [];
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
              userType: params.userTypeSearch,
              gender: params.genderSearch,
              ageMin: params.ageMin,
              ageMax: params.ageMax,
              tagKeys: tagKeys.join(','),
              regionPath: regionPaths.map((p) => p.join('/')).join('|'),
            },
          });
          let data = res.data || [];
          if (tagKeys.length) {
            data = data.filter((row) => {
              const set = new Set(getTags(row).map((t) => `${t.group}::${t.tag}`));
              return tagKeys.every((k) => set.has(k));
            });
          }
          return { ...res, data, total: tagKeys.length ? data.length : res.total };
        }}
      />
    </PageContainer>
  );
};

export default CustomerTaggingList;
