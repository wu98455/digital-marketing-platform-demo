import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button } from 'antd';
import React, { useRef, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import TitleWithTip from '@/components/TitleWithTip';
import {
  TagChips,
  TagLibraryDrawer,
  TagPickerModal,
  remapTagInOverrides,
  removeTagFromOverrides,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';
import { MARKETING_CENTERS } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type CampaignItem = {
  id: string;
  name: string;
  type: string;
  channel: string;
  startAt: string;
  endAt: string;
  status: string;
  tags?: TagItem[];
  centers?: string[];
};

/** 演示用量统计用的种子行（与 mock A1001–A1005 对齐） */
const SEED_CAMPAIGN_ROWS: Pick<CampaignItem, 'id' | 'type' | 'channel'>[] = [
  { id: 'A1001', type: '专题', channel: '小程序' },
  { id: 'A1002', type: '渠道投放', channel: '短信' },
  { id: 'A1003', type: '节日', channel: '小程序' },
  { id: 'A1004', type: '专题', channel: '线下' },
  { id: 'A1005', type: '渠道投放', channel: '站内信' },
];

const seedTags = (row: Pick<CampaignItem, 'type' | 'channel'>): TagItem[] => {
  if (row.type.includes('节日')) return [{ group: '活动类型', tag: '节日大促' }];
  if (row.channel.includes('短信')) {
    return [
      { group: '触达渠道', tag: '短信' },
      { group: '目标客群', tag: '召回' },
    ];
  }
  return [
    { group: '活动类型', tag: '景区专题' },
    { group: '触达渠道', tag: '小程序' },
  ];
};

const seedTagsById = (id: string): TagItem[] => {
  const row = SEED_CAMPAIGN_ROWS.find((c) => c.id === id);
  return row ? seedTags(row) : [];
};

const CampaignTaggingPage: React.FC = () => {
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('campaign');
  const actionRef = useRef<ActionType | null>(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [selectedRows, setSelectedRows] = useState<CampaignItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRows, setPickerRows] = useState<CampaignItem[]>([]);
  const [pickerValue, setPickerValue] = useState<TagItem[]>([]);
  const [pickerMode, setPickerMode] = useState<'replace' | 'append'>('replace');

  const getTags = (row: CampaignItem) => tagOverrides[row.id] || row.tags || seedTags(row);

  const countUsage = (item: TagItem) => {
    const key = tagKey(item);
    let n = 0;
    SEED_CAMPAIGN_ROWS.forEach(({ id }) => {
      const tags = tagOverrides[id] || seedTagsById(id);
      if (tags.some((t) => tagKey(t) === key)) n += 1;
    });
    return n;
  };

  const openTagPicker = (rows: CampaignItem[], mode: 'replace' | 'append') => {
    if (!rows.length) return;
    setPickerRows(rows);
    setPickerMode(mode);
    setPickerValue(mode === 'replace' ? getTags(rows[0]) : []);
    setPickerOpen(true);
  };

  const columns: ProColumns<CampaignItem>[] = [
    { title: '活动名称', dataIndex: 'nameSearch', hideInTable: true },
    {
      title: '类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        专题: { text: '专题' },
        渠道投放: { text: '渠道投放' },
        节日: { text: '节日' },
      },
    },
    {
      title: '状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        未开始: { text: '未开始' },
        进行中: { text: '进行中' },
        已结束: { text: '已结束' },
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
      title: '序号',
      dataIndex: 'index',
      search: false,
      width: 64,
      render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
    },
    { title: '活动名称', dataIndex: 'name', search: false },
    { title: '活动ID', dataIndex: 'id', search: false, width: 100 },
    { title: '类型', dataIndex: 'type', search: false, width: 100 },
    { title: '渠道', dataIndex: 'channel', search: false, width: 110 },
    {
      title: '起止时间',
      dataIndex: 'startAt',
      search: false,
      render: (_, row) => `${row.startAt} ~ ${row.endAt}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 100,
      valueEnum: {
        未开始: { text: '未开始', status: 'Default' },
        进行中: { text: '进行中', status: 'Processing' },
        已结束: { text: '已结束', status: 'Success' },
      },
    },
    {
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 180,
      render: (_, row) => {
        const idx = SEED_CAMPAIGN_ROWS.findIndex((c) => c.id === row.id);
        const fallback = [MARKETING_CENTERS[(idx >= 0 ? idx : 0) % MARKETING_CENTERS.length]];
        return <CenterTags centers={row.centers?.length ? row.centers : fallback} />;
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
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
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 120,
      render: (_, row) => [
        <a key="tag" onClick={() => openTagPicker([row], 'replace')}>
          打标
        </a>,
        <a key="view" onClick={() => history.push(`/tag-center/campaign/view/${row.id}`)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<CampaignItem>
        headerTitle={
          <TitleWithTip
            title="专题活动 · 打标"
            tip="专题活动标签可在本页直接手动打标；自动化流程请到「营销管理 · 营销活动」画布。"
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
          const res = await request<{ data: CampaignItem[]; total: number; success: boolean }>(
            '/api/tag-center/campaigns',
            { params },
          );
          let data = res.data || [];
          if (params.nameSearch) {
            data = data.filter((x) => x.name.includes(String(params.nameSearch)));
          }
          if (params.typeSearch && params.typeSearch !== '不限') {
            data = data.filter((x) => x.type.includes(String(params.typeSearch)));
          }
          if (params.statusSearch && params.statusSearch !== '不限') {
            data = data.filter((x) => x.status === params.statusSearch);
          }
          if (params.centerSearch) {
            data = data.filter((x, idx) => {
              const centers = x.centers?.length
                ? x.centers
                : [MARKETING_CENTERS[idx % MARKETING_CENTERS.length]];
              return centers.includes(String(params.centerSearch));
            });
          }
          return { ...res, data, total: data.length };
        }}
      />
      <TagLibraryDrawer
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        kind="campaign"
        countUsage={countUsage}
        onRenameApply={(from, to) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            SEED_CAMPAIGN_ROWS.forEach(({ id }) => {
              if (!base[id]) base[id] = seedTagsById(id);
            });
            return remapTagInOverrides(base, from, to);
          });
          actionRef.current?.reload();
        }}
        onDeleteApply={(item) => {
          setTagOverrides((prev) => {
            const base: Record<string, TagItem[]> = { ...prev };
            SEED_CAMPAIGN_ROWS.forEach(({ id }) => {
              if (!base[id]) base[id] = seedTagsById(id);
            });
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
            ? `批量打标 · ${pickerRows.length} 个活动`
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

export default CampaignTaggingPage;
