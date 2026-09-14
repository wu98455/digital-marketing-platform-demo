import type { Request, Response } from 'express';
import type { TagRule, TagRuleConditions } from '../src/utils/tagRuleTypes';
import {
  applyTagToMembers,
  emptyTagRuleConditions,
  estimateCount,
  memberTagStore,
  nowStr,
  pendingCrowds,
  samplesFromConditions,
  tagRules,
} from './tagStore';

function pageSlice<T>(list: T[], current = 1, pageSize = 10) {
  const c = Number(current) || 1;
  const p = Number(pageSize) || 10;
  const start = (c - 1) * p;
  return {
    data: list.slice(start, start + p),
    total: list.length,
    success: true,
    pageSize: p,
    current: c,
  };
}

export default {
  'GET /api/tag-center/person-tags': (_req: Request, res: Response) => {
    tagRules.forEach((r, idx) => {
      if (r.calcStatus !== 'calculating' || !r.calcStartedAt) return;
      const started = Date.parse(r.calcStartedAt);
      if (Number.isNaN(started) || Date.now() - started < 4000) return;
      if ((r.name || '').includes('失败') || (r.targetTag?.tag || '').includes('失败')) {
        tagRules[idx] = {
          ...r,
          calcStatus: 'failed',
          calcError: '中台查询超时，请稍后重试',
          enabled: false,
        };
        return;
      }
      if (!r.calcApplied) {
        applyTagToMembers(r.targetTag, `规则:${r.name}`, r.conditions);
      }
      tagRules[idx] = {
        ...r,
        calcStatus: 'success',
        calcError: undefined,
        calcApplied: true,
        enabled: true,
        lastRunAt: nowStr(),
        lastRunCount: estimateCount(r.conditions),
        updatedAt: nowStr(),
      };
    });
    // 由前端 catalog 为准时也可只返回覆盖人数；这里合并规则信息
    const map = new Map<
      string,
      {
        group: string;
        tag: string;
        count: number;
        ruleId?: string;
        ruleName?: string;
        description?: string;
        creator?: string;
        createdAt?: string;
        updatedAt?: string;
        lastRunAt?: string;
        calcStatus?: string;
        calcError?: string;
        enabled?: boolean;
      }
    >();
    tagRules.forEach((r) => {
      const key = `${r.targetTag.group}::${r.targetTag.tag}`;
      map.set(key, {
        group: r.targetTag.group,
        tag: r.targetTag.tag,
        count: r.lastRunCount || 0,
        ruleId: r.id,
        ruleName: r.name,
        description: r.description,
        creator: r.creator || 'demo',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        lastRunAt: r.lastRunAt,
        calcStatus: r.calcStatus || 'success',
        calcError: r.calcError,
        enabled: r.enabled,
      });
    });
    Object.entries(memberTagStore).forEach(([, list]) => {
      list.forEach((t) => {
        const key = `${t.group}::${t.tag}`;
        const prev = map.get(key) || {
          group: t.group,
          tag: t.tag,
          count: 0,
        };
        map.set(key, prev);
      });
    });
    const counts: Record<string, number> = {};
    Object.values(memberTagStore).forEach((list) => {
      list.forEach((t) => {
        const key = `${t.group}::${t.tag}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const data = Array.from(map.values()).map((row) => ({
      ...row,
      count:
        row.calcStatus === 'calculating' || row.calcStatus === 'failed'
          ? 0
          : counts[`${row.group}::${row.tag}`] || row.count || 0,
    }));
    Object.keys(counts).forEach((key) => {
      if (!map.has(key)) {
        const [group, tag] = key.split('::');
        data.push({ group, tag, count: counts[key], calcStatus: 'success', enabled: true });
      }
    });
    res.json({ success: true, data });
  },
  'GET /api/tag-center/rules': (req: Request, res: Response) => {
    const { current = 1, pageSize = 10, keyword, enabled } = req.query as Record<string, string>;
    let list = [...tagRules].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (keyword) {
      list = list.filter(
        (x) =>
          x.name.includes(keyword) ||
          x.targetTag.tag.includes(keyword) ||
          x.id.includes(keyword),
      );
    }
    if (enabled === 'true') list = list.filter((x) => x.enabled);
    if (enabled === 'false') list = list.filter((x) => !x.enabled);
    res.json(pageSlice(list, Number(current) || 1, Number(pageSize) || 10));
  },
  'GET /api/tag-center/rules/:id': (req: Request, res: Response) => {
    const item = tagRules.find((r) => r.id === req.params.id);
    if (!item) {
      res.json({ success: false, errorMessage: '规则不存在' });
      return;
    }
    res.json({ success: true, data: item });
  },
  'POST /api/tag-center/rules': (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<TagRule> & { startCalc?: boolean };
    const targetTag = body.targetTag;
    const autoName = targetTag?.tag ? `${targetTag.tag}打标规则` : '';
    const name = String(body.name || autoName || '').trim();
    if (!name) {
      res.json({ success: false, errorMessage: '请填写规则名称' });
      return;
    }
    if (!targetTag?.group || !targetTag?.tag) {
      res.json({ success: false, errorMessage: '请选择目标标签' });
      return;
    }
    const startCalc = body.startCalc !== false;
    const item: TagRule = {
      id: `RULE${Date.now() % 100000}`,
      name,
      targetTag,
      description: body.description ? String(body.description) : undefined,
      conditions: body.conditions || emptyTagRuleConditions(),
      centers: (body as any).centers,
      enabled: startCalc ? false : body.enabled !== false,
      creator: body.creator || 'demo',
      createdAt: nowStr(),
      updatedAt: nowStr(),
      lastRunCount: 0,
      calcStatus: startCalc ? 'calculating' : 'success',
      calcStartedAt: startCalc ? new Date().toISOString() : undefined,
      calcApplied: !startCalc,
    };
    tagRules.unshift(item);
    res.json({ success: true, data: item });
  },
  'PUT /api/tag-center/rules/:id': (req: Request, res: Response) => {
    const idx = tagRules.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      res.json({ success: false, errorMessage: '规则不存在' });
      return;
    }
    const body = (req.body || {}) as Partial<TagRule> & { startCalc?: boolean };
    const startCalc = Boolean(body.startCalc);
    tagRules[idx] = {
      ...tagRules[idx],
      ...body,
      id: tagRules[idx].id,
      targetTag: body.targetTag || tagRules[idx].targetTag,
      conditions: body.conditions ?? tagRules[idx].conditions,
      updatedAt: nowStr(),
      ...(startCalc
        ? {
            calcStatus: 'calculating' as const,
            calcStartedAt: new Date().toISOString(),
            calcError: undefined,
            calcApplied: false,
            enabled: false,
            lastRunCount: 0,
          }
        : {}),
    };
    res.json({ success: true, data: tagRules[idx] });
  },
  'DELETE /api/tag-center/rules/:id': (req: Request, res: Response) => {
    const idx = tagRules.findIndex((r) => r.id === req.params.id);
    if (idx >= 0) tagRules.splice(idx, 1);
    res.json({ success: true });
  },
  'POST /api/tag-center/rules/preview': (req: Request, res: Response) => {
    const conditions =
      ((req.body || {}) as { conditions?: TagRuleConditions }).conditions ||
      emptyTagRuleConditions();
    const count = estimateCount(conditions);
    res.json({
      success: true,
      data: { count, samples: samplesFromConditions(conditions) },
    });
  },
  'POST /api/tag-center/rules/apply': (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      targetTag?: { group: string; tag: string };
      conditions?: TagRuleConditions;
      source?: string;
    };
    if (!body.targetTag?.group || !body.targetTag?.tag) {
      res.json({ success: false, errorMessage: '请选择目标标签' });
      return;
    }
    const result = applyTagToMembers(
      body.targetTag,
      body.source || '一次性打标',
      body.conditions || emptyTagRuleConditions(),
    );
    res.json({ success: true, data: result });
  },
  'POST /api/tag-center/rules/:id/run': (req: Request, res: Response) => {
    const idx = tagRules.findIndex((r) => r.id === req.params.id);
    if (idx < 0) {
      res.json({ success: false, errorMessage: '规则不存在' });
      return;
    }
    const rule = tagRules[idx];
    tagRules[idx] = {
      ...rule,
      calcStatus: 'calculating',
      calcStartedAt: new Date().toISOString(),
      calcError: undefined,
      calcApplied: false,
      enabled: false,
      lastRunCount: 0,
      updatedAt: nowStr(),
    };
    res.json({ success: true, data: { started: true, rule: tagRules[idx] } });
  },
  'POST /api/tag-center/tags/create-crowd': (req: Request, res: Response) => {
    const body = (req.body || {}) as {
      group?: string;
      tag?: string;
      name?: string;
      ruleId?: string;
    };
    const group = body.group || '';
    const tag = body.tag || '';
    let count = 0;
    Object.values(memberTagStore).forEach((list) => {
      if (list.some((t) => t.group === group && t.tag === tag)) count += 1;
    });
    if (!count) count = estimateCount(emptyTagRuleConditions());
    const crowd = {
      id: String(240000 + (Date.now() % 10000)),
      name: body.name || `标签「${tag}」人群`,
      count,
      type: '静态人群',
      creator: 'demo',
      source: body.ruleId ? '打标规则' : '人群标签',
      createdAt: nowStr(),
      updatedAt: nowStr(),
      syncStatus: '未同步',
      catalog: '文旅人群',
      canDelete: true,
      canCopy: true,
    };
    pendingCrowds.unshift(crowd);
    res.json({ success: true, data: crowd });
  },
  'GET /api/tag-center/member-tags/:id': (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    res.json({ success: true, data: memberTagStore[id] || [] });
  },
};
