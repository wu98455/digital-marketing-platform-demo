/**
 * 个人收藏 / 最近常用（按用户维度 localStorage）
 */

import { getDemoUsername } from './demoMock';

const favKey = (user: string) => `dmp-tag-fav:${user || 'anon'}`;
const recentKey = (user: string) => `dmp-tag-recent:${user || 'anon'}`;

export function tagIdentity(group: string, tag: string) {
  return `${group}::${tag}`;
}

export function getFavoriteTagKeys(username?: string): string[] {
  const user = username || getDemoUsername();
  try {
    return JSON.parse(localStorage.getItem(favKey(user)) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavoriteTag(group: string, tag: string, username?: string) {
  const user = username || getDemoUsername();
  const key = tagIdentity(group, tag);
  const set = new Set(getFavoriteTagKeys(user));
  if (set.has(key)) set.delete(key);
  else set.add(key);
  const next = Array.from(set);
  localStorage.setItem(favKey(user), JSON.stringify(next));
  return next;
}

export function isFavoriteTag(group: string, tag: string, username?: string) {
  return getFavoriteTagKeys(username).includes(tagIdentity(group, tag));
}

export function pushRecentTag(group: string, tag: string, username?: string) {
  const user = username || getDemoUsername();
  const key = tagIdentity(group, tag);
  const prev = getRecentTagKeys(user).filter((k) => k !== key);
  const next = [key, ...prev].slice(0, 30);
  localStorage.setItem(recentKey(user), JSON.stringify(next));
  return next;
}

export function getRecentTagKeys(username?: string): string[] {
  const user = username || getDemoUsername();
  try {
    return JSON.parse(localStorage.getItem(recentKey(user)) || '[]');
  } catch {
    return [];
  }
}

/** 标签改名/改分类后，同步收藏与最近常用中的 identity */
export function remapTagIdentity(
  from: { group: string; tag: string },
  to: { group: string; tag: string },
  username?: string,
) {
  const user = username || getDemoUsername();
  const fromKey = tagIdentity(from.group, from.tag);
  const toKey = tagIdentity(to.group, to.tag);
  if (fromKey === toKey) return;

  const fav = getFavoriteTagKeys(user).map((k) => (k === fromKey ? toKey : k));
  localStorage.setItem(favKey(user), JSON.stringify(Array.from(new Set(fav))));

  const recent = getRecentTagKeys(user)
    .map((k) => (k === fromKey ? toKey : k))
    .filter((k, i, arr) => arr.indexOf(k) === i);
  localStorage.setItem(recentKey(user), JSON.stringify(recent));
}
