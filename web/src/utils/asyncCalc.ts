/** 异步计算（标签打标 / 人群圈选）演示状态 */

export type CalcStatus = 'calculating' | 'success' | 'failed';

export const CALC_DURATION_MS = 4000;

export const CALC_STATUS_TEXT: Record<CalcStatus, string> = {
  calculating: '计算中',
  success: '已完成',
  failed: '计算失败',
};

export type CalcFields = {
  calcStatus?: CalcStatus;
  calcStartedAt?: string;
  calcError?: string;
  /** 成功后是否已落打标结果，避免列表轮询重复写入 */
  calcApplied?: boolean;
};

export function calcStartedNow() {
  return new Date().toISOString();
}

export function beginCalculating(): CalcFields & { enabled: false } {
  return {
    calcStatus: 'calculating',
    calcStartedAt: calcStartedNow(),
    calcError: undefined,
    calcApplied: false,
    enabled: false,
  };
}

export function shouldFailCalcByName(name?: string) {
  return Boolean(name && name.includes('失败'));
}

export function resolveCalcFields<T extends CalcFields & { enabled?: boolean; name?: string }>(
  entity: T,
  onSuccess: (draft: T) => T,
): T {
  if (entity.calcStatus !== 'calculating' || !entity.calcStartedAt) {
    if (!entity.calcStatus) {
      return { ...entity, calcStatus: 'success', enabled: entity.enabled !== false };
    }
    return entity;
  }
  const started = Date.parse(entity.calcStartedAt);
  if (Number.isNaN(started) || Date.now() - started < CALC_DURATION_MS) {
    return entity;
  }
  if (shouldFailCalcByName(entity.name)) {
    return {
      ...entity,
      calcStatus: 'failed',
      calcError: '中台查询超时，请稍后重试',
      enabled: false,
      calcApplied: false,
    };
  }
  if (entity.calcApplied) {
    return {
      ...entity,
      calcStatus: 'success',
      calcError: undefined,
      enabled: true,
    };
  }
  const next = onSuccess({
    ...entity,
    calcStatus: 'success',
    calcError: undefined,
    enabled: true,
    calcApplied: true,
  });
  return next;
}

const RULES_LS = 'dm_tag_rules_calc_v3';
const CROWDS_LS = 'dm_crowds_calc_v1';

export function loadPersistedJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function savePersistedJson(key: string, value: unknown) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export const LS_TAG_RULES = RULES_LS;
export const LS_CROWDS = CROWDS_LS;
