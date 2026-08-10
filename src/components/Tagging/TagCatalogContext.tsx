import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  CAMPAIGN_TAG_CATALOG,
  CUSTOMER_TAG_CATALOG,
  PRODUCT_TAG_CATALOG,
  STORE_TAG_CATALOG,
} from './catalogs';
import type { TagGroup, TagItem } from './types';
import { tagKey } from './types';

export type CatalogKind = 'customer' | 'store' | 'product' | 'campaign';

const INITIAL: Record<CatalogKind, TagGroup[]> = {
  customer: CUSTOMER_TAG_CATALOG.map((g) => ({ group: g.group, tags: [...g.tags] })),
  store: STORE_TAG_CATALOG.map((g) => ({ group: g.group, tags: [...g.tags] })),
  product: PRODUCT_TAG_CATALOG.map((g) => ({ group: g.group, tags: [...g.tags] })),
  campaign: CAMPAIGN_TAG_CATALOG.map((g) => ({ group: g.group, tags: [...g.tags] })),
};

type Ctx = {
  catalogs: Record<CatalogKind, TagGroup[]>;
  getCatalog: (kind: CatalogKind) => TagGroup[];
  addGroup: (kind: CatalogKind, group: string) => string | null;
  renameGroup: (kind: CatalogKind, from: string, to: string) => string | null;
  deleteGroup: (kind: CatalogKind, group: string) => string | null;
  addTag: (kind: CatalogKind, group: string, tag: string) => string | null;
  renameTag: (
    kind: CatalogKind,
    from: TagItem,
    to: TagItem,
  ) => string | null;
  deleteTag: (kind: CatalogKind, item: TagItem) => void;
};

const TagCatalogContext = createContext<Ctx | null>(null);

const cloneCatalogs = (src: Record<CatalogKind, TagGroup[]>) => {
  const next = {} as Record<CatalogKind, TagGroup[]>;
  (Object.keys(src) as CatalogKind[]).forEach((k) => {
    next[k] = src[k].map((g) => ({ group: g.group, tags: [...g.tags] }));
  });
  return next;
};

export const TagCatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalogs, setCatalogs] = useState(() => cloneCatalogs(INITIAL));

  const getCatalog = useCallback((kind: CatalogKind) => catalogs[kind], [catalogs]);

  const addGroup = useCallback((kind: CatalogKind, group: string) => {
    const name = group.trim();
    if (!name) return '请输入分类名';
    let err: string | null = null;
    setCatalogs((prev) => {
      if (prev[kind].some((g) => g.group === name)) {
        err = '分类已存在';
        return prev;
      }
      return { ...prev, [kind]: [...prev[kind], { group: name, tags: [] }] };
    });
    return err;
  }, []);

  const renameGroup = useCallback((kind: CatalogKind, from: string, to: string) => {
    const nextName = to.trim();
    if (!from) return '请选择分类';
    if (!nextName) return '请输入分类名';
    let err: string | null = null;
    setCatalogs((prev) => {
      if (!prev[kind].some((g) => g.group === from)) {
        err = '分类不存在';
        return prev;
      }
      if (nextName !== from && prev[kind].some((g) => g.group === nextName)) {
        err = '分类已存在';
        return prev;
      }
      return {
        ...prev,
        [kind]: prev[kind].map((g) => (g.group === from ? { ...g, group: nextName } : g)),
      };
    });
    return err;
  }, []);

  const deleteGroup = useCallback((kind: CatalogKind, group: string) => {
    const name = group.trim();
    if (!name) return '请选择分类';
    let err: string | null = null;
    setCatalogs((prev) => {
      const hit = prev[kind].find((g) => g.group === name);
      if (!hit) {
        err = '分类不存在';
        return prev;
      }
      if ((hit.tags || []).length > 0) {
        err = '分类下还有标签，请先删除或移走标签';
        return prev;
      }
      if (prev[kind].length <= 1) {
        err = '至少保留一个分类';
        return prev;
      }
      return { ...prev, [kind]: prev[kind].filter((g) => g.group !== name) };
    });
    return err;
  }, []);

  const addTag = useCallback((kind: CatalogKind, group: string, tag: string) => {
    const t = tag.trim();
    if (!t) return '请输入标签名';
    let err: string | null = null;
    setCatalogs((prev) => {
      const exists = prev[kind].some((g) => g.tags.includes(t));
      if (exists) {
        err = '同库下标签名不能重复';
        return prev;
      }
      const list = prev[kind].map((g) =>
        g.group === group ? { ...g, tags: [...g.tags, t] } : g,
      );
      if (!list.some((g) => g.group === group)) {
        err = '分组不存在';
        return prev;
      }
      return { ...prev, [kind]: list };
    });
    return err;
  }, []);

  const renameTag = useCallback((kind: CatalogKind, from: TagItem, to: TagItem) => {
    const newTag = to.tag.trim();
    if (!newTag) return '请输入标签名';
    let err: string | null = null;
    setCatalogs((prev) => {
      const conflict = prev[kind].some(
        (g) => g.tags.includes(newTag) && !(g.group === from.group && newTag === from.tag),
      );
      if (conflict) {
        err = '同库下标签名不能重复';
        return prev;
      }
      // remove from old group
      let list = prev[kind].map((g) => ({
        ...g,
        tags: g.tags.filter((x) => !(g.group === from.group && x === from.tag)),
      }));
      // ensure target group
      if (!list.some((g) => g.group === to.group)) {
        list = [...list, { group: to.group, tags: [] }];
      }
      list = list.map((g) =>
        g.group === to.group && !g.tags.includes(newTag)
          ? { ...g, tags: [...g.tags, newTag] }
          : g,
      );
      return { ...prev, [kind]: list };
    });
    return err;
  }, []);

  const deleteTag = useCallback((kind: CatalogKind, item: TagItem) => {
    setCatalogs((prev) => ({
      ...prev,
      [kind]: prev[kind].map((g) =>
        g.group === item.group
          ? { ...g, tags: g.tags.filter((t) => t !== item.tag) }
          : g,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      catalogs,
      getCatalog,
      addGroup,
      renameGroup,
      deleteGroup,
      addTag,
      renameTag,
      deleteTag,
    }),
    [catalogs, getCatalog, addGroup, renameGroup, deleteGroup, addTag, renameTag, deleteTag],
  );

  return <TagCatalogContext.Provider value={value}>{children}</TagCatalogContext.Provider>;
};

export const useTagCatalog = () => {
  const ctx = useContext(TagCatalogContext);
  if (!ctx) throw new Error('useTagCatalog must be used within TagCatalogProvider');
  return ctx;
};

/** 统计 TagItem 在 overrides map 中的占用数（演示） */
export const countTagUsage = (
  overrides: Record<string, TagItem[]>,
  item: TagItem,
  seedForId?: (id: string) => TagItem[],
) => {
  const key = tagKey(item);
  const ids = new Set<string>([
    ...Object.keys(overrides),
    ...(seedForId ? [] : []),
  ]);
  // also walk overrides only; callers should pass full id list via seedForId map
  let count = 0;
  const check = (tags: TagItem[]) => tags.some((t) => tagKey(t) === key);
  Object.keys(overrides).forEach((id) => {
    if (check(overrides[id])) count += 1;
  });
  return count;
};

export const remapTagInOverrides = (
  overrides: Record<string, TagItem[]>,
  from: TagItem,
  to: TagItem,
): Record<string, TagItem[]> => {
  const fromKey = tagKey(from);
  const next: Record<string, TagItem[]> = {};
  Object.entries(overrides).forEach(([id, tags]) => {
    next[id] = tags.map((t) => (tagKey(t) === fromKey ? { ...to } : t));
  });
  return next;
};

export const removeTagFromOverrides = (
  overrides: Record<string, TagItem[]>,
  item: TagItem,
): Record<string, TagItem[]> => {
  const key = tagKey(item);
  const next: Record<string, TagItem[]> = {};
  Object.entries(overrides).forEach(([id, tags]) => {
    next[id] = tags.filter((t) => tagKey(t) !== key);
  });
  return next;
};
