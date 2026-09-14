import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ProFormInstance } from '@ant-design/pro-components';
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  /** 权益发放：未发放 / 已发放内容 */
  benefit: string;
  /** 是否购买节点产出：已转换 / 转换失败 / —（漏斗用，明细表不再展示） */
  convertStatus?: string;
  visited?: string;
  addedCart?: string;
  ordered?: string;
};

type DetailJumpPreset = 'all' | 'success' | 'fail' | 'convertOk' | 'convertFail';

function rateText(success = 0, failed = 0) {
  const total = success + failed;
  if (!total) return '-';
  return `${((success / total) * 100).toFixed(1)}%`;
}

function isBenefitChannel(channel?: string) {
  return /发券|加积分|优惠券|权益/.test(channel || '');
}

function yesNoTag(v?: string) {
  return v === '是' ? <Tag color="success">是</Tag> : <Tag>否</Tag>;
}

function downloadReachMembersCsv(filename: string, rows: ReachMember[]) {
  const header = [
    '人员 OneID',
    '姓名',
    '手机',
    '平台',
    '渠道',
    '触达状态',
    '是否访问',
    '是否加购',
    '是否下单',
  ];
  const lines = rows.map((r) =>
    [
      r.oneId,
      r.name,
      r.phoneMasked,
      (r.centers || []).join('、'),
      r.channel,
      r.status,
      r.visited || '否',
      r.addedCart || '否',
      r.ordered || '否',
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(','),
  );
  const csv = `\uFEFF${[header.join(','), ...lines].join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ActivityReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromExecRecord = location.pathname.includes('/node-record/result/');
  const backPath = fromExecRecord
    ? '/crowd-marketing/node-record'
    : '/crowd-marketing/activity';
  const { initialState } = useModel('@@initialState');
  const { addTag, addGroup, getCatalog } = useTagCatalog();
  const { options: centerOptions } = useAllowedCenters();
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<ReachMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ReachMember[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagNameError, setTagNameError] = useState<string>();
  const [tagCategory, setTagCategory] = useState('');
  const [tagRemark, setTagRemark] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const catalog = getCatalog('customer');
  const groupOptions = useMemo(
    () => catalog.map((g) => ({ label: g.group, value: g.group })),
    [catalog],
  );
  const detailSectionRef = useRef<HTMLDivElement>(null);
  const detailFormRef = useRef<ProFormInstance>();
  /** 顶部「权益发放」下钻：按发券/加积分渠道筛明细（表单渠道仍显示「全部」） */
  const detailBenefitOnlyRef = useRef(false);

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
        const hasConvert =
          !!res.data?.summary?.hasConvert ||
          (res.data?.nodes || []).some(
            (n: NodeStat) => n.nodeName === '是否购买' || n.nodeType === '判断',
          );
        const hasBenefitNodes = (res.data?.nodes || []).some(
          (n: NodeStat) =>
            n.nodeType === '优惠' || /发券|加积分|权益/.test(n.nodeName || ''),
        );
        const channels = hasConvert
          ? ['短信', '小程序发券']
          : hasBenefitNodes
            ? ['短信', '小程序发券', '加积分']
            : ['短信', '企微发消息'];
        const list: ReachMember[] = Array.from(
          { length: Math.min(Math.max(entered, 8), 20) },
          (_, i) => {
            const status = i % 5 === 0 ? '失败' : '成功';
            const channel = channels[i % channels.length];
            let benefit = '未发放';
            let convertStatus = '—';
            if (hasConvert && status === '成功') {
              // 约 28% 已购买=已转换；其余走未购买发券=转换失败
              if (i % 7 === 0 || i % 7 === 3) {
                convertStatus = '已转换';
                benefit = '未发放';
              } else {
                convertStatus = '转换失败';
                benefit = channel === '小程序发券' || i % 2 === 0 ? '中秋满减券' : '未发放';
              }
            } else if (status === '成功') {
              if (channel === '加积分') benefit = '100积分';
              else if (channel === '小程序发券') benefit = '满减券';
              else if (i % 3 === 0) benefit = '50积分';
            }
            const ordered =
              convertStatus === '已转换' || (status === '成功' && i % 5 === 1) ? '是' : '否';
            const visited = status === '成功' && i % 3 !== 0 ? '是' : '否';
            const addedCart =
              ordered === '是' || (visited === '是' && i % 4 === 0) ? '是' : '否';
            return {
              id: `m${i + 1}`,
              oneId: mockOneId(i + 1),
              name: ['张三', '李四', '王五', '赵六', '钱七', '孙八'][i % 6],
              phoneMasked: `138****${String(1000 + i).slice(-4)}`,
              centers: [centers[i % centers.length] || centers[0]],
              status,
              channel,
              benefit,
              convertStatus: hasConvert ? convertStatus : undefined,
              visited,
              addedCart,
              ordered,
            };
          },
        );
        setMembers(list);
        setFilteredMembers(list);
        setSelectedKeys([]);
      })
      .finally(() => setLoading(false));
  }, [id, fromExecRecord]);

  const jumpToDetail = (preset: DetailJumpPreset) => {
    detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detailBenefitOnlyRef.current = false;
    const next = {
      statusSearch:
        preset === 'success' ? '成功' : preset === 'fail' ? '失败' : '全部',
      channelSearch: '全部',
      visitedSearch: '全部',
      addedCartSearch: '全部',
      orderedSearch:
        preset === 'convertOk' ? '是' : preset === 'convertFail' ? '否' : '全部',
      centerSearch: undefined,
      oneId: undefined,
      name: undefined,
      phone: undefined,
    };
    detailFormRef.current?.setFieldsValue(next);
    window.setTimeout(() => detailFormRef.current?.submit?.(), 0);
  };

  useEffect(() => {
    if (!tagCategory && groupOptions[0]?.value) {
      setTagCategory(groupOptions[0].value);
    }
  }, [groupOptions, tagCategory]);

  const nodeStats: NodeStat[] = data?.nodes || [];
  const hasConvert = useMemo(
    () =>
      !!data?.summary?.hasConvert ||
      nodeStats.some((n) => n.nodeName === '是否购买' || n.nodeType === '判断'),
    [data?.summary?.hasConvert, nodeStats],
  );

  const convertRate = useMemo(() => {
    return rateText(data?.summary?.convertSuccess ?? 0, data?.summary?.convertFail ?? 0);
  }, [data]);

  /** 漏斗：有是否购买时，触达成功 = 转换成功 + 转换失败 */
  const funnelReachSuccess = useMemo(() => {
    if (!hasConvert) return data?.summary?.reachSuccess ?? 0;
    const summed = (data?.summary?.convertSuccess ?? 0) + (data?.summary?.convertFail ?? 0);
    return summed > 0 ? summed : data?.summary?.reachSuccess ?? 0;
  }, [hasConvert, data?.summary]);

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
      order: 60,
    },
    {
      title: '渠道',
      dataIndex: 'channelSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        短信: { text: '短信' },
        企微发消息: { text: '企微发消息' },
        小程序发券: { text: '小程序发券' },
        加积分: { text: '加积分' },
      },
      initialValue: '全部',
      order: 50,
    },
    {
      title: '是否访问',
      dataIndex: 'visitedSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        是: { text: '是' },
        否: { text: '否' },
      },
      initialValue: '全部',
      order: 48,
    },
    {
      title: '是否加购',
      dataIndex: 'addedCartSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        是: { text: '是' },
        否: { text: '否' },
      },
      initialValue: '全部',
      order: 46,
    },
    {
      title: '是否下单',
      dataIndex: 'orderedSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        是: { text: '是' },
        否: { text: '否' },
      },
      initialValue: '全部',
      order: 44,
    },
    {
      title: '平台',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        (data?.centers?.length ? data.centers : centerOptions.map((o) => o.value)).map(
          (c: string) => [c, { text: c }],
        ),
      ),
      order: 40,
    },
    { title: '人员 OneID', dataIndex: 'oneId', hideInTable: true, order: 30 },
    { title: '手机号', dataIndex: 'phone', hideInTable: true, order: 20 },
    { title: '姓名', dataIndex: 'name', hideInTable: true, order: 10 },
    { title: '人员 OneID', dataIndex: 'oneId', search: false, width: 160 },
    { title: '姓名', dataIndex: 'name', search: false, width: 80 },
    { title: '手机', dataIndex: 'phoneMasked', search: false, width: 120 },
    {
      title: '平台',
      dataIndex: 'centers',
      search: false,
      width: 140,
      render: (_, row) => <CenterTags centers={row.centers} />,
    },
    { title: '渠道', dataIndex: 'channel', search: false, width: 120 },
    {
      title: '触达状态',
      dataIndex: 'status',
      search: false,
      width: 90,
      render: (v) => <Tag color={v === '成功' ? 'success' : 'error'}>{v}</Tag>,
    },
    {
      title: '是否访问',
      dataIndex: 'visited',
      search: false,
      width: 90,
      render: (v: string) => yesNoTag(v),
    },
    {
      title: '是否加购',
      dataIndex: 'addedCart',
      search: false,
      width: 90,
      render: (v: string) => yesNoTag(v),
    },
    {
      title: '是否下单',
      dataIndex: 'ordered',
      search: false,
      width: 90,
      render: (v: string) => yesNoTag(v),
    },
  ];

  const executed = data?.executed !== false && data?.execStatus !== '未执行';

  const openSecondaryTag = () => {
    if (!selectedKeys.length) {
      message.warning('请先勾选要打标的人员');
      return;
    }
    setTagName(`活动回写·${data?.name || id}·${new Date().toISOString().slice(0, 10)}`);
    setTagNameError(undefined);
    setTagCategory(groupOptions[0]?.value || '基础属性');
    setTagRemark('');
    setTagOpen(true);
  };

  const submitSecondaryTag = () => {
    const name = tagName.trim();
    const category = tagCategory.trim();
    if (!name) {
      message.warning('请填写标签名称');
      return;
    }
    if (!category) {
      message.warning('请选择分类');
      return;
    }
    if (checkSecondaryTagName(name)) {
      message.error('标签名称已存在，请换一个名称');
      return;
    }
    if (!selectedKeys.length) {
      message.warning('请先勾选要打标的人员');
      return;
    }
    const err = addTag('customer', category, name);
    if (err) {
      message.error(err);
      return;
    }
    const selected = members.filter((m) => selectedKeys.includes(m.id));
    const inheritCenters = [
      ...new Set(selected.flatMap((m) => m.centers || [])),
    ];
    message.success(
      `已新建人群标签「${name}」（${selectedKeys.length} 人${
        inheritCenters.length ? `，平台继承：${inheritCenters.join('、')}` : ''
      }${tagRemark.trim() ? `；说明：${tagRemark.trim()}` : ''}，创建人 ${
        initialState?.currentUser?.username || ''
      }）`,
    );
    setTagOpen(false);
    history.push('/tag-center/list');
  };

  const submitNewCategory = () => {
    const n = newCategoryName.trim();
    if (!n) {
      message.warning('请输入分类名');
      return;
    }
    const err = addGroup('customer', n);
    if (err) {
      message.error(err);
      return;
    }
    setTagCategory(n);
    setCategoryModalOpen(false);
    setNewCategoryName('');
    message.success('已新增分类');
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
              {hasConvert
                ? '。含「是否购买」节点：触达成功 = 转换成功 + 转换失败（漏斗）。'
                : ''}
            </Typography.Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={12} md={8} lg={hasConvert ? 4 : 6}>
                <Statistic
                  title={
                    <a onClick={() => jumpToDetail('all')} style={{ color: '#1677ff' }}>
                      选人人数
                    </a>
                  }
                  value={data?.summary?.entered ?? 0}
                  valueStyle={{ color: '#1677ff', cursor: 'pointer' }}
                  formatter={(v) => (
                    <a onClick={() => jumpToDetail('all')} style={{ color: 'inherit' }}>
                      {v}
                    </a>
                  )}
                />
              </Col>
              <Col xs={12} md={8} lg={hasConvert ? 4 : 6}>
                <Statistic
                  title={
                    <a onClick={() => jumpToDetail('success')} style={{ color: '#1677ff' }}>
                      触达成功
                    </a>
                  }
                  value={funnelReachSuccess}
                  valueStyle={{ color: '#1677ff', cursor: 'pointer' }}
                  formatter={(v) => (
                    <a onClick={() => jumpToDetail('success')} style={{ color: 'inherit' }}>
                      {v}
                    </a>
                  )}
                />
              </Col>
              <Col xs={12} md={8} lg={hasConvert ? 4 : 6}>
                <Statistic
                  title={
                    <a onClick={() => jumpToDetail('fail')} style={{ color: '#1677ff' }}>
                      触达失败
                    </a>
                  }
                  value={data?.summary?.reachFail ?? 0}
                  valueStyle={{ color: '#1677ff', cursor: 'pointer' }}
                  formatter={(v) => (
                    <a onClick={() => jumpToDetail('fail')} style={{ color: 'inherit' }}>
                      {v}
                    </a>
                  )}
                />
              </Col>
              {hasConvert ? (
                <>
                  <Col xs={12} md={8} lg={4}>
                    <Statistic
                      title={
                        <a onClick={() => jumpToDetail('convertOk')} style={{ color: '#1677ff' }}>
                          转换成功
                        </a>
                      }
                      value={data?.summary?.convertSuccess ?? 0}
                      valueStyle={{ color: '#1677ff', cursor: 'pointer' }}
                      formatter={(v) => (
                        <a onClick={() => jumpToDetail('convertOk')} style={{ color: 'inherit' }}>
                          {v}
                        </a>
                      )}
                    />
                  </Col>
                  <Col xs={12} md={8} lg={4}>
                    <Statistic
                      title={
                        <a onClick={() => jumpToDetail('convertFail')} style={{ color: '#1677ff' }}>
                          转换失败
                        </a>
                      }
                      value={data?.summary?.convertFail ?? 0}
                      valueStyle={{ color: '#1677ff', cursor: 'pointer' }}
                      formatter={(v) => (
                        <a onClick={() => jumpToDetail('convertFail')} style={{ color: 'inherit' }}>
                          {v}
                        </a>
                      )}
                    />
                  </Col>
                  <Col xs={12} md={8} lg={4}>
                    <Statistic title="转换成功率" value={convertRate} />
                  </Col>
                </>
              ) : null}
            </Row>
          </ProCard>

          <div ref={detailSectionRef} style={{ marginBottom: 16 }}>
            <ProTable<ReachMember>
              headerTitle="触达明细"
              rowKey="id"
              formRef={detailFormRef}
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
                <Button
                  key="export"
                  onClick={() => {
                    if (!filteredMembers.length) {
                      message.warning('当前筛选下无数据可导出');
                      return;
                    }
                    downloadReachMembersCsv(
                      `触达明细-${data?.name || id || '活动'}-${new Date().toISOString().slice(0, 10)}.csv`,
                      filteredMembers,
                    );
                    message.success(`已导出 ${filteredMembers.length} 条`);
                  }}
                >
                  导出
                </Button>,
                <Button
                  key="tag"
                  type="primary"
                  disabled={!selectedKeys.length}
                  onClick={openSecondaryTag}
                >
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
                  detailBenefitOnlyRef.current = false;
                  list = list.filter((x) => x.channel === params.channelSearch);
                } else if (detailBenefitOnlyRef.current) {
                  list = list.filter((x) => isBenefitChannel(x.channel));
                }
                if (params.visitedSearch && params.visitedSearch !== '全部') {
                  list = list.filter((x) => x.visited === params.visitedSearch);
                }
                if (params.addedCartSearch && params.addedCartSearch !== '全部') {
                  list = list.filter((x) => x.addedCart === params.addedCartSearch);
                }
                if (params.orderedSearch && params.orderedSearch !== '全部') {
                  list = list.filter((x) => x.ordered === params.orderedSearch);
                }
                if (params.centerSearch) {
                  list = list.filter((x) => x.centers.includes(String(params.centerSearch)));
                }
                setFilteredMembers(list);
                return { data: list, success: true, total: list.length };
              }}
              params={{ membersLen: members.length }}
            />
          </div>
        </>
      )}

      <Modal
        title="二次打标 · 新建人群标签"
        open={tagOpen}
        onCancel={() => setTagOpen(false)}
        onOk={submitSecondaryTag}
        destroyOnHidden
        width={520}
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
              placeholder="如：沉睡召回"
              status={tagNameError ? 'error' : undefined}
              allowClear
              onChange={(e) => {
                setTagName(e.target.value);
                checkSecondaryTagName(e.target.value);
              }}
              onBlur={() => checkSecondaryTagName(tagName)}
            />
          </Form.Item>
          <Form.Item
            label={
              <span>
                分类 <Typography.Text type="danger">*</Typography.Text>
              </span>
            }
            required
          >
            <Space wrap>
              <Select
                style={{ width: 280 }}
                options={groupOptions}
                value={tagCategory || undefined}
                placeholder="请选择分类"
                onChange={setTagCategory}
              />
              <Button
                onClick={() => {
                  setNewCategoryName('');
                  setCategoryModalOpen(true);
                }}
              >
                新增分类
              </Button>
            </Space>
          </Form.Item>
          <Form.Item label="说明">
            <Input.TextArea
              rows={3}
              value={tagRemark}
              placeholder="可选"
              onChange={(e) => setTagRemark(e.target.value)}
            />
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            将为已勾选的 {selectedKeys.length}{' '}
            人新建人群标签；平台由所选人员自动继承，无需再选。标签将出现在「数据打标 ·
            人群标签」列表。
          </Typography.Paragraph>
        </Form>
      </Modal>

      <Modal
        title="新增分类"
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        onOk={submitNewCategory}
        destroyOnHidden
      >
        <Input
          placeholder="分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={submitNewCategory}
        />
      </Modal>
    </PageContainer>
  );
};

export default ActivityReportPage;
