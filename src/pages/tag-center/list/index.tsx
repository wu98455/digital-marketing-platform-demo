import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import { Button, Modal, Space, Tag, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { colorForGroup, flattenGroups, useTagCatalog } from '@/components/Tagging';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type PersonTagRow = {
  key: string;
  group: string;
  tag: string;
  count: number;
  creator: string;
  createdAt: string;
  updatedAt?: string;
  ruleId?: string;
};

const TagListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
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
      width: 160,
      render: (_, row) => (
        <Tag color={colorForGroup(row.group, catalog)} style={{ marginInlineEnd: 0 }}>
          {row.tag}
        </Tag>
      ),
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
      width: 180,
      fixed: 'right',
      render: (_, row) => (
        <Space size={8}>
          <a
            onClick={() =>
              history.push(
                `/tag-center/edit/${encodeURIComponent(row.group)}/${encodeURIComponent(row.tag)}`,
              )
            }
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
      <ProTable<PersonTagRow>
        headerTitle="人群标签"
        actionRef={actionRef}
        rowKey="key"
        columns={columns}
        search={listSearchProps}
        pagination={{
          ...listPagination,
          current: pageInfo.current,
          pageSize: pageInfo.pageSize,
          onChange: (current: number, pageSize: number) =>
            setPageInfo({ current, pageSize: pageSize || pageInfo.pageSize }),
        } as any}
        scroll={{ x: 1100 }}
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
          return { data: list, success: true, total: list.length };
        }}
      />
    </PageContainer>
  );
};

export default TagListPage;
