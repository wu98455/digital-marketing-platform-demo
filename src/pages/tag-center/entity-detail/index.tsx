import { PageContainer, ProCard, ProDescriptions } from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import TitleWithTip from '@/components/TitleWithTip';
import { pageHeader } from '@/utils/pageHeader';
import { goDataTagCreate } from '../utils/dataTagCreate';
import type { CatalogKind } from '@/components/Tagging';

const KIND_META: Record<
  Exclude<CatalogKind, 'customer'>,
  { label: string; listPath: string; api: string; tip: string }
> = {
  store: {
    label: '店铺数据',
    listPath: '/tag-center/store',
    api: '/api/customer-asset/stores',
    tip: '店铺标签用于圈人条件（如「曾在自营重点店下单」），结果永远是人包。',
  },
  product: {
    label: '商品数据',
    listPath: '/tag-center/product',
    api: '/api/customer-asset/products',
    tip: '商品标签像贴纸：点色块贴上；可用于人群工坊圈选「买过某类商品」的人。',
  },
  campaign: {
    label: '专题活动',
    listPath: '/tag-center/campaign',
    api: '/api/tag-center/campaigns',
    tip: '「专题活动」是可打标的活动主数据；自动化流程请到「营销管理 · 营销活动」画布。',
  },
};

type Props = { kind: Exclude<CatalogKind, 'customer'> };

const EntityDetailPage: React.FC<Props> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const meta = KIND_META[kind];
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request<{ data: any[] }>(meta.api, { params: { current: 1, pageSize: 200 } })
      .then((res) => {
        const hit = (res.data || []).find((x) => String(x.id) === String(id));
        setData(hit || { id, name: `${meta.label} ${id}` });
      })
      .finally(() => setLoading(false));
  }, [id, kind, meta.api, meta.label]);

  return (
    <PageContainer
      loading={loading}
      {...pageHeader({
        title: (
          <TitleWithTip title={`${meta.label}详情`} tip={meta.tip} />
        ),
        backTo: meta.listPath,
        crumbs: [
          { title: '数据打标', path: '/tag-center/list' },
          { title: meta.label, path: meta.listPath },
          { title: '详情' },
        ],
        extra: (
          <Button
            type="primary"
            onClick={() =>
              goDataTagCreate(kind, [{ id: String(data?.id || id), name: data?.name }])
            }
          >
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
        </ProDescriptions>
      </ProCard>
    </PageContainer>
  );
};

export const StoreDetailPage = () => <EntityDetailPage kind="store" />;
export const ProductDetailPage = () => <EntityDetailPage kind="product" />;
export const CampaignDetailPage = () => <EntityDetailPage kind="campaign" />;

export default EntityDetailPage;
