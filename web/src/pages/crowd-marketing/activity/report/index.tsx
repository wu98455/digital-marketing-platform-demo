import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { history, request, useLocation, useModel, useParams } from '@umijs/max';
import {
  Button,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import { useTagCatalog } from '@/components/Tagging';
import { mockOneId } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';
import { pageHeader } from '@/utils/pageHeader';
import { useAllowedCenters } from '@/utils/useAllowedCenters';

type NodeStat = {
  id: string;
  nodeName: string;
  nodeType: string;
  entered: number;
  success: number;
  failed: number;
  duration: string;
};

type ReachMember = {
  id: string;
  oneId: string;
  name: string;
  phoneMasked: string;
  centers: string[];
  status: string;
  channel: string;
};

function rateText(success = 0, failed = 0) {
  const total = success + failed;
  if (!total) return '-';
  return `${((success / total) * 100).toFixed(1)}%`;
}

const ActivityReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromExecRecord = location.pathname.includes('/node-record/result/');
  const backPath = fromExecRecord
    ? '/crowd-marketing/node-record'
    : '/crowd-marketing/activity';
  const { initialState } = useModel('@@initialState');
  const { addTag, getCatalog } = useTagCatalog();
  const { options: centerOptions } = useAllowedCenters();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ReachMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ReachMember[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagNameError, setTagNameError] = useState<string>();
  const [tagCenters, setTagCenters] = useState<string[]>([]);
  const catalog = getCatalog('customer');

  const checkSecondaryTagName = (raw: string) => {
    const n = raw.trim();
    if (!n) {
      setTagNameError(undefined);
      return false;
    }
    const dup = catalog.some((g) => g.tags.includes(n));
    setTagNameError(dup ? '标签名称已存在，请换一个名称' : undefined);
    return dup;
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const url = fromExecRecord
      ? `/api/crowd-marketing/node-records/${id}/report`
      : `/api/crowd-marketing/activities/${id}/report`;
    request(url)
      .then((res) => {
        setData(res.data);
        const entered = res.data?.summary?.entered ?? 8;
        const centers = res.data?.centers?.length
          ? res.data.centers
          : ['山城工惠', '长寿工惠'];
        const list: ReachMember[] = Array.from({ length: Math.min(Math.max(entered, 8), 20) }, (_, i) => ({
          id: `m${i + 1}`,
          oneId: mockOneId(i + 1),
          name: ['张三', '李四', '王五', '赵六', '钱七', '孙八'][i % 6],
          phoneMasked: `138****${String(1000 + i).slice(-4)}`,
          centers: [centers[i % centers.length] || centers[0]],
          status: i % 5 === 0 ? '失败' : '成功',
          channel: i % 2 === 0 ? '短信' : '小程序站内信',
        }));
        setMembers(list);
        setFilteredMembers(list);
        setSelectedKeys([]);
      })
      .finally(() => setLoading(false));
  }, [id, fromExecRecord]);

  useEffect(() => {
    if (centerOptions[0] && !tagCenters.length) {
      setTagCenters([centerOptions[0].value]);
    }
  }, [centerOptions, tagCenters.length]);

  const reachRate = useMemo(() => {
    const success = data?.summary?.reachSuccess ?? 0;
    const fail = data?.summary?.reachFail ?? 0;
    return rateText(success, fail);
  }, [data]);

  const columns: ProColumns<NodeStat>[] = [
    { title: '节点', dataIndex: 'nodeName' },
    { title: '类型', dataIndex: 'nodeType', width: 100 },
    { title: '进入', dataIndex: 'entered', width: 90 },
    { title: '成功', dataIndex: 'success', width: 90 },
    {
      title: '失败',
      dataIndex: 'failed',
      width: 90,
      render: (_, row) => (
        <span style={{ color: row.failed > 0 ? '#cf1322' : undefined }}>{row.failed}</span>
      ),
    },
    {
      title: '成功率',
      search: false,
      width: 100,
      render: (_, row) => rateText(row.success, row.failed),
    },
    { title: '耗时', dataIndex: 'duration', width: 100 },
  ];

  const memberColumns: ProColumns<ReachMember>[] = [
    {
      title: '触达状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        成功: { text: '成功' },
        失败: { text: '失败' },
      },
      initialValue: '全部',
      order: 1,
    },
    {
      title: '分中心',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        (data?.centers?.length ? data.centers : centerOptions.map((o) => o.value)).map(
          (c: string) => [c, { text: c }],
        ),
      ),
      order: 2,
    },
    {
      title: '渠道',
      dataIndex: 'channelSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        短信: { text: '短信' },
        小程序站内信: { text: '小程序站内信' },
      },
      initialValue: '全部',
      order: 3,
    },
    { title: '人员 OneID', dataIndex: 'oneId', hideInTable: true, order: 4 },
    { title: '姓名', dataIndex: 'name', hideInTable: true, order: 5 },
    { title: '手机号', dataIndex: 'phone', hideInTable: true, order: 6 },
    { title: '人员 OneID', dataIndex: 'oneId', search: false, width: 160 },
    { title: '姓名', dataIndex: 'name', search: false, width: 80 },
    { title: '手机', dataIndex: 'phoneMasked', search: false, width: 120 },
    {
      title: '分中心',
      dataIndex: 'centers',
      search: false,
      width: 140,
      render: (_, row) => <CenterTags centers={row.centers} />,
    },
    { title: '渠道', dataIndex: 'channel', search: false, width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      width: 80,
      render: (v) => <Tag color={v === '成功' ? 'success' : 'error'}>{v}</Tag>,
    },
  ];

  const executed = data?.executed !== false && data?.execStatus !== '未执行';

  const openSecondaryTag = () => {
    const picked = filteredMembers.filter(
      (m) => selectedKeys.includes(m.id) && m.status === '成功',
    );
    const source = picked.length
      ? picked
      : filteredMembers.filter((m) => m.status === '成功');
    if (!source.length) {
      message.warning('暂无成功触达成员可打标（可先筛选后再选）');
      return;
    }
    setTagName(`活动回写·${data?.name || id}·${new Date().toISOString().slice(0, 10)}`);
    setTagNameError(undefined);
    setTagOpen(true);
  };

  const submitSecondaryTag = () => {
    const name = tagName.trim();
    if (!name) {
      message.warning('请填写标签名称');
      return;
    }
    if (checkSecondaryTagName(name)) {
      message.error('标签名称已存在，请换一个名称');
      return;
    }
    if (!tagCenters.length) {
      message.warning('请选择分中心');
      return;
    }
    const group = catalog[0]?.group || '客户价值';
    const err = addTag('customer', group, name);
    if (err) {
      message.error(err);
      return;
    }
    const count = selectedKeys.length
      ? selectedKeys.length
      : filteredMembers.filter((m) => m.status === '成功').length;
    message.success(
      `已新建人群标签「${name}」（${count} 人，创建人 ${initialState?.currentUser?.username || ''}）`,
    );
    setTagOpen(false);
    history.push('/tag-center/list');
  };

  return (
    <PageContainer
      loading={loading}
      {...pageHeader({
        title: '执行结果',
        backTo: backPath,
        crumbs: fromExecRecord
          ? [
              { title: '营销管理', path: '/crowd-marketing/activity' },
              { title: '活动执行记录', path: '/crowd-marketing/node-record' },
              { title: '执行结果' },
            ]
          : [
              { title: '营销管理', path: '/crowd-marketing/activity' },
              { title: '营销活动', path: '/crowd-marketing/activity' },
              { title: '执行结果' },
            ],
        extra: fromExecRecord ? null : (
          <Space>
            <Button onClick={() => history.push(`/crowd-marketing/activity/design/${id}`)}>
              返回画布
            </Button>
          </Space>
        ),
      })}
    >
      {!executed ? (
        <ProCard title="执行结果">
          <Empty
            description={
              <span>
                {data?.execStatus === '待执行' || data?.status === '待执行'
                  ? '本条执行记录尚未开始，暂无执行结果'
                  : data?.status === '已通过'
                    ? '活动已审批通过，尚未正式执行'
                    : data?.status === '待审批' || data?.status === '已驳回'
                      ? `当前状态「${data.status}」，正式执行后可在此查看结果`
                      : '尚未产生可展示的执行结果'}
                {data?.name ? `（${data.name}）` : ''}
              </span>
            }
          >
            {fromExecRecord ? (
              <Button type="primary" onClick={() => history.push(backPath)}>
                返回执行记录
              </Button>
            ) : (
              <Space>
                <Button type="primary" onClick={() => history.push('/crowd-marketing/activity')}>
                  去活动列表执行
                </Button>
                <Button onClick={() => history.push(`/crowd-marketing/activity/design/${id}`)}>
                  去画布
                </Button>
              </Space>
            )}
          </Empty>
        </ProCard>
      ) : (
        <>
          <ProCard
            title="执行结果"
            subTitle={
              <Typography.Text type="secondary">
                {data?.name || (fromExecRecord ? '执行记录' : '营销活动')} · ID{' '}
                {data?.id || id}
              </Typography.Text>
            }
            extra={<Tag color="processing">{data?.execStatus || '执行完成'}</Tag>}
            style={{ marginBottom: 16 }}
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              {fromExecRecord
                ? '本页为该次活动执行记录的结果汇总。执行时段：'
                : '本页为该营销活动的执行结果汇总。执行时段：'}
              {data?.startAt || '-'} ~ {data?.endAt || '-'}
            </Typography.Paragraph>
            <Row gutter={16}>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="进入人数" value={data?.summary?.entered ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达成功" value={data?.summary?.reachSuccess ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达失败" value={data?.summary?.reachFail ?? 0} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="触达成功率" value={reachRate} />
              </Col>
              <Col xs={12} md={8} lg={4}>
                <Statistic title="权益发放" value={data?.summary?.benefitIssued ?? 0} />
              </Col>
            </Row>
          </ProCard>

          <ProTable<NodeStat>
            headerTitle="按画布节点明细"
            rowKey="id"
            search={false}
            options={false}
            pagination={false}
            columns={columns}
            dataSource={data?.nodes || []}
            style={{ marginBottom: 16 }}
          />

          <ProTable<ReachMember>
            headerTitle="触达明细"
            rowKey="id"
            search={listSearchProps}
            options={false}
            pagination={listPagination as any}
            columns={memberColumns}
            dataSource={filteredMembers}
            rowSelection={{
              selectedRowKeys: selectedKeys,
              onChange: setSelectedKeys,
            }}
            toolBarRender={() => [
              <Button key="tag" type="primary" onClick={openSecondaryTag}>
                二次打标（新建人群标签）
              </Button>,
            ]}
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
              if (params.statusSearch && params.statusSearch !== '全部') {
                list = list.filter((x) => x.status === params.statusSearch);
              }
              if (params.channelSearch && params.channelSearch !== '全部') {
                list = list.filter((x) => x.channel === params.channelSearch);
              }
              if (params.centerSearch) {
                list = list.filter((x) => x.centers.includes(String(params.centerSearch)));
              }
              setFilteredMembers(list);
              return { data: list, success: true, total: list.length };
            }}
            params={{ membersLen: members.length }}
          />
        </>
      )}

      <Modal
        title="二次打标 · 新建人群标签"
        open={tagOpen}
        onCancel={() => setTagOpen(false)}
        onOk={submitSecondaryTag}
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item
            label="标签名称"
            required
            validateStatus={tagNameError ? 'error' : undefined}
            help={tagNameError}
          >
            <Input
              value={tagName}
              status={tagNameError ? 'error' : undefined}
              onChange={(e) => {
                setTagName(e.target.value);
                checkSecondaryTagName(e.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="分中心" required>
            <Select
              mode="multiple"
              options={centerOptions}
              value={tagCenters}
              onChange={setTagCenters}
            />
          </Form.Item>
          <Typography.Paragraph type="secondary">
            将为当前筛选结果中选中（或全部成功触达）成员新建标签，并出现在「数据打标 · 人群标签」列表。
          </Typography.Paragraph>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ActivityReportPage;
