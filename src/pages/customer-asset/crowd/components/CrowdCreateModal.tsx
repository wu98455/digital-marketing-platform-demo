import { CheckOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Steps,
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

export type CrowdConditionTag = TagItem & { source: CatalogKind };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 复制时预填名称等 */
  initialName?: string;
  onSuccess?: () => void;
};

const SOURCE_OPTIONS: { label: string; value: CatalogKind }[] = [
  { label: '客户', value: 'customer' },
  { label: '店铺', value: 'store' },
  { label: '商品', value: 'product' },
  { label: '专题活动', value: 'campaign' },
];

const SOURCE_LABEL: Record<CatalogKind, string> = {
  customer: '客户',
  store: '店铺',
  product: '商品',
  campaign: '专题活动',
};

const conditionKey = (c: CrowdConditionTag) => `${c.source}::${tagKey(c)}`;

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
  const [source, setSource] = useState<CatalogKind>('customer');
  const [keyword, setKeyword] = useState('');
  const [timeNode, setTimeNode] = useState<string>();
  const [events, setEvents] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<number>();

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setName(initialName || '');
    setPersistType('正式人群');
    setConditions([]);
    setSource('customer');
    setKeyword('');
    setTimeNode(undefined);
    setEvents([]);
    setFeedback([]);
    setBehaviors([]);
    setEstimate(undefined);
  }, [open, initialName]);

  const catalog = getCatalog(source);
  const selectedKeys = useMemo(
    () => new Set(conditions.filter((c) => c.source === source).map((c) => tagKey(c))),
    [conditions, source],
  );

  const filteredCatalog = useMemo(() => {
    const k = keyword.trim();
    if (!k) return catalog;
    return catalog
      .map((g) => ({
        group: g.group,
        tags: g.tags.filter((t) => g.group.includes(k) || t.includes(k)),
      }))
      .filter((g) => g.tags.length > 0);
  }, [catalog, keyword]);

  const toggleCondition = (item: TagItem) => {
    const full: CrowdConditionTag = { ...item, source };
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
      width={800}
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
          <Form.Item
            label="存放类型"
            extra="临时人群对应规则计算后短期存放。"
          >
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
              <Typography.Text type="secondary">
                还没选条件，切换下方类型后点色块即可
              </Typography.Text>
            ) : (
              <Space size={[4, 4]} wrap>
                {conditions.map((c) => (
                  <Tag
                    key={conditionKey(c)}
                    closable
                    color={colorForGroup(c.group, getCatalog(c.source))}
                    onClose={(e) => {
                      e.preventDefault();
                      removeCondition(c);
                    }}
                  >
                    {SOURCE_LABEL[c.source]}/{c.tag}
                  </Tag>
                ))}
              </Space>
            )}
          </div>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            同类标签为且；不同类之间为且（演示）。允许某类不选。
          </Typography.Paragraph>
          <Segmented
            block
            options={SOURCE_OPTIONS}
            value={source}
            onChange={(v) => {
              setSource(v as CatalogKind);
              setKeyword('');
            }}
            style={{ marginBottom: 12 }}
          />
          <Input.Search
            allowClear
            placeholder={`搜索${SOURCE_LABEL[source]}标签`}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {filteredCatalog.map((g) => (
              <div key={g.group} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{g.group}</div>
                <Space wrap size={[8, 8]}>
                  {g.tags.map((tag) => {
                    const item = { group: g.group, tag };
                    const active = selectedKeys.has(tagKey(item));
                    return (
                      <button
                        key={tagKey(item)}
                        type="button"
                        onClick={() => toggleCondition(item)}
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
          <Space>
            <Button
              onClick={() => {
                const base = 800 + conditions.length * 420 + Math.floor(Math.random() * 3000);
                setEstimate(base);
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
          </Space>
          {conditions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Typography.Text type="secondary">当前标签条件：</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap size={[4, 4]}>
                  {conditions.map((c) => (
                    <Tag key={conditionKey(c)}>
                      {SOURCE_LABEL[c.source]}/{c.tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </Form>
      )}
    </Modal>
  );
};

export default CrowdCreateModal;
