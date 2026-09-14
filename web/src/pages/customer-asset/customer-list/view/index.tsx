import { PageContainer, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation, useParams } from '@umijs/max';
import { Card, Col, Empty, Row, Spin, Tabs, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { CUSTOMER_TAG_CATALOG, TagChips, flattenGroups, useTagCatalog } from '@/components/Tagging';
import { listPagination } from '@/utils/listSearch';
import { pageHeader } from '@/utils/pageHeader';
import EditCustomerTagsModal, {
  type TagGroup,
} from '../components/EditCustomerTagsModal';

type HitTag = { group: string; tag: string };

type MarketingEvent = {
  activityId: string;
  activityName: string;
  crowdName: string;
  channel: string;
  result: string;
  executedAt: string;
};

type DynamicRow = {
  id: string;
  time: string;
  type: string;
  content: string;
  activityId?: string;
  activityName?: string;
};

type OrderRow = {
  orderNo: string;
  store: string;
  productName: string;
  amount: number;
  status: string;
  time: string;
  couponName?: string;
  reviewScore?: number;
  reviewContent?: string;
};

const TAG_GROUP_ORDER = CUSTOMER_TAG_CATALOG.map((g) => g.group);

/** 详情内列表：默认展开 3 个常用筛选项 */
const detailListSearch = {
  labelWidth: 90 as const,
  span: 8,
  defaultColsNumber: 3,
  defaultCollapsed: true,
};

const DYN_TYPE_ENUM = {
  不限: { text: '不限' },
  登录: { text: '登录' },
  浏览: { text: '浏览' },
  加购: { text: '加购' },
  订单: { text: '订单' },
  优惠券: { text: '优惠券' },
  评价: { text: '评价' },
  积分: { text: '积分' },
  等级: { text: '等级' },
};

function groupHitTags(hits: HitTag[]): TagGroup[] {
  const map = new Map<string, string[]>();
  for (const g of TAG_GROUP_ORDER) map.set(g, []);
  for (const t of hits) {
    if (!map.has(t.group)) map.set(t.group, []);
    const list = map.get(t.group)!;
    if (!list.includes(t.tag)) list.push(t.tag);
  }
  return TAG_GROUP_ORDER.map((group) => ({ group, tags: map.get(group) || [] })).concat(
    [...map.keys()]
      .filter((g) => !TAG_GROUP_ORDER.includes(g))
      .map((group) => ({ group, tags: map.get(group) || [] })),
  );
}

const CustomerViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();
  const [mainTab, setMainTab] = useState('tags');
  const [tagGroupKey, setTagGroupKey] = useState(TAG_GROUP_ORDER[0] || '行为类');
  const [tagEditOpen, setTagEditOpen] = useState(false);

  const fromPlatformMembers =
    location.pathname.startsWith('/platform-members') ||
    location.pathname.startsWith('/tag-center/customer');
  const backPath = fromPlatformMembers
    ? '/platform-members'
    : '/customer-asset/customer-list';
  const crumbs = fromPlatformMembers
    ? [
        { title: '平台会员', path: '/platform-members' },
        { title: '会员详情' },
      ]
    : [
        { title: '客户列表', path: '/customer-asset/customer-list' },
        { title: '客户详情' },
      ];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    request(`/api/customer-asset/customers/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const customTags: TagGroup[] = data?.customTags || [];
  const hitTags: HitTag[] =
    data?.tagInstances?.length > 0
      ? data.tagInstances.map((t: { group: string; tag: string }) => ({
          group: t.group,
          tag: t.tag,
        }))
      : flattenGroups(customTags);

  const tagGroups = useMemo(() => groupHitTags(hitTags), [hitTags]);
  const activeTagGroup =
    tagGroups.find((g) => g.group === tagGroupKey) || tagGroups[0];

  const editTagValue: TagGroup[] = useMemo(() => {
    if (customTags.length) return customTags;
    return tagGroups.filter((g) => g.tags.length);
  }, [customTags, tagGroups]);

  const oneId =
    data?.oneId ||
    `OID20260812${String(id || '').replace(/\D/g, '').padStart(4, '0')}`;

  return (
    <PageContainer
      {...pageHeader({
        title: fromPlatformMembers ? '会员详情' : '客户详情',
        backTo: backPath,
        crumbs,
      })}
    >
      <div className="panel-surface" style={{ padding: 24 }}>
        <Spin spinning={loading}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            基本信息
          </Typography.Text>
          <ProDescriptions column={3} size="small" style={{ marginBottom: 16 }}>
            <ProDescriptions.Item label="会员 OneID">{oneId}</ProDescriptions.Item>
            <ProDescriptions.Item label="姓名">{data?.name || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="手机号">{data?.phoneMasked || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="用户类型">{data?.userType || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="可用积分">
              {data?.availablePoints == null ? '-' : Number(data.availablePoints).toLocaleString()}
            </ProDescriptions.Item>
            <ProDescriptions.Item label="消费订单数">{data?.orderCount ?? '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="消费金额(元)">
              {data?.consumeAmount == null
                ? '-'
                : Number(data.consumeAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
            </ProDescriptions.Item>
            <ProDescriptions.Item label="积分兑换订单数">
              {data?.pointsExchangeOrderCount ?? '-'}
            </ProDescriptions.Item>
            <ProDescriptions.Item label="录入方式">{data?.enterWay || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="注册时间">{data?.registeredAt || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="性别">{data?.gender || '未知'}</ProDescriptions.Item>
            <ProDescriptions.Item label="年龄">{data?.age ?? '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="邮箱">{data?.email || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="生日">{data?.birthday || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="平台">
              {(data?.centers || []).join('、') || '-'}
            </ProDescriptions.Item>
            <ProDescriptions.Item label="省市区" span={3}>
              {[data?.province, data?.city, data?.district].filter(Boolean).join(' / ') || '-'}
            </ProDescriptions.Item>
          </ProDescriptions>

          <Tabs
            activeKey={mainTab}
            onChange={setMainTab}
            items={[
              { key: 'tags', label: '标签' },
              { key: 'marketing', label: '营销事件' },
              { key: 'dynamics', label: '会员动态' },
              { key: 'member', label: '平台身份' },
              { key: 'orders', label: '订单信息' },
            ]}
          />

          {mainTab === 'tags' && (
            <Row gutter={16}>
              <Col span={5}>
                <Card size="small" styles={{ body: { padding: 0 } }}>
                  {tagGroups.map((g) => (
                    <div
                      key={g.group}
                      onClick={() => setTagGroupKey(g.group)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: tagGroupKey === g.group ? '#e6f4ff' : undefined,
                        color: tagGroupKey === g.group ? '#1677ff' : undefined,
                      }}
                    >
                      {g.group}
                      {g.tags?.length ? (
                        <Typography.Text type="secondary" style={{ marginLeft: 6 }}>
                          ({g.tags.length})
                        </Typography.Text>
                      ) : null}
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={19}>
                <Card
                  size="small"
                  title={activeTagGroup?.group || '标签'}
                  extra={
                    fromPlatformMembers ? null : (
                      <a onClick={() => setTagEditOpen(true)}>编辑标签</a>
                    )
                  }
                >
                  {activeTagGroup?.tags?.length ? (
                    <TagChips
                      tags={activeTagGroup.tags.map((tag) => ({
                        group: activeTagGroup.group,
                        tag,
                      }))}
                      catalog={catalog}
                      maxVisible={99}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无标签" />
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {mainTab === 'marketing' && (
            <ProTable<MarketingEvent>
              search={detailListSearch}
              options={false}
              pagination={listPagination}
              params={{ ready: Boolean(data) }}
              rowKey={(r) => `${r.activityId}-${r.executedAt}-${r.channel}`}
              request={async (params) => {
                let list = [...(data?.marketingEvents || [])] as MarketingEvent[];
                const name = String(params.activityNameKw || '').trim();
                if (name) list = list.filter((x) => x.activityName.includes(name));
                if (params.channel && params.channel !== '不限') {
                  list = list.filter((x) => x.channel === params.channel);
                }
                if (params.resultFilter && params.resultFilter !== '不限') {
                  list = list.filter((x) => x.result === params.resultFilter);
                }
                return { data: list, success: true, total: list.length };
              }}
              columns={[
                { title: '活动名称', dataIndex: 'activityNameKw', hideInTable: true },
                {
                  title: '触达渠道',
                  dataIndex: 'channel',
                  hideInTable: true,
                  valueType: 'select',
                  initialValue: '不限',
                  valueEnum: {
                    不限: { text: '不限' },
                    短信: { text: '短信' },
                    站内信: { text: '站内信' },
                    小程序发券: { text: '小程序发券' },
                    发优惠券: { text: '发优惠券' },
                    企微发消息: { text: '企微发消息' },
                  },
                },
                {
                  title: '触达结果',
                  dataIndex: 'resultFilter',
                  hideInTable: true,
                  valueType: 'select',
                  initialValue: '不限',
                  valueEnum: {
                    不限: { text: '不限' },
                    成功: { text: '成功' },
                    失败: { text: '失败' },
                    未触达: { text: '未触达' },
                  },
                },
                {
                  title: '活动名称',
                  dataIndex: 'activityName',
                  search: false,
                  render: (_, row) => (
                    <a
                      onClick={() =>
                        history.push(`/crowd-marketing/activity/report/${row.activityId}`)
                      }
                    >
                      {row.activityName}
                    </a>
                  ),
                },
                { title: '目标人群', dataIndex: 'crowdName', search: false, ellipsis: true },
                {
                  title: '触达渠道',
                  dataIndex: 'channelDisplay',
                  search: false,
                  width: 120,
                  render: (_, row) => row.channel,
                },
                {
                  title: '触达结果',
                  dataIndex: 'result',
                  search: false,
                  width: 90,
                  render: (_, row) => (
                    <Tag
                      color={
                        row.result === '成功'
                          ? 'success'
                          : row.result === '失败'
                            ? 'error'
                            : 'default'
                      }
                    >
                      {row.result}
                    </Tag>
                  ),
                },
                { title: '执行时间', dataIndex: 'executedAt', search: false, width: 170 },
              ]}
            />
          )}

          {mainTab === 'dynamics' && (
            <ProTable<DynamicRow>
              search={detailListSearch}
              options={false}
              pagination={listPagination}
              params={{ ready: Boolean(data) }}
              rowKey="id"
              request={async (params) => {
                let list = [...(data?.dynamics || [])] as DynamicRow[];
                if (params.typeFilter && params.typeFilter !== '不限') {
                  list = list.filter((x) => x.type === params.typeFilter);
                }
                const kw = String(params.keyword || '').trim();
                if (kw) {
                  list = list.filter(
                    (x) => x.content.includes(kw) || (x.activityName || '').includes(kw),
                  );
                }
                const range = params.timeRange as string[] | undefined;
                if (range?.[0] && range?.[1]) {
                  const start = range[0].slice(0, 10);
                  const end = range[1].slice(0, 10);
                  list = list.filter((x) => {
                    const d = x.time.slice(0, 10);
                    return d >= start && d <= end;
                  });
                }
                return { data: list, success: true, total: list.length };
              }}
              columns={[
                {
                  title: '类型',
                  dataIndex: 'typeFilter',
                  hideInTable: true,
                  valueType: 'select',
                  initialValue: '不限',
                  valueEnum: DYN_TYPE_ENUM,
                },
                {
                  title: '时间',
                  dataIndex: 'timeRange',
                  hideInTable: true,
                  valueType: 'dateRange',
                },
                { title: '关键词', dataIndex: 'keyword', hideInTable: true },
                { title: '时间', dataIndex: 'time', hideInSearch: true, width: 170 },
                { title: '类型', dataIndex: 'type', hideInSearch: true, width: 90 },
                {
                  title: '内容',
                  dataIndex: 'content',
                  hideInSearch: true,
                  render: (_, row) => (
                    <span>
                      {row.content}
                      {row.activityId && row.activityName ? (
                        <>
                          {' '}
                          <Typography.Text type="secondary">来源：</Typography.Text>
                          <a
                            onClick={() =>
                              history.push(`/crowd-marketing/activity/report/${row.activityId}`)
                            }
                          >
                            {row.activityName}
                          </a>
                        </>
                      ) : null}
                    </span>
                  ),
                },
              ]}
            />
          )}

          {mainTab === 'member' && (
            <ProTable
              search={false}
              options={false}
              pagination={false}
              rowKey={(r) => `${r.platform}-${r.memberId}`}
              dataSource={data?.platformMembers || []}
              columns={[
                { title: '平台', dataIndex: 'platform' },
                { title: '会员等级', dataIndex: 'level', width: 120 },
                {
                  title: '会员ID',
                  dataIndex: 'memberId',
                  ellipsis: true,
                  render: (_, row) => (
                    <Typography.Text
                      copyable={{
                        text: row.memberId,
                        onCopy: () => message.success('已复制'),
                      }}
                    >
                      {row.memberId}
                    </Typography.Text>
                  ),
                },
              ]}
              locale={{ emptyText: '暂无平台会员信息' }}
            />
          )}

          {mainTab === 'orders' && (
            <ProTable<OrderRow>
              search={detailListSearch}
              options={{ reload: true, setting: true }}
              pagination={listPagination}
              params={{ ready: Boolean(data) }}
              rowKey="orderNo"
              request={async (params) => {
                let list = [...(data?.orders || [])] as OrderRow[];
                const store = String(params.storeFilter || '').trim();
                if (store) list = list.filter((x) => x.store.includes(store));
                if (params.statusFilter && params.statusFilter !== '不限') {
                  list = list.filter((x) => x.status === params.statusFilter);
                }
                const product = String(params.productFilter || '').trim();
                if (product) {
                  list = list.filter(
                    (x) =>
                      x.productName.includes(product) ||
                      x.orderNo.includes(product) ||
                      (x.couponName || '').includes(product),
                  );
                }
                return { data: list, success: true, total: list.length };
              }}
              columns={[
                { title: '店铺', dataIndex: 'storeFilter', hideInTable: true },
                {
                  title: '状态',
                  dataIndex: 'statusFilter',
                  hideInTable: true,
                  valueType: 'select',
                  initialValue: '不限',
                  valueEnum: {
                    不限: { text: '不限' },
                    已完成: { text: '已完成' },
                    待支付: { text: '待支付' },
                    已取消: { text: '已取消' },
                  },
                },
                { title: '商品/订单号', dataIndex: 'productFilter', hideInTable: true },
                { title: '订单号', dataIndex: 'orderNo', width: 140, search: false },
                {
                  title: '商品',
                  dataIndex: 'productName',
                  search: false,
                  ellipsis: true,
                  width: 180,
                },
                { title: '店铺', dataIndex: 'store', hideInSearch: true, width: 120 },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  hideInSearch: true,
                  width: 90,
                  render: (_, r) => Number(r.amount).toLocaleString(),
                },
                {
                  title: '优惠券',
                  dataIndex: 'couponName',
                  search: false,
                  width: 120,
                  render: (_, r) => r.couponName || '—',
                },
                { title: '状态', dataIndex: 'status', hideInSearch: true, width: 90 },
                {
                  title: '评价',
                  dataIndex: 'review',
                  search: false,
                  width: 160,
                  render: (_, r) =>
                    r.reviewScore != null ? (
                      <span>
                        {r.reviewScore} 分
                        {r.reviewContent ? ` · ${r.reviewContent}` : ''}
                      </span>
                    ) : (
                      '—'
                    ),
                },
                { title: '时间', dataIndex: 'time', hideInSearch: true, width: 170 },
              ]}
            />
          )}
        </Spin>
      </div>

      <EditCustomerTagsModal
        open={tagEditOpen}
        onOpenChange={setTagEditOpen}
        value={editTagValue}
        onSave={(next) => {
          setData((prev: any) => ({
            ...prev,
            customTags: next,
            tagInstances: flattenGroups(next),
          }));
        }}
      />
    </PageContainer>
  );
};

export default CustomerViewPage;
