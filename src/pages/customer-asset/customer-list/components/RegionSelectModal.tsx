import { Button, Checkbox, Input, Modal, Space, Tag } from 'antd';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { findNode, regionTree, type RegionNode } from '../regionData';

export type RegionValue = { code: string; name: string };

type Props = {
  open: boolean;
  value: RegionValue[];
  onOk: (rows: RegionValue[]) => void;
  onCancel: () => void;
};

type CheckState = boolean | 'indeterminate';

function getDescendantCodes(node: RegionNode): string[] {
  if (!node.children?.length) return [node.code];
  return node.children.flatMap(getDescendantCodes);
}

function getCheckState(node: RegionNode, checked: Set<string>): CheckState {
  const leaves = getDescendantCodes(node);
  const hit = leaves.filter((c) => checked.has(c)).length;
  if (hit === 0) return false;
  if (hit === leaves.length) return true;
  return 'indeterminate';
}

const colStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  height: 360,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
  fontWeight: 500,
  background: 'var(--ant-color-fill-quaternary, #fafafa)',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: 4,
};

const RegionSelectModal: React.FC<Props> = ({ open, value, onOk, onCancel }) => {
  const [keyword, setKeyword] = useState('');
  const deferredKeyword = useDeferredValue(keyword.trim());
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [activeProvince, setActiveProvince] = useState<string>();
  const [activeCity, setActiveCity] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setChecked(new Set(value.map((v) => v.code)));
    setKeyword('');
    const first = regionTree[0];
    setActiveProvince(first?.code);
    setActiveCity(first?.children?.[0]?.code);
  }, [open, value]);

  const province = useMemo(
    () => regionTree.find((p) => p.code === activeProvince),
    [activeProvince],
  );
  const city = useMemo(
    () => province?.children?.find((c) => c.code === activeCity),
    [province, activeCity],
  );

  const selectedTags = useMemo(() => {
    const tags: RegionValue[] = [];
    const walk = (nodes: RegionNode[]) => {
      nodes.forEach((n) => {
        const state = getCheckState(n, checked);
        if (state === true) {
          tags.push({ code: n.code, name: n.name });
          return;
        }
        if (state === 'indeterminate' && n.children) walk(n.children);
        else if (!n.children?.length && checked.has(n.code)) {
          tags.push({ code: n.code, name: n.name });
        }
      });
    };
    walk(regionTree);
    return tags;
  }, [checked]);

  const filterMatch = (name: string) =>
    !deferredKeyword || name.includes(deferredKeyword);

  const toggleNode = (node: RegionNode, next: boolean) => {
    setChecked((prev) => {
      const set = new Set(prev);
      getDescendantCodes(node).forEach((c) => {
        if (next) set.add(c);
        else set.delete(c);
      });
      return set;
    });
  };

  const removeTag = (code: string) => {
    const node = findNode(regionTree, code);
    if (node) toggleNode(node, false);
    else {
      setChecked((prev) => {
        const set = new Set(prev);
        set.delete(code);
        return set;
      });
    }
  };

  const renderRow = (
    node: RegionNode,
    opts: { active?: boolean; showArrow?: boolean; onFocus?: () => void },
  ) => {
    const state = getCheckState(node, checked);
    const visible = filterMatch(node.name);
    if (!visible && deferredKeyword) {
      // 保留父级可见性：若子级匹配仍显示
      const childHit = getDescendantCodes(node).some((code) => {
        const n = findNode(regionTree, code);
        return n && filterMatch(n.name);
      });
      if (!childHit) return null;
    }
    return (
      <div
        key={node.code}
        onClick={() => opts.onFocus?.()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          cursor: 'pointer',
          borderRadius: 6,
          background: opts.active ? 'var(--ant-color-primary-bg, #e6f4ff)' : undefined,
        }}
      >
        <Checkbox
          checked={state === true}
          indeterminate={state === 'indeterminate'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => toggleNode(node, e.target.checked)}
        />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</span>
        {opts.showArrow && <span style={{ color: 'rgba(0,0,0,0.25)' }}>{'>'}</span>}
      </div>
    );
  };

  const provinceCheckedCount = regionTree.filter((p) => getCheckState(p, checked) !== false).length;
  const cityCheckedCount =
    province?.children?.filter((c) => getCheckState(c, checked) !== false).length ?? 0;
  const districtCheckedCount =
    city?.children?.filter((d) => getCheckState(d, checked) !== false).length ?? 0;

  return (
    <Modal
      title="地区选择"
      open={open}
      width={720}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => {
        // 回填：优先用标签压缩结果；若无标签则用叶子
        const rows =
          selectedTags.length > 0
            ? selectedTags
            : Array.from(checked).map((code) => {
                const n = findNode(regionTree, code);
                return { code, name: n?.name || code };
              });
        onOk(rows);
      }}
      okText="确定"
      cancelText="取消"
    >
      <Input.Search
        allowClear
        placeholder="请输入区域名称"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <div style={{ marginBottom: 12, minHeight: 32 }}>
        <span style={{ color: 'rgba(0,0,0,0.45)', marginRight: 8 }}>已选：</span>
        <Space size={[4, 4]} wrap>
          {selectedTags.length === 0 && (
            <span style={{ color: 'rgba(0,0,0,0.25)' }}>暂无</span>
          )}
          {selectedTags.map((t) => (
            <Tag key={t.code} closable onClose={() => removeTag(t.code)} color="processing">
              {t.name}
            </Tag>
          ))}
        </Space>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={colStyle}>
          <div style={headerStyle}>省选择 ({provinceCheckedCount})</div>
          <div style={listStyle}>
            {regionTree.map((p) =>
              renderRow(p, {
                active: p.code === activeProvince,
                showArrow: !!p.children?.length,
                onFocus: () => {
                  setActiveProvince(p.code);
                  setActiveCity(p.children?.[0]?.code);
                },
              }),
            )}
          </div>
        </div>
        <div style={colStyle}>
          <div style={headerStyle}>市选择 ({cityCheckedCount})</div>
          <div style={listStyle}>
            {(province?.children || []).map((c) =>
              renderRow(c, {
                active: c.code === activeCity,
                showArrow: !!c.children?.length,
                onFocus: () => setActiveCity(c.code),
              }),
            )}
          </div>
        </div>
        <div style={colStyle}>
          <div style={headerStyle}>区县选择 ({districtCheckedCount})</div>
          <div style={listStyle}>
            {(city?.children || []).map((d) =>
              renderRow(d, {
                active: false,
                showArrow: false,
              }),
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RegionSelectModal;
