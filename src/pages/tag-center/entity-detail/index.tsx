import { PageContainer, ProCard, ProDescriptions } from '@ant-design/pro-components';
import { request, useParams } from '@umijs/max';
import { Button, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import TitleWithTip from '@/components/TitleWithTip';
import {
  TagChips,
  TagPickerModal,
  useTagCatalog,
  type CatalogKind,
  type TagItem,
} from '@/components/Tagging';
import { pageHeader } from '@/utils/pageHeader';

const KIND_META: Record<
  Exclude<CatalogKind, 'customer'>,
  { label: string; listPath: string; api: string; tip: string }
> = {
  store: {
    label: '店铺数据',
    listPath: '/tag-center/store',
    api: '/api/customer-asset/stores',
    tip: '店铺标签可在本页直接手动打标，用于圈人条件。',
  },
  product: {
    label: '商品数据',
    listPath: '/tag-center/product',
    api: '/api/customer-asset/products',
    tip: '商品标签可在本页直接手动打标。',
  },
  campaign: {
    label: '专题活动',
    listPath: '/tag-center/campaign',
    api: '/api/tag-center/campaigns',
    tip: '专题活动标签可在本页直接手动打标。',
  },
};

type Props = { kind: Exclude<CatalogKind, 'customer'> };

const EntityDetailPage: React.FC<Props> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const meta = KIND_META[kind];
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog(kind);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request<{ data: any[] }>(meta.api, { params: { current: 1, pageSize: 200 } })
      .then((res) => {
        const hit = (res.data || []).find((x) => String(x.id) === String(id));
        const row = hit || { id, name: `${meta.label} ${id}` };
        setData(row);
        if (Array.isArray(row.tags)) {
          setTags(row.tags);
        } else if (typeof row.tagValues === 'string' && row.tagValues && row.tagValues !== '--') {
          setTags(
            row.tagValues
              .split(',')
              .map((t: string) => t.trim())
              .filter(Boolean)
              .map((tag: string) => ({ group: '销售策略', tag })),
          );
        } else {
          setTags([]);
        }
      })
      .finally(() => setLoading(false));
  }, [id, kind, meta.api, meta.label]);

  return (
    <PageContainer
      loading={loading}
      {...pageHeader({
        title: <TitleWithTip title={`${meta.label}详情`} tip={meta.tip} />,
        backTo: meta.listPath,
        crumbs: [
          { title: '数据打标', path: '/tag-center/list' },
          { title: meta.label, path: meta.listPath },
          { title: '详情' },
        ],
        extra: (
          <Button type="primary" onClick={() => setPickerOpen(true)}>
            打标
          </Button>
        ),
      })}
    >
      <ProCard>
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="ID">{data?.id || id}</ProDescriptions.Item>
          <ProDescriptions.Item label="名称">{data?.name || '—'}</ProDescriptions.Item>
          {data?.platform ? (
            <ProDescriptions.Item label="平台">{data.platform}</ProDescriptions.Item>
          ) : null}
          {data?.storeId ? (
            <ProDescriptions.Item label="店铺ID">{data.storeId}</ProDescriptions.Item>
          ) : null}
          {data?.status ? (
            <ProDescriptions.Item label="状态">
              <Tag>{data.status}</Tag>
            </ProDescriptions.Item>
          ) : null}
          {data?.type ? (
            <ProDescriptions.Item label="类型">{data.type}</ProDescriptions.Item>
          ) : null}
          {data?.channel ? (
            <ProDescriptions.Item label="渠道">{data.channel}</ProDescriptions.Item>
          ) : null}
          <ProDescriptions.Item label="分中心">
            <CenterTags centers={data?.centers || []} />
          </ProDescriptions.Item>
          <ProDescriptions.Item label="标签" span={2}>
            <Space>
              <TagChips
                tags={tags}
                catalog={catalog}
                emptyText="点击打标"
                onClick={() => setPickerOpen(true)}
              />
            </Space>
          </ProDescriptions.Item>
        </ProDescriptions>
      </ProCard>
      <TagPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={`打标签 · ${data?.name || ''}`}
        catalog={catalog}
        mode="replace"
        value={tags}
        onSave={setTags}
      />
    </PageContainer>
  );
};

export const StoreDetailPage = () => <EntityDetailPage kind="store" />;
export const ProductDetailPage = () => <EntityDetailPage kind="product" />;
export const CampaignDetailPage = () => <EntityDetailPage kind="campaign" />;

export default EntityDetailPage;
