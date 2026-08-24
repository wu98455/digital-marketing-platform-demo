/**
 * 分中心（营销平台）数据权限枚举与辅助方法
 */

export const MARKETING_CENTERS = [
  '长寿工惠',
  '山城工惠',
  '国企优品',
  '文旅惠',
] as const;

export type MarketingCenter = (typeof MARKETING_CENTERS)[number];

export const CENTER_OPTIONS = MARKETING_CENTERS.map((c) => ({
  label: c,
  value: c,
}));

/** 短信单价（元），演示成本估算 */
export const DEMO_SMS_UNIT_COST = 0.05;

export function normalizeCenters(input?: string[] | null): MarketingCenter[] {
  if (!input?.length) return [];
  const set = new Set(MARKETING_CENTERS as unknown as string[]);
  return input.filter((c): c is MarketingCenter => set.has(c));
}

export function centersIntersect(
  allowed: string[] | undefined,
  recordCenters: string[] | undefined,
): boolean {
  if (!allowed?.length) return false;
  if (!recordCenters?.length) return false;
  const set = new Set(allowed);
  return recordCenters.some((c) => set.has(c));
}

/** 列表单元格展示多分中心 */
export function formatCenters(centers?: string[] | null): string {
  if (!centers?.length) return '--';
  return centers.join('、');
}

/** 演示 OneID（模拟中台下发，非产品自研规则） */
export function mockOneId(seed: string | number, day = '20260812'): string {
  const n = String(seed).replace(/\D/g, '') || '0';
  const seq = String(Number(n) % 10000).padStart(4, '0');
  // 中台演示号段：无横杠
  return `OID${day}${seq}`;
}
