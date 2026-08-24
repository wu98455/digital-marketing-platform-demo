/** 标签库分组（目录） */
export type TagGroup = {
  group: string;
  tags: string[];
};

/** 已选/已打的一条标签 */
export type TagItem = {
  group: string;
  tag: string;
};

export const tagKey = (item: TagItem) => `${item.group}::${item.tag}`;

export const flattenGroups = (groups?: TagGroup[]): TagItem[] => {
  const list: TagItem[] = [];
  (groups || []).forEach((g) => {
    (g.tags || []).forEach((tag) => {
      if (tag) list.push({ group: g.group, tag });
    });
  });
  return list;
};

export const toGroups = (items: TagItem[], catalog?: TagGroup[]): TagGroup[] => {
  const map = new Map<string, string[]>();
  items.forEach((x) => {
    const list = map.get(x.group) || [];
    if (!list.includes(x.tag)) list.push(x.tag);
    map.set(x.group, list);
  });
  const groupNames = Array.from(
    new Set([...(catalog || []).map((g) => g.group), ...map.keys()]),
  );
  return groupNames.map((group) => ({
    group,
    tags: map.get(group) || [],
  }));
};

/** 逗号串 ↔ 扁平标签（无分组时用默认组名） */
export const parseFlatTags = (raw?: string, defaultGroup = '默认') =>
  (raw || '')
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter((s) => s && s !== '--')
    .map((tag) => ({ group: defaultGroup, tag }));

export const formatFlatTags = (items: TagItem[]) =>
  items.map((x) => x.tag).join(',') || '--';

/** 分组配色（Ant Tag color） */
export const GROUP_TAG_COLORS = [
  'blue',
  'green',
  'orange',
  'purple',
  'cyan',
  'geekblue',
  'magenta',
  'gold',
] as const;

export const colorForGroup = (group: string, catalog?: TagGroup[]) => {
  const names = (catalog || []).map((g) => g.group);
  const idx = names.indexOf(group);
  const i = idx >= 0 ? idx : Math.abs(hashCode(group)) % GROUP_TAG_COLORS.length;
  return GROUP_TAG_COLORS[i % GROUP_TAG_COLORS.length];
};

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return h;
};
