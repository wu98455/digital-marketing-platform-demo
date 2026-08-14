import { CheckOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import { Checkbox, Empty, Input, Space, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  getFavoriteTagKeys,
  getRecentTagKeys,
  tagIdentity,
} from '@/utils/tagFavorites';
import type { CatalogKind } from './TagCatalogContext';
import { useTagCatalog } from './TagCatalogContext';
import type { TagGroup, TagItem } from './types';

/** 与侧栏「数据打标」五个列表对齐 */
export const TAG_LIBRARY_TABS: {
  key: string;
  label: string;
  kind: CatalogKind;
}[] = [
  { key: 'person', label: '人群标签', kind: 'customer' },
  { key: 'customer', label: '人员数据', kind: 'customer' },
  { key: 'store', label: '店铺数据', kind: 'store' },
  { key: 'product', label: '商品数据', kind: 'product' },
  { key: 'campaign', label: '专题活动', kind: 'campaign' },
];

export type LibraryTagItem = TagItem & {
  source: string;
  sourceLabel: string;
  kind: CatalogKind;
};

export const libraryTagKey = (item: LibraryTagItem) =>
  `${item.source}::${item.group}::${item.tag}`;

type ScopeFilter = 'all' | 'recent' | 'fav';

type Props = {
  value: LibraryTagItem[];
  onChange: (next: LibraryTagItem[]) => void;
  required?: boolean;
  error?: string;
};

const CatalogPanel: React.FC<{
  catalog: TagGroup[];
  source: string;
  sourceLabel: string;
  kind: CatalogKind;
  selectedKeys: Set<string>;
  keyword: string;
  scopeKeys?: Set<string>;
  showScopeFilter?: boolean;
  scope: ScopeFilter;
  onScopeChange: (next: ScopeFilter) => void;
  onToggle: (item: LibraryTagItem) => void;
}> = ({
  catalog,
  source,
  sourceLabel,
  kind,
  selectedKeys,
  keyword,
  scopeKeys,
  showScopeFilter,
  scope,
  onScopeChange,
  onToggle,
}) => {
  const filtered = useMemo(() => {
    const k = keyword.trim();
    return catalog
      .map((g) => ({
        group: g.group,
        tags: g.tags.filter((t) => {
          if (scopeKeys && !scopeKeys.has(tagIdentity(g.group, t))) return false;
          if (!k) return true;
          return g.group.includes(k) || t.includes(k);
        }),
      }))
      .filter((g) => g.tags.length > 0);
  }, [catalog, keyword, scopeKeys]);

  return (
    <div>
      {showScopeFilter ? (
        <Space wrap style={{ marginBottom: 12 }} size={[16, 8]}>
          <Checkbox
            checked={scope === 'recent'}
            onChange={(e) => onScopeChange(e.target.checked ? 'recent' : 'all')}
          >
            只看常用
          </Checkbox>
          <Checkbox
            checked={scope === 'fav'}
            onChange={(e) => onScopeChange(e.target.checked ? 'fav' : 'all')}
          >
            只看个人收藏
          </Checkbox>
        </Space>
      ) : null}
      {!filtered.length ? (
        <Empty
          description={scopeKeys ? '当前筛选下无标签' : '无匹配标签'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div style={{ maxHeight: 360, overflow: 'auto', paddingTop: 4 }}>
          {filtered.map((g) => (
            <div key={g.group} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{g.group}</div>
              <Space wrap size={[8, 8]}>
                {g.tags.map((tag) => {
                  const item: LibraryTagItem = {
                    source,
                    sourceLabel,
                    kind,
                    group: g.group,
                    tag,
                  };
                  const key = libraryTagKey(item);
                  const active = selectedKeys.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onToggle(item)}
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
                        lineHeight: 1.2,
                      }}
                    >
                      {active ? <CheckOutlined /> : null}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </Space>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** 数据打标五库标签选择（标签页 + 分类） */
const MultiLibraryTagPicker: React.FC<Props> = ({ value, onChange, error }) => {
  const { initialState } = useModel('@@initialState');
  const username = initialState?.currentUser?.username as string | undefined;
  const { getCatalog } = useTagCatalog();
  const [active, setActive] = useState(TAG_LIBRARY_TABS[0].key);
  const [keyword, setKeyword] = useState('');
  /** 仅「人群标签」页：全部 / 只看常用 / 只看个人收藏（后两者二选一） */
  const [scope, setScope] = useState<ScopeFilter>('all');
  const selectedKeys = useMemo(
    () => new Set(value.map(libraryTagKey)),
    [value],
  );

  const personScopeKeys = useMemo(() => {
    if (scope === 'recent') return new Set(getRecentTagKeys(username));
    if (scope === 'fav') return new Set(getFavoriteTagKeys(username));
    return undefined;
  }, [scope, username]);

  const toggle = (item: LibraryTagItem) => {
    const key = libraryTagKey(item);
    if (selectedKeys.has(key)) {
      onChange(value.filter((x) => libraryTagKey(x) !== key));
    } else {
      onChange([...value, item]);
    }
  };

  return (
    <div>
      {error ? (
        <div style={{ color: '#ff4d4f', marginBottom: 8, fontSize: 14 }}>{error}</div>
      ) : null}
      <Input.Search
        allowClear
        placeholder="搜索分类 / 标签"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Tabs
        activeKey={active}
        onChange={(key) => {
          setActive(key);
          if (key !== 'person') setScope('all');
        }}
        items={TAG_LIBRARY_TABS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <CatalogPanel
              catalog={getCatalog(tab.kind)}
              source={tab.key}
              sourceLabel={tab.label}
              kind={tab.kind}
              selectedKeys={selectedKeys}
              keyword={keyword}
              showScopeFilter={tab.key === 'person'}
              scope={scope}
              onScopeChange={setScope}
              scopeKeys={tab.key === 'person' ? personScopeKeys : undefined}
              onToggle={toggle}
            />
          ),
        }))}
      />
    </div>
  );
};

export default MultiLibraryTagPicker;
