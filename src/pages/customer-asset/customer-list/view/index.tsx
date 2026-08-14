import { PageContainer, ProDescriptions, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { TagChips, flattenGroups, useTagCatalog } from '@/components/Tagging';
import { listSearchProps } from '@/utils/listSearch';
import { pageHeader } from '@/utils/pageHeader';
import EditCustomerTagsModal, {
  type TagGroup,
} from '../components/EditCustomerTagsModal';

const CustomerViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>();
  const [infoTab, setInfoTab] = useState('latest');
  const [mainTab, setMainTab] = useState('portrait');
  const [portraitSub, setPortraitSub] = useState('custom');
  const [rfmMode, setRfmMode] = useState('all');
  const [tagEditOpen, setTagEditOpen] = useState(false);

  const fromTagCenter = location.pathname.startsWith('/tag-center');
  const backPath = fromTagCenter ? '/tag-center/customer' : '/customer-asset/customer-list';
  const crumbs = fromTagCenter
    ? [
        { title: '数据打标', path: '/tag-center/list' },
        { title: '人员数据', path: '/tag-center/customer' },
        { title: '人员详情' },
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
  const headerChips = flattenGroups(customTags);

  return (
    <PageContainer
      {...pageHeader({
        title: fromTagCenter ? '人员详情' : '客户详情',
        backTo: backPath,
        crumbs,
      })}
    >
      <div className="panel-surface" style={{ padding: 24 }}>
        <Spin spinning={loading}>
          <Space style={{ marginBottom: 12 }} wrap align="start">
            <Typography.Title level={5} style={{ margin: 0 }}>
              {fromTagCenter ? '人员视图' : '客户视图'}
            </Typography.Title>
            {data?.status && <Tag color="success">{data.status}</Tag>}
            {fromTagCenter ? (
              <>
                <Typography.Text type="secondary">人员 OneID</Typography.Text>
                <Typography.Text
                  copyable={{
                    text:
                      data?.oneId ||
                      `OID20260812${String(id || '').replace(/\D/g, '').padStart(4, '0')}`,
                  }}
                >
                  {data?.oneId ||
                    `OID20260812${String(id || '').replace(/\D/g, '').padStart(4, '0')}`}
                </Typography.Text>
              </>
            ) : (
              <>
                <Typography.Text type="secondary">全渠道客户ID</Typography.Text>
                <Typography.Text copyable={{ text: data?.customerIdFull }}>
                  {data?.customerIdFull || '--'}
                </Typography.Text>
              </>
            )}
          </Space>
          <div style={{ marginBottom: 16 }}>
            <Space align="center" wrap>
              <Typography.Text type="secondary">已打标签</Typography.Text>
              <TagChips
                tags={headerChips}
                catalog={catalog}
                onClick={() => {
                  setMainTab('portrait');
                  setPortraitSub('custom');
                  setTagEditOpen(true);
                }}
              />
              <Button type="link" size="small" onClick={() => setTagEditOpen(true)}>
                编辑标签
              </Button>
            </Space>
          </div>

          <Tabs
            activeKey={infoTab}
            onChange={setInfoTab}
            items={[
              { key: 'latest', label: '最新基本信息' },
              { key: 'mine', label: '我维护的信息' },
            ]}
            style={{ marginBottom: 8 }}
          />
          <ProDescriptions column={3} size="small" style={{ marginBottom: 16 }}>
            <ProDescriptions.Item label="姓名">{data?.name || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="年龄">{data?.age ?? '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="性别">{data?.gender || '未知'}</ProDescriptions.Item>
            <ProDescriptions.Item label="邮箱">{data?.email || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="手机号">{data?.phoneMasked || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="生日">{data?.birthday || '-'}</ProDescriptions.Item>
            <ProDescriptions.Item label="地址" span={3}>
              {[data?.province, data?.city, data?.district].filter(Boolean).join(' ') || '-'}
            </ProDescriptions.Item>
            {infoTab === 'mine' && (
              <ProDescriptions.Item label="备注" span={3}>
                暂无我维护的补充信息
              </ProDescriptions.Item>
            )}
          </ProDescriptions>

          <Tabs
            activeKey={mainTab}
            onChange={setMainTab}
            items={[
              { key: 'portrait', label: '全渠道客户画像' },
              { key: 'member', label: '会员视图' },
              { key: 'accounts', label: '关联账号信息' },
              { key: 'dynamics', label: '客户动态' },
              { key: 'orders', label: '订单信息' },
              { key: 'reviews', label: '商品评价' },
              { key: 'benefits', label: '发放权益' },
            ]}
          />

          {mainTab === 'portrait' && (
            <Row gutter={16}>
              <Col span={5}>
                <Card size="small" styles={{ body: { padding: 0 } }}>
                  {[
                    { key: 'rfm', label: 'RFM标签' },
                    { key: 'custom', label: '自定义标签' },
                    { key: 'wecom', label: '企业微信标签' },
                    { key: 'weimob', label: '微盟标签' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setPortraitSub(item.key)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        background: portraitSub === item.key ? '#e6f4ff' : undefined,
                        color: portraitSub === item.key ? '#1677ff' : undefined,
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </Card>
              </Col>
              <Col span={19}>
                {portraitSub === 'rfm' && (
                  <>
                    <Space style={{ marginBottom: 12 }}>
                      <span>计算口径</span>
                      <Select
                        style={{ width: 260 }}
                        value={rfmMode}
                        onChange={setRfmMode}
                        options={[
                          { value: 'all', label: '基于所有有效交易' },
                          { value: 'year', label: '基于最近一年有效交易' },
                        ]}
                      />
                    </Space>
                    <Row gutter={12} style={{ marginBottom: 12 }}>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic title="R" value={data?.rfm?.r} />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic title="F" value={data?.rfm?.f} />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic title="M" value={data?.rfm?.m} />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small">
                          <Statistic
                            title="生命周期"
                            value={data?.rfm?.lifecycle}
                            valueStyle={{ fontSize: 16 }}
                          />
                        </Card>
                      </Col>
                    </Row>
                    <ProTable
                      headerTitle="平台 RFM"
                      search={false}
                      options={false}
                      pagination={false}
                      rowKey="platform"
                      dataSource={data?.rfm?.platforms || []}
                      columns={[
                        { title: '平台', dataIndex: 'platform' },
                        { title: 'R', dataIndex: 'r' },
                        { title: 'F', dataIndex: 'f' },
                        { title: 'M', dataIndex: 'm' },
                        {
                          title: '操作',
                          valueType: 'option',
                          render: () => [
                            <a
                              key="d"
                              onClick={() =>
                                Modal.info({
                                  title: '详细指标',
                                  content:
                                    '展示最近一年平台/店铺级 RFM，含全渠道/平台/店铺级及商户自定义生命周期。',
                                })
                              }
                            >
                              详细指标
                            </a>,
                          ],
                        },
                      ]}
                    />
                    <ProTable
                      headerTitle="店铺 RFM"
                      search={false}
                      options={false}
                      pagination={false}
                      rowKey="store"
                      dataSource={data?.rfm?.stores || []}
                      columns={[
                        { title: '店铺', dataIndex: 'store' },
                        { title: 'R', dataIndex: 'r' },
                        { title: 'F', dataIndex: 'f' },
                        { title: 'M', dataIndex: 'm' },
                      ]}
                    />
                  </>
                )}
                {portraitSub === 'custom' && (
                  <Row gutter={12}>
                    {(customTags.length
                      ? customTags
                      : [
                          { group: '客户价值', tags: [] as string[] },
                          { group: '兴趣偏好', tags: [] as string[] },
                        ]
                    ).map((g) => (
                      <Col span={12} key={g.group}>
                        <Card
                          size="small"
                          title={g.group}
                          extra={<a onClick={() => setTagEditOpen(true)}>编辑</a>}
                          style={{ marginBottom: 12 }}
                        >
                          {g.tags?.length ? (
                            g.tags.map((t: string) => <Tag key={t}>{t}</Tag>)
                          ) : (
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="暂无数据"
                            />
                          )}
                        </Card>
                      </Col>
                    ))}
                    <Col span={24}>
                      <Button type="dashed" block onClick={() => setTagEditOpen(true)}>
                        编辑全渠道客户标签
                      </Button>
                    </Col>
                  </Row>
                )}
                {portraitSub === 'wecom' && (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无企业微信标签"
                  />
                )}
                {portraitSub === 'weimob' && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无微盟标签" />
                )}
              </Col>
            </Row>
          )}

          {mainTab === 'member' && (
            <Card>
              <Row gutter={24}>
                <Col span={8}>
                  <Statistic title="会员卡" value={data?.member?.cardName || '-'} />
                </Col>
                <Col span={8}>
                  <Statistic title="等级" value={data?.member?.level || '-'} />
                </Col>
                <Col span={8}>
                  <Statistic title="积分" value={data?.member?.points ?? 0} />
                </Col>
              </Row>
              <Space style={{ marginTop: 16 }}>
                <a
                  onClick={() =>
                    Modal.info({ title: '等级变更记录', content: '暂无等级变更记录' })
                  }
                >
                  等级变更记录
                </a>
                <a
                  onClick={() =>
                    Modal.info({ title: '积分变更记录', content: '暂无积分变更记录' })
                  }
                >
                  积分变更记录
                </a>
              </Space>
            </Card>
          )}

          {mainTab === 'accounts' && (
            <Row gutter={12}>
              {(data?.accounts || []).map((a: any) => (
                <Col span={12} key={a.accountId}>
                  <Card size="small" title={a.name}>
                    <Typography.Text
                      copyable={{
                        text: a.accountId,
                        onCopy: () => message.success('已复制'),
                      }}
                    >
                      {a.accountId}
                    </Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {mainTab === 'dynamics' && (
            <ProTable
              search={listSearchProps}
              options={false}
              pagination={false}
              rowKey="time"
              dataSource={data?.dynamics || []}
              columns={[
                {
                  title: '时间',
                  dataIndex: 'timeRange',
                  hideInTable: true,
                  valueType: 'dateRange',
                },
                {
                  title: '类型',
                  dataIndex: 'typeFilter',
                  hideInTable: true,
                  valueType: 'select',
                  initialValue: '不限',
                  valueEnum: {
                    不限: { text: '不限' },
                    营销互动: { text: '营销互动' },
                    订单: { text: '订单' },
                    评价: { text: '评价' },
                    售后: { text: '售后' },
                  },
                },
                { title: '时间', dataIndex: 'time', hideInSearch: true },
                { title: '类型', dataIndex: 'type', hideInSearch: true },
                { title: '内容', dataIndex: 'content', hideInSearch: true },
              ]}
            />
          )}

          {mainTab === 'orders' && (
            <ProTable
              search={listSearchProps}
              options={{ reload: true, setting: true }}
              pagination={false}
              rowKey="orderNo"
              dataSource={data?.orders || []}
              columns={[
                { title: '店铺', dataIndex: 'storeFilter', hideInTable: true },
                { title: '订单号', dataIndex: 'orderNo' },
                { title: '店铺', dataIndex: 'store', hideInSearch: true },
                { title: '金额', dataIndex: 'amount', hideInSearch: true },
                { title: '状态', dataIndex: 'status', hideInSearch: true },
                { title: '时间', dataIndex: 'time', hideInSearch: true },
              ]}
              toolBarRender={() => [<a key="exp">展开全部子订单</a>]}
            />
          )}

          {mainTab === 'reviews' && (
            <ProTable
              search={listSearchProps}
              options={false}
              pagination={false}
              rowKey="time"
              dataSource={data?.reviews || []}
              columns={[
                { title: '店铺', dataIndex: 'storeFilter', hideInTable: true },
                { title: '店铺', dataIndex: 'store', hideInSearch: true },
                { title: '评分', dataIndex: 'score', hideInSearch: true },
                { title: '内容', dataIndex: 'content', hideInSearch: true },
                { title: '时间', dataIndex: 'time', hideInSearch: true },
              ]}
            />
          )}

          {mainTab === 'benefits' && (
            <>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={8}>
                  <Statistic title="近90天发放量" value={data?.benefits?.count ?? 0} />
                </Col>
                <Col span={16}>
                  <Statistic title="最后发放时间" value={data?.benefits?.lastTime || '-'} />
                </Col>
              </Row>
              <ProTable
                search={listSearchProps}
                options={false}
                pagination={false}
                rowKey="time"
                dataSource={data?.benefits?.list || []}
                columns={[
                  { title: '店铺', dataIndex: 'storeFilter', hideInTable: true },
                  { title: '权益名称', dataIndex: 'name', hideInSearch: true },
                  { title: '店铺', dataIndex: 'store', hideInSearch: true },
                  { title: '发放时间', dataIndex: 'time', hideInSearch: true },
                ]}
              />
            </>
          )}
        </Spin>
      </div>

      <EditCustomerTagsModal
        open={tagEditOpen}
        onOpenChange={setTagEditOpen}
        value={customTags}
        onSave={(next) => {
          setData((prev: any) => ({ ...prev, customTags: next }));
        }}
      />
    </PageContainer>
  );
};

export default CustomerViewPage;
