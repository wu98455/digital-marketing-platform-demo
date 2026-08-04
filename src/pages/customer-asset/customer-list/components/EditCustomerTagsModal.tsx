import { Button, Empty, Input, Modal, Space, Switch, Tag, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

export type TagGroup = {
  group: string;
  tags: string[];
};

/** 演示用可选标签目录（按组） */
const TAG_CATALOG: TagGroup[] = [
  {
    group: '客户价值',
    tags: ['高价值', '中价值', '低价值', '大会员', '潜客'],
  },
  {
    group: '兴趣偏好',
    tags: ['亲子游', '周边游', '酒店偏好', '门票敏感', '文创收藏'],
  },
  {
    group: '生命周期',
    tags: ['新客', '活跃', '沉默', '流失预警', '复购'],
  },
];

type DraftItem = {
  key: string;
  group: string;
  tag: string;
  enabled: boolean;
  isNew?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前客户已打标签（按组） */
  value?: TagGroup[];
  onSave: (next: TagGroup[]) => void;
};

const cloneGroups = (groups?: TagGroup[]): TagGroup[] =>
  (groups || []).map((g) => ({ group: g.group, tags: [...(g.tags || [])] }));

const EditCustomerTagsModal: React.FC<Props> = ({ open, onOpenChange, value, onSave }) => {
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [baseline, setBaseline] = useState<DraftItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const items: DraftItem[] = [];
    cloneGroups(value).forEach((g) => {
      (g.tags || []).forEach((tag) => {
        items.push({
          key: `${g.group}::${tag}`,
          group: g.group,
          tag,
          enabled: true,
        });
      });
    });
    // 目录中未选中的也列出，便于新增
    TAG_CATALOG.forEach((g) => {
      g.tags.forEach((tag) => {
        const key = `${g.group}::${tag}`;
        if (!items.some((x) => x.key === key)) {
          items.push({ key, group: g.group, tag, enabled: false, isNew: true });
        }
      });
    });
    setDraft(items);
    setBaseline(items.map((x) => ({ ...x })));
    setKeyword('');
  }, [open, value]);

  const filtered = useMemo(() => {
    const k = keyword.trim();
    if (!k) return draft;
    return draft.filter(
      (x) => x.group.includes(k) || x.tag.includes(k),
    );
  }, [draft, keyword]);

  const grouped = useMemo(() => {
    const map = new Map<string, DraftItem[]>();
    filtered.forEach((item) => {
      const list = map.get(item.group) || [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const toggle = (key: string, enabled: boolean) => {
    setDraft((prev) => prev.map((x) => (x.key === key ? { ...x, enabled } : x)));
  };

  const clearEdited = () => {
    setDraft(baseline.map((x) => ({ ...x })));
    message.info('已清空本次编辑');
  };

  const handleOk = () => {
    const nextMap = new Map<string, string[]>();
    draft
      .filter((x) => x.enabled)
      .forEach((x) => {
        const list = nextMap.get(x.group) || [];
        if (!list.includes(x.tag)) list.push(x.tag);
        nextMap.set(x.group, list);
      });
    // 保留原有空组卡片结构（至少展示已知分组）
    const groups = Array.from(
      new Set([
        ...TAG_CATALOG.map((g) => g.group),
        ...(value || []).map((g) => g.group),
      ]),
    ).map((group) => ({
      group,
      tags: nextMap.get(group) || [],
    }));
    onSave(groups);
    message.success('已保存客户标签（演示）');
    onOpenChange(false);
  };

  return (
    <Modal
      title="编辑全渠道客户标签"
      open={open}
      onCancel={() => onOpenChange(false)}
      width={720}
      destroyOnHidden
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={clearEdited}>清空已编</Button>
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button type="primary" onClick={handleOk}>
              确定
            </Button>
          </Space>
        </Space>
      }
    >
      <Input.Search
        allowClear
        placeholder="搜索标签组 / 标签"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      {grouped.length === 0 ? (
        <Empty description="无匹配标签" />
      ) : (
        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          {grouped.map(([group, items]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{group}</div>
              <Space wrap size={[8, 8]}>
                {items.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 10px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      background: item.enabled ? '#f6ffed' : '#fafafa',
                    }}
                  >
                    <Tag style={{ margin: 0 }} color={item.enabled ? 'success' : 'default'}>
                      {item.tag}
                    </Tag>
                    <Switch
                      size="small"
                      checked={item.enabled}
                      onChange={(checked) => toggle(item.key, checked)}
                    />
                  </div>
                ))}
              </Space>
            </div>
          ))}
        </div>
      )}
      <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>
        打开开关=打上该标签；关闭=删除该标签。可同时新增、修改多组标签。
      </div>
    </Modal>
  );
};

export default EditCustomerTagsModal;
