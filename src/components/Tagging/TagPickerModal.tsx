import { CheckOutlined } from '@ant-design/icons';
import { Empty, Input, Modal, Space, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { TagGroup, TagItem } from './types';
import { colorForGroup, tagKey } from './types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  catalog: TagGroup[];
  /** 当前已打标签（单行编辑为完整集合；批量追加时作为基准合并） */
  value?: TagItem[];
  /**
   * replace：覆盖为所选（单行）
   * append：在原有基础上追加所选新增项（批量）
   */
  mode?: 'replace' | 'append';
  onSave: (next: TagItem[]) => void;
};

const TagPickerModal: React.FC<Props> = ({
  open,
  onOpenChange,
  title = '打标签',
  catalog,
  value = [],
  mode = 'replace',
  onSave,
}) => {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<TagItem[]>([]);
  const [baselineKeys, setBaselineKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const init = mode === 'append' ? [] : [...value];
    setSelected(init);
    setBaselineKeys(new Set(value.map(tagKey)));
    setKeyword('');
  }, [open, value, mode]);

  const selectedKeys = useMemo(() => new Set(selected.map(tagKey)), [selected]);

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

  const toggle = (item: TagItem) => {
    const key = tagKey(item);
    setSelected((prev) => {
      if (prev.some((x) => tagKey(x) === key)) {
        return prev.filter((x) => tagKey(x) !== key);
      }
      return [...prev, item];
    });
  };

  const remove = (item: TagItem) => {
    setSelected((prev) => prev.filter((x) => tagKey(x) !== tagKey(item)));
  };

  const handleOk = () => {
    let next: TagItem[];
    if (mode === 'append') {
      const map = new Map<string, TagItem>();
      value.forEach((x) => map.set(tagKey(x), x));
      selected.forEach((x) => map.set(tagKey(x), x));
      next = Array.from(map.values());
    } else {
      next = selected;
    }
    onSave(next);
    message.success(mode === 'append' ? '已追加标签（演示）' : '已保存标签（演示）');
    onOpenChange(false);
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      width={720}
      destroyOnHidden
      okText="确定"
      cancelText="取消"
    >
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
          已选
        </Typography.Text>
        {selected.length === 0 ? (
          <Typography.Text type="secondary">
            {mode === 'append'
              ? '点下方色块追加贴纸（不会去掉原有标签）'
              : '还没选标签，点下方色块即可贴上'}
          </Typography.Text>
        ) : (
          <Space size={[4, 4]} wrap>
            {selected.map((item) => (
              <Tag
                key={tagKey(item)}
                closable
                color={colorForGroup(item.group, catalog)}
                onClose={(e) => {
                  e.preventDefault();
                  remove(item);
                }}
              >
                {item.tag}
              </Tag>
            ))}
          </Space>
        )}
      </div>

      <Input.Search
        allowClear
        placeholder="搜索标签组 / 标签"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {filteredCatalog.length === 0 ? (
        <Empty description="无匹配标签" />
      ) : (
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredCatalog.map((g) => (
            <div key={g.group} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{g.group}</div>
              <Space wrap size={[8, 8]}>
                {g.tags.map((tag) => {
                  const item = { group: g.group, tag };
                  const key = tagKey(item);
                  const active = selectedKeys.has(key);
                  const alreadyHad = mode === 'append' && baselineKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: active
                          ? '1px solid transparent'
                          : '1px solid #d9d9d9',
                        background: active ? '#1677ff' : '#fff',
                        color: active ? '#fff' : 'rgba(0,0,0,0.88)',
                        cursor: 'pointer',
                        fontSize: 13,
                        lineHeight: 1.2,
                      }}
                    >
                      {active ? <CheckOutlined /> : null}
                      <span>{tag}</span>
                      {alreadyHad && !active ? (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          已有
                        </Typography.Text>
                      ) : null}
                    </button>
                  );
                })}
              </Space>
            </div>
          ))}
        </div>
      )}

      <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
        标签像贴纸：点一下贴上，再点撕下。一条数据可贴多个。
      </Typography.Paragraph>
    </Modal>
  );
};

export default TagPickerModal;
