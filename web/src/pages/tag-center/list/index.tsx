import { StarFilled, StarOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useModel } from '@umijs/max';
import { Button, Modal, Space, Tabs, Tag, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import { colorForGroup, flattenGroups, useTagCatalog } from '@/components/Tagging';
import { MARKETING_CENTERS } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import {
  getFavoriteTagKeys,
  getRecentTagKeys,
  isFavoriteTag,
  pushRecentTag,
  tagIdentity,
  toggleFavoriteTag,
} from '@/utils/tagFavorites';

type PersonTagRow = {
  key: string;
  group: string;
  tag: string;
  count: number;
  creator: string;
  createdAt: string;
  updatedAt?: string;
  ruleId?: string;
  centers: string[];
};

const TagListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const { initialState } = useModel('@@initialState');
  const username = initialState?.currentUser?.username as string | undefined;
  const { getCatalog, deleteTag } = useTagCatalog();
  const catalog = getCatalog('customer');
  const categoryOptions = useMemo(() => {
    const m: Record<string, { text: string }> = {};
    catalog.forEach((g) => {
      m[g.group] = { text: g.group };
    });
    return m;
  }, [catalog]);
  const [pageInfo, setPageInfo] = useState({ current: 1, pageSize: 10 });
  const [tab, setTab] = useState<'all' | 'recent' | 'fav'>('recent');
  const [favTick, setFavTick] = useState(0);

  const runAgain = async (row: PersonTagRow) => {
    let id = row.ruleId;
    if (!id) {
      const res = await request<{ data: { id: string; targetTag: { group: string; tag: string } }[] }>(
        '/api/tag-center/rules',
        { params: { current: 1, pageSize: 100 } },
      );
      id = (res.data || []).find((r) => r.targetTag.tag === row.tag && r.targetTag.group === row.group)
        ?.id;
    }
    if (!id) {
      message.warning('该标签还没有打标规则，请先编辑');
      history.push(
        `/tag-center/edit/${encodeURIComponent(row.group)}/${encodeURIComponent(row.tag)}`,
      );
      return;
    }
    const res = await request<{ success: boolean; errorMessage?: string; data?: { count: number } }>(
      `/api/tag-center/rules/${id}/run`,
      { method: 'POST' },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '执行失败');
      return;
    }
    message.success(`已重新打标，覆盖 ${res.data?.count ?? 0} 人`);
    actionRef.current?.reload();
  };

  const columns: ProColumns<PersonTagRow>[] = [
    { title: '标签名称', dataIndex: 'keyword', hideInTable: true },
    {
      title: '分类',
      dataIndex: 'categorySearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: categoryOptions,
    },
    {
      title: '创建人',
      dataIndex: 'creatorSearch',
      hideInTable: true,
    },
    {
      title: '分中心',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '序号',
      dataIndex: 'index',
      search: false,
      width: 72,
      render: (_, __, index) => (pageInfo.current - 1) * pageInfo.pageSize + index + 1,
    },
    {
      title: '标签名称',
      dataIndex: 'tag',
      search: false,
      width: 180,
      render: (_, row) => {
        const fav = isFavoriteTag(row.group, row.tag, username);
        return (
          <Space size={6}>
            <a
              onClick={(e) => {
                e.preventDefault();
                toggleFavoriteTag(row.group, row.tag, username);
                setFavTick((t) => t + 1);
              }}
              title={fav ? '取消收藏' : '收藏'}
            >
              {fav ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            </a>
            <a
              onClick={() => {
                pushRecentTag(row.group, row.tag, username);
                history.push(
                  `/tag-center/detail/${encodeURIComponent(row.group)}/${encodeURIComponent(row.tag)}`,
                );
              }}
            >
              <Tag color={colorForGroup(row.group, catalog)} style={{ marginInlineEnd: 0 }}>
                {row.tag}
              </Tag>
            </a>
          </Space>
        );
      },
    },
    {
      title: '分类',
      dataIndex: 'group',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: '覆盖人数',
      dataIndex: 'count',
      search: false,
      width: 100,
    },
    {
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 200,
      render: (_, row) => <CenterTags centers={row.centers} />,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      search: false,
      width: 110,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      width: 170,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      search: false,
      width: 170,
      render: (_, row) => row.updatedAt || row.createdAt || '—',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      fixed: 'right',
      render: (_, row) => (
        <Space size={8}>
          <a
            onClick={() => {
              pushRecentTag(row.group, row.tag, username);
              history.push(
                `/tag-center/detail/${encodeURIComponent(row.group)}/${encodeURIComponent(row.tag)}`,
              );
            }}
          >
            详情
          </a>
          <a
            onClick={() => {
              pushRecentTag(row.group, row.tag, username);
              history.push(
                `/tag-center/edit/${encodeURIComponent(row.group)}/${encodeURIComponent(row.tag)}`,
              );
            }}
          >
            编辑
          </a>
          <a onClick={() => runAgain(row)}>重新打标</a>
          <a
            style={{ color: '#ff4d4f' }}
            onClick={() => {
              Modal.confirm({
                title: `删除标签「${row.tag}」？`,
                onOk: () => {
                  deleteTag('customer', { group: row.group, tag: row.tag });
                  message.success('已删除');
                  actionRef.current?.reload();
                },
              });
            }}
          >
            删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={false}>
      <Tabs
        activeKey={tab}
        onChange={(k) => {
          setTab(k as typeof tab);
          actionRef.current?.reload();
        }}
        items={[
          { key: 'recent', label: '最近常用' },
          { key: 'all', label: '总标签库' },
          { key: 'fav', label: '个人收藏' },
        ]}
        style={{ marginBottom: 8 }}
      />
      <ProTable<PersonTagRow>
        headerTitle="人群标签"
        actionRef={actionRef}
        rowKey="key"
        columns={columns}
        params={{ tab, favTick }}
        search={listSearchProps}
        pagination={{
          ...listPagination,
          current: pageInfo.current,
          pageSize: pageInfo.pageSize,
          onChange: (current: number, pageSize: number) =>
            setPageInfo({ current, pageSize: pageSize || pageInfo.pageSize }),
        } as any}
        scroll={{ x: 1300 }}
        toolBarRender={() => [
          <Button key="new" type="primary" onClick={() => history.push('/tag-center/create')}>
            新建标签
          </Button>,
        ]}
        request={async (params) => {
          const res = await request<{
            data: {
              group: string;
              tag: string;
              count: number;
              ruleId?: string;
              updatedAt?: string;
              creator?: string;
              createdAt?: string;
              centers?: string[];
            }[];
          }>('/api/tag-center/person-tags');
          const cover: Record<
            string,
            {
              count: number;
              ruleId?: string;
              updatedAt?: string;
              creator?: string;
              createdAt?: string;
              centers?: string[];
            }
          > = {};
          (res.data || []).forEach((row) => {
            cover[`${row.group}::${row.tag}`] = row;
            cover[`::${row.tag}`] = row;
          });

          let list: PersonTagRow[] = flattenGroups(getCatalog('customer')).map((t, i) => {
            const key = `${t.group}::${t.tag}`;
            const c = cover[key] || cover[`::${t.tag}`];
            const creators = ['demo', 'WangSiyi', 'JiangYajuan'];
            return {
              key,
              group: t.group,
              tag: t.tag,
              count: c?.count ?? 0,
              creator: c?.creator || creators[i % 3],
              createdAt: c?.createdAt || `2026-0${(i % 6) + 1}-12 10:00:00`,
              updatedAt: c?.updatedAt,
              ruleId: c?.ruleId,
              centers: c?.centers?.length
                ? c.centers
                : [MARKETING_CENTERS[i % MARKETING_CENTERS.length]],
            };
          });
          if (params.keyword) {
            const k = String(params.keyword);
            list = list.filter((x) => x.tag.includes(k));
          }
          if (params.categorySearch) {
            list = list.filter((x) => x.group === params.categorySearch);
          }
          if (params.creatorSearch) {
            list = list.filter((x) => x.creator.includes(String(params.creatorSearch)));
          }
          if (params.centerSearch) {
            list = list.filter((x) => x.centers.includes(String(params.centerSearch)));
          }
          const inRange = (value: string | undefined, range?: string[]) => {
            if (!range?.[0] || !range?.[1]) return true;
            const day = (value || '').slice(0, 10);
            if (!day) return false;
            return day >= range[0] && day <= range[1];
          };
          if (params.createdAtRange) {
            list = list.filter((x) => inRange(x.createdAt, params.createdAtRange as string[]));
          }
          if (params.updatedAtRange) {
            list = list.filter((x) =>
              inRange(x.updatedAt || x.createdAt, params.updatedAtRange as string[]),
            );
          }
          if (tab === 'fav') {
            const fav = new Set(getFavoriteTagKeys(username));
            list = list.filter((x) => fav.has(tagIdentity(x.group, x.tag)));
          } else if (tab === 'recent') {
            const recent = getRecentTagKeys(username);
            const order = new Map(recent.map((k, i) => [k, i]));
            list = list
              .filter((x) => order.has(tagIdentity(x.group, x.tag)))
              .sort(
                (a, b) =>
                  (order.get(tagIdentity(a.group, a.tag)) ?? 99) -
                  (order.get(tagIdentity(b.group, b.tag)) ?? 99),
              );
          }
          return { data: list, success: true, total: list.length };
        }}
      />
    </PageContainer>
  );
};

export default TagListPage;
