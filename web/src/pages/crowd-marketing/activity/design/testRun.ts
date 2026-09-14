/** 画布「测试执行」：静态校验 + 干跑人数预估（不改活动状态、不真实触达） */

export type CanvasNodeLike = {
  id: string;
  name: string;
  type: string;
  config?: string;
  meta?: Record<string, string>;
};

export type CanvasEdgeLike = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type TestIssue = { level: 'error' | 'warning'; nodeId?: string; text: string };

export type TestFunnelStep = {
  nodeId: string;
  name: string;
  count: number;
  note?: string;
};

export type TestRunResult = {
  ok: boolean;
  errors: TestIssue[];
  warnings: TestIssue[];
  steps: TestFunnelStep[];
  summary: string;
};

function selectedTagKeys(meta?: Record<string, string>): string[] {
  if (meta?.tagKeys) {
    return meta.tagKeys
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (meta?.tagKey) return [meta.tagKey];
  return [];
}

function isJudge(n: CanvasNodeLike) {
  return n.type === '判断' || n.name === '是否购买';
}

function isAudience(n: CanvasNodeLike) {
  return n.type === '人群' || n.name === '选人';
}

function isCoupon(n: CanvasNodeLike) {
  return n.name === '小程序发券' || n.name === '发优惠券';
}

function isReach(n: CanvasNodeLike) {
  return (
    n.name === '发短信' ||
    n.name === '企微发消息' ||
    isCoupon(n) ||
    n.name === '加积分'
  );
}

function validateNodeConfig(node: CanvasNodeLike): TestIssue[] {
  const issues: TestIssue[] = [];
  const push = (level: 'error' | 'warning', text: string) =>
    issues.push({ level, nodeId: node.id, text: `「${node.name}」${text}` });

  if (isAudience(node)) {
    const source = node.meta?.audienceSource || 'crowd';
    if (source === 'crowd' && !node.meta?.crowdId) {
      push('error', '未选择目标人群');
    }
    if (source === 'tag' && !selectedTagKeys(node.meta).length) {
      push('error', '未选择人群标签');
    }
  }

  if (node.name === '发短信') {
    if (!String(node.meta?.smsContent || '').trim()) {
      push('error', '未填写短信模板内容');
    }
  }

  if (node.name === '企微发消息') {
    const msgType = node.meta?.wecomMsgType || 'text';
    if (msgType === 'miniprogram') {
      if (!String(node.meta?.wecomMpTitle || '').trim()) {
        push('error', '未填写小程序卡片标题');
      }
      if (!String(node.meta?.wecomMpPath || '').trim()) {
        push('error', '未填写小程序路径');
      }
    } else if (!String(node.meta?.wecomContent || '').trim()) {
      push('error', '未填写企微消息内容');
    }
  }

  if (isCoupon(node)) {
    if (!node.meta?.couponId) push('error', '未选择优惠券');
    const n = Number(node.meta?.couponCount || '1');
    if (!Number.isFinite(n) || n < 1) push('error', '发券张数需至少为 1');
  }

  if (node.name === '加积分') {
    if (!node.meta?.pointsRewardType) push('error', '未选择积分类型');
    const n = Number(node.meta?.points);
    if (!Number.isFinite(n) || n < 1) push('error', '赠送数量需至少为 1');
  }

  if (node.name === '随机抽取') {
    const mode = node.meta?.sampleMode || 'count';
    if (mode === 'ratio') {
      const r = Number(node.meta?.sampleRatio);
      if (!Number.isFinite(r) || r <= 0 || r > 100) {
        push('error', '抽取比例需在 1～100');
      }
    } else {
      const n = Number(node.meta?.sampleSize);
      if (!Number.isFinite(n) || n < 1) push('error', '抽取人数需至少为 1');
    }
  }

  if (node.name === '排重') {
    const oneIdOn = node.meta?.oneIdDedupe !== 'false';
    const excludeOn = node.meta?.excludeEnabled === 'true';
    if (!oneIdOn && !excludeOn) {
      push('error', '请至少开启「按 OneID 去重」或「排除已触达」');
    }
    if (excludeOn) {
      const scope = node.meta?.excludeScope || 'activity';
      if (scope === 'activity') {
        const ids = (node.meta?.excludeActivityIds || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!ids.length) push('error', '排除已触达时需选择已结束活动');
      }
      if (scope === 'days') {
        const d = Number(node.meta?.excludeDays);
        if (!Number.isFinite(d) || d < 1) push('error', '排除天数需至少为 1');
      }
    }
  }

  if (isJudge(node)) {
    const scope = node.meta?.purchaseScope || 'any';
    if (scope === 'category') {
      const cats = (node.meta?.purchaseCategories || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!cats.length) push('error', '指定类目时需至少选一个类目');
    }
  }

  if (node.type === '等待') {
    const amount = Number(node.meta?.waitAmount ?? node.meta?.waitDays ?? '3');
    if (!Number.isFinite(amount) || amount < 0) {
      push('error', '等待时长无效');
    }
  }

  return issues;
}

function reachableFrom(
  startId: string,
  edges: CanvasEdgeLike[],
): Set<string> {
  const out = new Map<string, string[]>();
  edges.forEach((e) => {
    const list = out.get(e.source) || [];
    list.push(e.target);
    out.set(e.source, list);
  });
  const seen = new Set<string>();
  const q = [startId];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    (out.get(id) || []).forEach((t) => q.push(t));
  }
  return seen;
}

export function validateCanvasTest(
  nodes: CanvasNodeLike[],
  edges: CanvasEdgeLike[],
): { errors: TestIssue[]; warnings: TestIssue[] } {
  const errors: TestIssue[] = [];
  const warnings: TestIssue[] = [];
  const start = nodes.find((n) => n.type === '开始');
  const end = nodes.find((n) => n.type === '结束');
  const audience = nodes.find((n) => isAudience(n));

  if (!start) errors.push({ level: 'error', text: '缺少「开始」节点' });
  if (!end) errors.push({ level: 'error', text: '缺少「结束」节点' });
  if (!audience) errors.push({ level: 'error', text: '缺少「选人」节点' });

  if (start && end) {
    const reach = reachableFrom(start.id, edges);
    if (!reach.has(end.id)) {
      errors.push({ level: 'error', text: '从「开始」无法到达「结束」，请检查连线' });
    }
    nodes.forEach((n) => {
      if (n.id === start.id) return;
      if (!reach.has(n.id) && n.type !== '结束') {
        warnings.push({
          level: 'warning',
          nodeId: n.id,
          text: `「${n.name}」未接入从开始出发的主路径`,
        });
      }
    });
  }

  nodes.forEach((n) => {
    validateNodeConfig(n).forEach((issue) => {
      if (issue.level === 'error') errors.push(issue);
      else warnings.push(issue);
    });
  });

  nodes.filter(isJudge).forEach((judge) => {
    const outs = edges.filter((e) => e.source === judge.id);
    const labels = new Set(outs.map((e) => e.label).filter(Boolean));
    if (outs.length < 2) {
      warnings.push({
        level: 'warning',
        nodeId: judge.id,
        text: '「是否购买」建议配置「已购买 / 未购买」两条出边',
      });
    } else {
      if (!labels.has('已购买') || !labels.has('未购买')) {
        warnings.push({
          level: 'warning',
          nodeId: judge.id,
          text: '「是否购买」出边建议标注「已购买」与「未购买」',
        });
      }
    }
    const hasWaitUpstream = (() => {
      if (!start) return false;
      const reverse = new Map<string, string[]>();
      edges.forEach((e) => {
        const list = reverse.get(e.target) || [];
        list.push(e.source);
        reverse.set(e.target, list);
      });
      const seen = new Set<string>();
      const q = [judge.id];
      while (q.length) {
        const id = q.shift()!;
        if (seen.has(id)) continue;
        seen.add(id);
        if (nodes.find((n) => n.id === id)?.type === '等待') return true;
        (reverse.get(id) || []).forEach((s) => q.push(s));
      }
      return false;
    })();
    if (!hasWaitUpstream) {
      warnings.push({
        level: 'warning',
        nodeId: judge.id,
        text: '「是否购买」上游建议有「等待」，便于覆盖等待期内下单',
      });
    }
  });

  if (!nodes.some(isReach)) {
    warnings.push({ level: 'warning', text: '画布尚无触达节点（短信 / 企微 / 发券 / 加积分）' });
  }

  return { errors, warnings };
}

type CrowdOpt = { id: string; name: string; count: number };
type TagOpt = { key: string; count: number };

function seedAudienceCount(
  node: CanvasNodeLike | undefined,
  crowds: CrowdOpt[],
  tags: TagOpt[],
): { count: number; note: string } {
  if (!node) return { count: 0, note: '未选人' };
  const source = node.meta?.audienceSource || 'crowd';
  if (source === 'crowd') {
    const c = crowds.find((x) => x.id === node.meta?.crowdId);
    const count = c?.count ?? 50000;
    return {
      count,
      note: c ? `目标人群「${c.name}」` : '目标人群（演示默认规模）',
    };
  }
  const keys = selectedTagKeys(node.meta);
  if (!keys.length) return { count: 0, note: '未选标签' };
  const sum = keys.reduce((acc, k) => {
    const t = tags.find((x) => x.key === k);
    return acc + (t?.count ?? 8000);
  }, 0);
  // 并集演示：按约 0.72 折算重叠
  const count = Math.max(1, Math.round(sum * 0.72));
  return { count, note: `人群标签并集（${keys.length} 个）` };
}

/** BFS 干跑：按入边汇总人数；判断节点按演示比例拆分 */
export function simulateTestRun(
  nodes: CanvasNodeLike[],
  edges: CanvasEdgeLike[],
  crowds: CrowdOpt[],
  tags: TagOpt[],
): TestFunnelStep[] {
  const start = nodes.find((n) => n.type === '开始');
  if (!start) return [];

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outs = new Map<string, CanvasEdgeLike[]>();
  edges.forEach((e) => {
    const list = outs.get(e.source) || [];
    list.push(e);
    outs.set(e.source, list);
  });

  const audience = nodes.find((n) => isAudience(n));
  const seed = seedAudienceCount(audience, crowds, tags);
  const inflow = new Map<string, number>();
  /** 开始节点不计入人数；人数从选人节点起算 */
  inflow.set(start.id, 0);

  const order: string[] = [];
  const seen = new Set<string>();
  const q = [start.id];
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    (outs.get(id) || []).forEach((e) => q.push(e.target));
  }

  const steps: TestFunnelStep[] = [];

  order.forEach((id) => {
    const node = byId.get(id);
    if (!node) return;
    let count = Math.max(0, Math.round(inflow.get(id) || 0));
    let note: string | undefined;

    if (node.type === '开始') {
      count = 0;
      note = '旅程入口，人数从下游「选人」起算';
    } else if (isAudience(node)) {
      count = seed.count;
      note = seed.note;
      inflow.set(id, count);
    } else if (node.name === '排重') {
      const oneIdOn = node.meta?.oneIdDedupe !== 'false';
      const excludeOn = node.meta?.excludeEnabled === 'true';
      let next = count;
      if (oneIdOn) next = Math.round(next * 0.92);
      if (excludeOn) next = Math.round(next * 0.85);
      note = `演示折算后约 ${next.toLocaleString()} 人`;
      count = next;
    } else if (node.name === '随机抽取') {
      const mode = node.meta?.sampleMode || 'count';
      if (mode === 'ratio') {
        const r = Number(node.meta?.sampleRatio || 20);
        count = Math.min(count, Math.round((count * r) / 100));
        note = `按 ${r}% 抽取`;
      } else {
        const n = Number(node.meta?.sampleSize || 10000);
        count = Math.min(count, n);
        note = `上限 ${n.toLocaleString()} 人`;
      }
    } else if (node.type === '等待') {
      const amount = Number(node.meta?.waitAmount ?? node.meta?.waitDays ?? '3');
      const unit = node.meta?.waitUnit === 'hour' ? '小时' : '天';
      note =
        amount <= 0
          ? '测试模式：立即进入下一节点'
          : `测试模式：跳过真实等待（配置 ${amount} ${unit}）`;
    } else if (isJudge(node)) {
      note = '到达时判定；演示按 35% 已购买 / 65% 未购买拆分';
    } else if (isReach(node)) {
      note = '模拟将触达（不下发真实渠道）';
    } else if (node.type === '结束') {
      note = '测试结束（活动状态不变）';
    }

    steps.push({ nodeId: id, name: node.name, count, note });

    const edgeList = outs.get(id) || [];
    if (node.type === '开始') {
      // 开始不传人；下游选人自行注入母池规模
      edgeList.forEach((e) => {
        if (!inflow.has(e.target)) inflow.set(e.target, 0);
      });
    } else if (isJudge(node) && edgeList.length) {
      const bought = Math.round(count * 0.35);
      const notBought = Math.max(0, count - bought);
      edgeList.forEach((e) => {
        const add = e.label === '已购买' ? bought : e.label === '未购买' ? notBought : Math.round(count / edgeList.length);
        inflow.set(e.target, (inflow.get(e.target) || 0) + add);
      });
    } else {
      edgeList.forEach((e) => {
        inflow.set(e.target, (inflow.get(e.target) || 0) + count);
      });
    }
  });

  return steps;
}

/** 内容少用弹窗、多用抽屉：按条目数启发式 */
export function pickTestResultPresentation(result: TestRunResult): 'modal' | 'drawer' {
  const units = result.errors.length + result.warnings.length + result.steps.length;
  if (units > 5 || result.steps.length > 4) return 'drawer';
  return 'modal';
}

export function runCanvasTest(
  nodes: CanvasNodeLike[],
  edges: CanvasEdgeLike[],
  crowds: CrowdOpt[],
  tags: TagOpt[],
): TestRunResult {
  const { errors, warnings } = validateCanvasTest(nodes, edges);
  const ok = errors.length === 0;
  const steps = ok ? simulateTestRun(nodes, edges, crowds, tags) : [];
  let summary: string;
  if (!ok) {
    summary = `校验未通过：${errors.length} 项错误${warnings.length ? `，另有 ${warnings.length} 项提醒` : ''}。请先修复后再干跑。`;
  } else if (warnings.length) {
    summary = `校验通过（${warnings.length} 项提醒）。已按当前配置干跑预估人数，不改变活动状态、不真实触达。`;
  } else {
    summary = '校验通过。已按当前配置干跑预估人数，不改变活动状态、不真实触达。';
  }
  return { ok, errors, warnings, steps, summary };
}
