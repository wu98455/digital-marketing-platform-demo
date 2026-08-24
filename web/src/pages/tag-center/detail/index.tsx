import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Modal, Space, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import { colorForGroup, useTagCatalog } from '@/components/Tagging';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import { pageHeader } from '@/utils/pageHeader';

type TagMember = {
  id: string;
  oneId: string;
  name: string;
  phoneMasked: string;
  centers: string[];
  source: string;
  taggedAt: string;
};

const TagDetailPage: React.FC = () => {
  const params = useParams<{ group?: string; tag?: string }>();
  const group = params.group ? decodeURIComponent(params.group) : '';
  const tag = params.tag ? decodeURIComponent(params.tag) : '';
  const { getCatalog, deleteTag } = useTagCatalog();
  const catalog = getCatalog('customer');
  const [meta, setMeta] = useState<{
    count?: number;
    creator?: string;
    createdAt?: string;
    updatedAt?: string;
    centers?: string[];
    ruleId?: string;
  }>({});
  const [members, setMembers] = useState<TagMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    request<{
      data: {
        count: number;
        creator?: string;
        createdAt?: string;
        updatedAt?: string;
        centers?: string[];
        ruleId?: string;
        members: TagMember[];
      };
    }>('/api/tag-center/person-tags/detail', {
      params: { group, tag },
    })
      .then((res) => {
        setMeta({
          count: res.data?.count,
          creator: res.data?.creator,
          createdAt: res.data?.createdAt,
          updatedAt: res.data?.updatedAt,
          centers: res.data?.centers,
          ruleId: res.data?.ruleId,
        });
        setMembers(res.data?.members || []);
      })
      .finally(() => setLoading(false));
  }, [group, tag]);

  const goEdit = () => {
    history.push(`/tag-center/edit/${encodeURIComponent(group)}/${encodeURIComponent(tag)}`);
  };

  const runAgain = async () => {
    let id = meta.ruleId;
    if (!id) {
      const res = await request<{ data: { id: string; targetTag: { group: string; tag: string } }[] }>(
        '/api/tag-center/rules',
        { params: { current: 1, pageSize: 100 } },
      );
      id = (res.data || []).find((r) => r.targetTag.tag === tag && r.targetTag.group === group)?.id;
    }
    if (!id) {
      message.warning('该标签还没有打标规则，请先编辑标签');
      goEdit();
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
  };

  const columns: ProColumns<TagMember>[] = useMemo(
    () => [
      { title: '人员 OneID', dataIndex: 'oneId', hideInTable: true },
      { title: '姓名', dataIndex: 'name', hideInTable: true },
      { title: '手机号', dataIndex: 'phone', hideInTable: true },
      {
        title: '分中心',
        dataIndex: 'centerSearch',
        hideInTable: true,
        valueType: 'select',
        valueEnum: Object.fromEntries(
          (meta.centers || ['长寿工惠', '山城工惠', '国企优品', '文旅惠']).map((c) => [
            c,
            { text: c },
          ]),
        ),
      },
      { title: '人员 OneID', dataIndex: 'oneId', search: false, width: 160 },
      { title: '姓名', dataIndex: 'name', search: false, width: 90 },
      { title: '手机', dataIndex: 'phoneMasked', search: false, width: 120 },
      {
        title: '分中心',
        dataIndex: 'centers',
        search: false,
        width: 180,
        render: (_, row) => <CenterTags centers={row.centers} />,
      },
      { title: '来源', dataIndex: 'source', search: false, width: 120, ellipsis: true },
      { title: '打标时间', dataIndex: 'taggedAt', search: false, width: 170 },
    ],
    [meta.centers],
  );

  return (
    <PageContainer
      loading={loading}
      {...pageHeader({
        title: '标签详情',
        backTo: '/tag-center/list',
        crumbs: [
          { title: '数据打标', path: '/tag-center/list' },
          { title: '人群标签', path: '/tag-center/list' },
          { title: '标签详情' },
        ],
        extra: (
          <Space>
            <Button type="primary" onClick={goEdit}>
              编辑标签
            </Button>
            <Button onClick={runAgain}>重新打标</Button>
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: `删除标签「${tag}」？`,
                  onOk: () => {
                    deleteTag('customer', { group, tag });
                    message.success('已删除');
                    history.push('/tag-center/list');
                  },
                });
              }}
            >
              删除
            </Button>
          </Space>
        ),
      })}
    >
      <ProCard style={{ marginBottom: 16 }}>
        <ProDescriptions column={3}>
          <ProDescriptions.Item label="标签名称">
            <Tag color={colorForGroup(group, catalog)}>{tag}</Tag>
          </ProDescriptions.Item>
          <ProDescriptions.Item label="分类">{group}</ProDescriptions.Item>
          <ProDescriptions.Item label="覆盖人数">{meta.count ?? members.length}</ProDescriptions.Item>
          <ProDescriptions.Item label="分中心">
            <CenterTags centers={meta.centers || []} />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="创建人">{meta.creator || '—'}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{meta.createdAt || '—'}</ProDescriptions.Item>
          <ProDescriptions.Item label="更新时间">
            {meta.updatedAt || meta.createdAt || '—'}
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>

      <ProTable<TagMember>
        headerTitle="标签人群列表"
        rowKey="id"
        columns={columns}
        dataSource={members}
        search={listSearchProps}
        pagination={listPagination as any}
        options={false}
        request={async (params) => {
          let list = [...members];
          if (params.oneId) {
            list = list.filter((x) => x.oneId.includes(String(params.oneId)));
          }
          if (params.name) {
            list = list.filter((x) => x.name.includes(String(params.name)));
          }
          if (params.phone) {
            list = list.filter((x) => x.phoneMasked.includes(String(params.phone)));
          }
          if (params.centerSearch) {
            list = list.filter((x) => x.centers.includes(String(params.centerSearch)));
          }
          return { data: list, success: true, total: list.length };
        }}
        params={{ membersLen: members.length }}
      />
    </PageContainer>
  );
};

export default TagDetailPage;
