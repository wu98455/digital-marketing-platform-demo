import { CheckOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type CatalogKind,
  colorForGroup,
  tagKey,
  useTagCatalog,
  type TagItem,
} from '@/components/Tagging';

export type CrowdTagScope = 'crowd' | CatalogKind;

export type CrowdConditionTag = TagItem & { scope: CrowdTagScope };

type CrowdMember = {
  id: string;
  memberId: string;
  name: string;
  phoneMasked: string;
  source: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess?: () => void;
};

const TAG_SECTIONS: { scope: CrowdTagScope; label: string; catalog: CatalogKind }[] = [
  { scope: 'crowd', label: '人群标签', catalog: 'customer' },
  { scope: 'customer', label: '客户', catalog: 'customer' },
  { scope: 'store', label: '店铺', catalog: 'store' },
  { scope: 'product', label: '商品', catalog: 'product' },
  { scope: 'campaign', label: '专题活动', catalog: 'campaign' },
];

const conditionKey = (c: CrowdConditionTag) => `${c.scope}::${tagKey(c)}`;

const formatTagSource = (c: CrowdConditionTag) => {
  const label = TAG_SECTIONS.find((s) => s.scope === c.scope)?.label || '';
  return `${label} · ${c.group}/${c.tag}`;
};

const catalogForScope = (scope: CrowdTagScope) =>
  TAG_SECTIONS.find((s) => s.scope === scope)?.catalog || 'customer';

function filterCatalog(catalog: ReturnType<ReturnType<typeof useTagCatalog>['getCatalog']>, keyword: string) {
  const k = keyword.trim();
  if (!k) return catalog;
  return catalog
    .map((g) => ({
      group: g.group,
      tags: g.tags.filter((t) => g.group.includes(k) || t.includes(k)),
    }))
    .filter((g) => g.tags.length > 0);
}

function downloadCsv(filename: string, rows: CrowdMember[]) {
  const header = ['会员ID', '姓名', '手机', '来源'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.memberId, r.name, r.phoneMasked, `"${(r.source || '').replace(/"/g, '""')}"`].join(','),
    ),
  ];
  const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CrowdCreateModal: React.FC<Props> = ({
  open,
  onOpenChange,
  initialName,
  onSuccess,
}) => {
  const { getCatalog } = useTagCatalog();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [persistType, setPersistType] = useState('正式人群');
  const [conditions, setConditions] = useState<CrowdConditionTag[]>([]);
  const [keyword, setKeyword] = useState('');
  const [timeNode, setTimeNode] = useState<string>();
  const [events, setEvents] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<number>();
  const [members, setMembers] = useState<CrowdMember[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setName(initialName || '');
    setPersistType('正式人群');
    setConditions([]);
    setKeyword('');
    setTimeNode(undefined);
    setEvents([]);
    setFeedback([]);
    setBehaviors([]);
    setEstimate(undefined);
    setMembers([]);
  }, [open, initialName]);

  const sectionCatalogs = useMemo(
    () =>
      TAG_SECTIONS.map((section) => ({
        ...section,
        catalog: filterCatalog(getCatalog(section.catalog), keyword),
      })).filter((section) => section.catalog.length > 0 || !keyword.trim()),
    [getCatalog, keyword],
  );

  const isSelected = (scope: CrowdTagScope, item: TagItem) =>
    conditions.some((c) => c.scope === scope && tagKey(c) === tagKey(item));

  const toggleCondition = (scope: CrowdTagScope, item: TagItem) => {
    const full: CrowdConditionTag = { ...item, scope };
    const key = conditionKey(full);
    setConditions((prev) => {
      if (prev.some((c) => conditionKey(c) === key)) {
        return prev.filter((c) => conditionKey(c) !== key);
      }
      return [...prev, full];
    });
  };

  const removeCondition = (c: CrowdConditionTag) => {
    setConditions((prev) => prev.filter((x) => conditionKey(x) !== conditionKey(c)));
  };

  const buildMembers = (count: number) => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const sourceLabel =
      conditions.length > 0
        ? conditions.map((c) => formatTagSource(c)).join('；')
        : '未选标签';
    const n = Math.min(8, Math.max(3, Math.floor(count / 200)));
    return Array.from({ length: n }, (_, i) => ({
      id: `cm${i + 1}`,
      memberId: `M${20000 + i}`,
      name: names[i % names.length],
      phoneMasked: `139****${String(2000 + i).slice(-4)}`,
      source: sourceLabel,
    }));
  };

  const goNext = () => {
    if (step === 0) {
      if (!name.trim()) {
        message.warning('请填写人群名称');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleSave = () => {
    if (!name.trim()) {
      message.warning('请填写人群名称');
      setStep(0);
      return;
    }
    message.success(`目标人群「${name.trim()}」已保存为${persistType}（演示）`);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Modal
      title="新建目标人群"
      open={open}
      onCancel={() => onOpenChange(false)}
      width={880}
      destroyOnHidden
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            上一步
          </Button>
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            {step < 2 ? (
              <Button type="primary" onClick={goNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSave}>
                保存
              </Button>
            )}
          </Space>
        </Space>
      }
    >
      <Steps
        size="small"
        current={step}
        style={{ marginBottom: 24 }}
        items={[
          { title: '基本信息' },
          { title: '圈选条件' },
          { title: '行为与确认' },
        ]}
      />

      {step === 0 && (
        <Form layout="vertical">
          <Form.Item label="人群名称" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：高价值亲子游客"
              maxLength={40}
            />
          </Form.Item>
          <Form.Item label="存放类型" extra="临时人群对应规则计算后短期存放。">
            <Select
              value={persistType}
              onChange={setPersistType}
              options={[
                { label: '正式人群', value: '正式人群' },
                { label: '临时人群（规则结果短期存放）', value: '临时人群' },
              ]}
            />
          </Form.Item>
        </Form>
      )}

      {step === 1 && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              background: '#fafafa',
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              minHeight: 44,
            }}
          >
            <Typography.Text type="secondary" style={{ marginRight: 8 }}>
              已选条件
            </Typography.Text>
            {conditions.length === 0 ? (
              <Typography.Text type="secondary">还没选条件，按分类点选下方标签</Typography.Text>
            ) : (
              <Space size={[4, 4]} wrap>
                {conditions.map((c) => (
                  <Tag
                    key={conditionKey(c)}
                    closable
                    color={colorForGroup(c.group, getCatalog(catalogForScope(c.scope)))}
                    onClose={(e) => {
                      e.preventDefault();
                      removeCondition(c);
                    }}
                  >
                    {formatTagSource(c)}
                  </Tag>
                ))}
              </Space>
            )}
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            按数据打标维度选标签（人群标签 / 客户 / 店铺 / 商品 / 专题活动）；多个标签之间为「且」（演示）。
          </Typography.Paragraph>
          <Input.Search
            allowClear
            placeholder="搜索分类或标签"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ maxHeight: 360, overflow: 'auto' }}>
            {sectionCatalogs.map((section) => (
              <div key={section.scope} style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 10 }}>
                  {section.label}
                </Typography.Text>
                {section.catalog.length === 0 ? (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    无匹配标签
                  </Typography.Text>
                ) : (
                  section.catalog.map((g) => (
                    <div key={`${section.scope}-${g.group}`} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, color: 'rgba(0,0,0,0.65)' }}>
                        {g.group}
                      </div>
                      <Space wrap size={[8, 8]}>
                        {g.tags.map((tag) => {
                          const item = { group: g.group, tag };
                          const active = isSelected(section.scope, item);
                          return (
                            <button
                              key={`${section.scope}-${tagKey(item)}`}
                              type="button"
                              onClick={() => toggleCondition(section.scope, item)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: active ? '1px solid transparent' : '1px solid #d9d9d9',
                                background: active ? '#1677ff' : '#fff',
                                color: active ? '#fff' : 'rgba(0,0,0,0.88)',
                                cursor: 'pointer',
                                fontSize: 13,
                              }}
                            >
                              {active ? <CheckOutlined /> : null}
                              {tag}
                            </button>
                          );
                        })}
                      </Space>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <Form layout="vertical">
          <Form.Item label="时间节点">
            <Select
              allowClear
              value={timeNode}
              onChange={setTimeNode}
              options={[
                { label: '近7天', value: '近7天' },
                { label: '近30天', value: '近30天' },
                { label: '近90天', value: '近90天' },
                { label: '指定日期区间', value: '指定日期区间' },
              ]}
              placeholder="可选"
            />
          </Form.Item>
          <Form.Item label="事件条件">
            <Select
              mode="multiple"
              value={events}
              onChange={setEvents}
              options={[
                { label: '浏览门票详情', value: '浏览门票详情' },
                { label: '下单成功', value: '下单成功' },
                { label: '支付成功', value: '支付成功' },
                { label: '充值卡消费', value: '充值卡消费' },
              ]}
              placeholder="可选"
            />
          </Form.Item>
          <Form.Item label="数据反馈">
            <Select
              mode="multiple"
              value={feedback}
              onChange={setFeedback}
              options={[
                { label: '访问', value: '访问' },
                { label: '参与', value: '参与' },
                { label: '点击', value: '点击' },
                { label: '下单', value: '下单' },
              ]}
              placeholder="可选"
            />
          </Form.Item>
          <Form.Item label="互动行为">
            <Select
              mode="multiple"
              value={behaviors}
              onChange={setBehaviors}
              options={[
                { label: '浏览', value: '浏览' },
                { label: '加购', value: '加购' },
                { label: '收藏', value: '收藏' },
                { label: '分享', value: '分享' },
                { label: '点击专题', value: '点击专题' },
              ]}
              placeholder="可选"
            />
          </Form.Item>
          <Space wrap style={{ marginBottom: 12 }}>
            <Button
              onClick={() => {
                const base = 800 + conditions.length * 420 + Math.floor(Math.random() * 3000);
                setEstimate(base);
                setMembers(buildMembers(base));
                message.success('已估算人数');
              }}
            >
              估算人数
            </Button>
            {estimate != null && (
              <Typography.Text>
                估算约 <Typography.Text strong>{estimate.toLocaleString()}</Typography.Text> 人
              </Typography.Text>
            )}
            <Button
              disabled={!members.length}
              onClick={() => downloadCsv(`${name || '目标人群'}-预览.csv`, members)}
            >
              导出
            </Button>
          </Space>
          {conditions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Typography.Text type="secondary">当前标签条件：</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap size={[4, 4]}>
                  {conditions.map((c) => (
                    <Tag key={conditionKey(c)}>{formatTagSource(c)}</Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            命中人预览
          </Typography.Text>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={members}
            columns={[
              { title: '会员ID', dataIndex: 'memberId', width: 110 },
              { title: '姓名', dataIndex: 'name', width: 90 },
              { title: '手机', dataIndex: 'phoneMasked', width: 120 },
              { title: '来源', dataIndex: 'source', ellipsis: true },
            ]}
            locale={{ emptyText: '请先点「估算人数」' }}
            scroll={{ y: 220 }}
          />
        </Form>
      )}
    </Modal>
  );
};

export default CrowdCreateModal;
