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

type CampaignItem = {
  id: string;
  name: string;
  type: string;
  channel: string;
  startAt: string;
  endAt: string;
  status: string;
  tags?: TagItem[];
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
  const [tagOverrides, setTagOverrides] = useState<Record<string, TagItem[]>>({});
  const [selectedRows, setSelectedRows] = useState<CampaignItem[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);

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

  const goTagRow = (row: CampaignItem) =>
    goDataTagCreate('campaign', [{ id: row.id, name: row.name }]);

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
      title: '已打标签',
      dataIndex: 'tags',
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
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 120,
      render: (_, row) => [
        <a key="tag" onClick={() => goTagRow(row)}>
          打标
        </a>,
        <a key="view" onClick={() => message.info(`查看专题活动「${row.name}」（演示）`)}>
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
        message="「专题活动」是可打标的活动主数据；自动化流程请到「营销管理 · 营销活动」画布。"
      />
      <ProTable<CampaignItem>
        headerTitle="专题活动 · 打标"
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
                'campaign',
                selectedRows.map((r) => ({ id: r.id, name: r.name })),
              )
            }
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
    </PageContainer>
  );
};

export default CampaignTaggingPage;
