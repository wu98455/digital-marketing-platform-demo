import { history } from '@umijs/max';
import type { CatalogKind } from '@/components/Tagging';

export function goDataTagCreate(
  kind: CatalogKind,
  rows: Array<{ id: string; name?: string }>,
) {
  if (!rows.length) return;
  const ids = rows.map((r) => r.id).join(',');
  const labels = rows
    .map((r) => r.name || r.id)
    .join('|');
  history.push(`/tag-center/data-create/${kind}?ids=${encodeURIComponent(ids)}&labels=${encodeURIComponent(labels)}`);
}
