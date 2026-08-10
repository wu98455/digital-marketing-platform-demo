/**
 * 系统管理演示数据：用户 / 角色 / 可编辑菜单树 / 操作日志
 * 浏览器端持久化到 localStorage；Umi mock（Node）仅用内存。
 */

export type RoleId = string;

export type MenuAccessKey = string;

export type OpPermission =
  | 'tag.write'
  | 'crowd.write'
  | 'activity.write'
  | 'activity.approve'
  | 'activity.execute'
  | 'system.manage';

export type SystemUser = {
  id: string;
  username: string;
  name: string;
  password: string;
  status: '启用' | '停用';
  roleId: RoleId;
  /** 可审批「我创建的活动」的账号（username） */
  approverIds: string[];
  allowSelfApprove: boolean;
  lastLoginAt?: string;
};

export type SystemRole = {
  id: RoleId;
  name: string;
  description: string;
  menus: MenuAccessKey[];
  operations: OpPermission[];
};

export type MenuTreeNode = {
  key: string;
  path: string;
  name: string;
  icon?: string;
  hideInMenu?: boolean;
  order?: number;
  /** 系统内置路由节点（路径只读） */
  builtin?: boolean;
  children?: MenuTreeNode[];
};

export type AuditLog = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
};

export type OrgNodeType = '组织' | '部门';

export type OrgTreeNode = {
  key: string;
  title: string;
  type: OrgNodeType;
  children?: OrgTreeNode[];
};

export type OrgPerson = {
  id: string;
  orgKey: string;
  name: string;
  phone: string;
  role: string;
  status: '在职' | '离职';
};

const USERS_KEY = 'dmp-system-users';
const ROLES_KEY = 'dmp-system-roles';
const MENU_TREE_KEY = 'dmp-system-menu-tree-v4';
const AUDIT_KEY = 'dmp-system-audit';
const ORG_TREE_KEY = 'dmp-system-org-tree-v1';
const ORG_PERSONS_KEY = 'dmp-system-org-persons-v1';

const ALL_MENUS: MenuAccessKey[] = [
  'welcome',
  'tag-center',
  'crowd',
  'crowd-marketing',
  'marketing-activity',
  'activity-template',
  'node-record',
  'system',
  'system-users',
  'system-roles',
  'system-menus',
  'system-audit',
  'system-org',
  'tag-center-list',
  'tag-center-customer',
  'tag-center-store',
  'tag-center-product',
  'tag-center-campaign',
];

export const DEFAULT_ROLES: SystemRole[] = [
  {
    id: 'admin',
    name: '系统管理员',
    description: '账号、角色、菜单与全业务可配',
    menus: [...ALL_MENUS],
    operations: [
      'tag.write',
      'crowd.write',
      'activity.write',
      'activity.approve',
      'activity.execute',
      'system.manage',
    ],
  },
  {
    id: 'tagger',
    name: '打标与人群运营',
    description: '人群标签与目标人群读写',
    menus: ['welcome', 'tag-center', 'crowd'],
    operations: ['tag.write', 'crowd.write'],
  },
  {
    id: 'marketer',
    name: '营销活动运营',
    description: '营销管理读写；标签与人群只读选用',
    menus: [
      'welcome',
      'tag-center',
      'crowd',
      'crowd-marketing',
      'marketing-activity',
      'activity-template',
      'node-record',
    ],
    operations: ['activity.write', 'activity.approve', 'activity.execute'],
  },
];

export const DEFAULT_USERS: SystemUser[] = [
  {
    id: 'u-demo',
    username: 'demo',
    name: '演示管理员',
    password: '123456',
    status: '启用',
    roleId: 'admin',
    approverIds: ['WangSiyi', 'JiangYajuan', 'marketer'],
    allowSelfApprove: true,
    lastLoginAt: '2026-08-10 10:00:00',
  },
  {
    id: 'u-admin',
    username: 'admin',
    name: '系统管理员',
    password: 'ant.design',
    status: '启用',
    roleId: 'admin',
    approverIds: ['demo', 'WangSiyi'],
    allowSelfApprove: true,
  },
  {
    id: 'u-tagger',
    username: 'tagger',
    name: '打标运营',
    password: '123456',
    status: '启用',
    roleId: 'tagger',
    approverIds: [],
    allowSelfApprove: false,
  },
  {
    id: 'u-marketer',
    username: 'marketer',
    name: '营销运营',
    password: '123456',
    status: '启用',
    roleId: 'marketer',
    approverIds: ['demo', 'WangSiyi', 'JiangYajuan'],
    allowSelfApprove: false,
    lastLoginAt: '2026-08-09 16:20:00',
  },
  {
    id: 'u-wang',
    username: 'WangSiyi',
    name: '王思怡',
    password: '123456',
    status: '启用',
    roleId: 'marketer',
    approverIds: ['demo', 'JiangYajuan'],
    allowSelfApprove: true,
  },
  {
    id: 'u-jiang',
    username: 'JiangYajuan',
    name: '蒋雅娟',
    password: '123456',
    status: '启用',
    roleId: 'marketer',
    approverIds: ['demo', 'WangSiyi'],
    allowSelfApprove: false,
  },
];

export const DEFAULT_MENU_TREE: MenuTreeNode[] = [
  { key: 'welcome', path: '/welcome', name: '欢迎', icon: 'HomeOutlined', builtin: true, order: 0 },
  {
    key: 'tag-center',
    path: '/tag-center',
    name: '数据打标',
    icon: 'TagsOutlined',
    builtin: true,
    order: 1,
    children: [
      {
        key: 'tag-center-list',
        path: '/tag-center/list',
        name: '人群标签',
        builtin: true,
        order: 0,
      },
      {
        key: 'tag-center-customer',
        path: '/tag-center/customer',
        name: '客户',
        builtin: true,
        order: 1,
      },
      {
        key: 'tag-center-store',
        path: '/tag-center/store',
        name: '店铺',
        builtin: true,
        order: 2,
      },
      {
        key: 'tag-center-product',
        path: '/tag-center/product',
        name: '商品',
        builtin: true,
        order: 3,
      },
      {
        key: 'tag-center-campaign',
        path: '/tag-center/campaign',
        name: '专题活动',
        builtin: true,
        order: 4,
      },
    ],
  },
  { key: 'crowd', path: '/crowd', name: '目标人群', icon: 'UsergroupAddOutlined', builtin: true, order: 2 },
  {
    key: 'crowd-marketing',
    path: '/crowd-marketing',
    name: '营销管理',
    icon: 'NotificationOutlined',
    builtin: true,
    order: 3,
    children: [
      {
        key: 'marketing-activity',
        path: '/crowd-marketing/activity',
        name: '营销活动',
        builtin: true,
        order: 0,
      },
      {
        key: 'activity-template',
        path: '/crowd-marketing/template',
        name: '营销活动模板',
        builtin: true,
        order: 1,
      },
      {
        key: 'node-record',
        path: '/crowd-marketing/node-record',
        name: '活动执行记录',
        builtin: true,
        order: 2,
      },
    ],
  },
  {
    key: 'system',
    path: '/system',
    name: '系统管理',
    icon: 'SettingOutlined',
    builtin: true,
    order: 4,
    children: [
      { key: 'system-users', path: '/system/users', name: '用户管理', builtin: true, order: 0 },
      { key: 'system-roles', path: '/system/roles', name: '角色权限', builtin: true, order: 1 },
      { key: 'system-menus', path: '/system/menus', name: '菜单管理', builtin: true, order: 2 },
      { key: 'system-audit', path: '/system/audit', name: '操作日志', builtin: true, order: 3 },
      { key: 'system-org', path: '/system/org', name: '组织架构', builtin: true, order: 4 },
    ],
  },
];

export const DEFAULT_ORG_TREE: OrgTreeNode[] = [
  {
    key: 'org-gy',
    title: '国企优学有限公司',
    type: '组织',
    children: [
      { key: 'dept-gy-rd', title: '研发部', type: '部门' },
      { key: 'dept-gy-mk', title: '市场部', type: '部门' },
      { key: 'dept-gy-hr', title: '人力资源部', type: '部门' },
    ],
  },
  {
    key: 'org-cq',
    title: '中共重庆市国有资产监督管理委员会',
    type: '组织',
    children: [
      { key: 'dept-cq-zh', title: '综合部', type: '部门' },
      { key: 'dept-cq-dw', title: '党委办公室', type: '部门' },
    ],
  },
  {
    key: 'org-wl',
    title: '重庆文旅集团',
    type: '组织',
    children: [
      { key: 'dept-wl-yx', title: '营销中心', type: '部门' },
      { key: 'dept-wl-kf', title: '客服中心', type: '部门' },
    ],
  },
];

export const DEFAULT_ORG_PERSONS: OrgPerson[] = [
  {
    id: 'p1',
    orgKey: 'dept-gy-rd',
    name: '张研发',
    phone: '138****1001',
    role: '工程师',
    status: '在职',
  },
  {
    id: 'p2',
    orgKey: 'dept-gy-rd',
    name: '李前端',
    phone: '138****1002',
    role: '前端开发',
    status: '在职',
  },
  {
    id: 'p3',
    orgKey: 'dept-gy-mk',
    name: '王市场',
    phone: '138****1003',
    role: '运营专员',
    status: '在职',
  },
  {
    id: 'p4',
    orgKey: 'dept-cq-zh',
    name: '赵综合',
    phone: '138****2001',
    role: '行政',
    status: '在职',
  },
  {
    id: 'p5',
    orgKey: 'dept-wl-yx',
    name: '钱营销',
    phone: '138****3001',
    role: '营销经理',
    status: '在职',
  },
];

function buildSeedAuditLogs(): AuditLog[] {
  const actions: Array<{ actor: string; action: string; detail: string; dayOffset: number; hour: number }> = [
    { actor: 'demo', action: '登录', detail: '演示管理员登录', dayOffset: 0, hour: 9 },
    { actor: 'demo', action: '编辑用户', detail: 'marketer · 更新审批人', dayOffset: 0, hour: 9 },
    { actor: 'demo', action: '新建角色', detail: '活动审核专员', dayOffset: 0, hour: 10 },
    { actor: 'demo', action: '编辑角色', detail: '营销活动运营 · 菜单权限', dayOffset: 0, hour: 10 },
    { actor: 'demo', action: '更新菜单', detail: '将「目标人群」改名为「人群包」', dayOffset: 0, hour: 11 },
    { actor: 'marketer', action: '登录', detail: '营销运营登录', dayOffset: 0, hour: 11 },
    { actor: 'marketer', action: '创建活动', detail: '文旅新客召回-演示', dayOffset: 0, hour: 12 },
    { actor: 'WangSiyi', action: '审批通过', detail: '文旅新客召回-演示', dayOffset: 0, hour: 14 },
    { actor: 'marketer', action: '正式执行', detail: '文旅新客召回-演示', dayOffset: 0, hour: 15 },
    { actor: 'tagger', action: '登录', detail: '打标运营登录', dayOffset: 1, hour: 9 },
    { actor: 'tagger', action: '重新打标', detail: '高价值会员', dayOffset: 1, hour: 10 },
    { actor: 'tagger', action: '新建标签规则', detail: '近30天下单会员', dayOffset: 1, hour: 11 },
    { actor: 'demo', action: '新建用户', detail: 'ops01', dayOffset: 1, hour: 14 },
    { actor: 'demo', action: '重置密码', detail: 'ops01', dayOffset: 1, hour: 14 },
    { actor: 'JiangYajuan', action: '登录', detail: '', dayOffset: 1, hour: 16 },
    { actor: 'JiangYajuan', action: '审批驳回', detail: '会员日促销-草稿', dayOffset: 1, hour: 16 },
    { actor: 'demo', action: '新增菜单', detail: '帮助中心（外链）', dayOffset: 2, hour: 9 },
    { actor: 'demo', action: '删除菜单', detail: '帮助中心（外链）', dayOffset: 2, hour: 10 },
    { actor: 'demo', action: '重置菜单默认', detail: '', dayOffset: 2, hour: 10 },
    { actor: 'admin', action: '登录', detail: '系统管理员登录', dayOffset: 2, hour: 11 },
    { actor: 'marketer', action: '创建活动', detail: '沉默客唤醒-周期', dayOffset: 2, hour: 13 },
    { actor: 'demo', action: '审批通过', detail: '沉默客唤醒-周期', dayOffset: 2, hour: 15 },
    { actor: 'marketer', action: '正式执行', detail: '沉默客唤醒-周期', dayOffset: 2, hour: 16 },
    { actor: 'tagger', action: '新建人群', detail: '暑期亲子游意向', dayOffset: 3, hour: 10 },
    { actor: 'demo', action: '编辑用户', detail: 'WangSiyi · 允许自审', dayOffset: 3, hour: 11 },
    { actor: 'demo', action: '登录', detail: '演示管理员登录', dayOffset: 3, hour: 18 },
    { actor: 'WangSiyi', action: '审批通过', detail: '节日关怀触达-2', dayOffset: 4, hour: 9 },
    { actor: 'demo', action: '编辑角色', detail: '打标与人群运营', dayOffset: 4, hour: 14 },
  ];

  const base = new Date();
  base.setHours(0, 0, 0, 0);

  return actions.map((a, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() - a.dayOffset);
    d.setHours(a.hour, (i * 7) % 60, 0, 0);
    return {
      id: `seed-log-${i + 1}`,
      at: d.toISOString().slice(0, 19).replace('T', ' '),
      actor: a.actor,
      action: a.action,
      detail: a.detail || undefined,
    };
  }).sort((x, y) => (x.at < y.at ? 1 : -1));
}

const canUseStorage = () => typeof localStorage !== 'undefined';

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

let usersMem: SystemUser[] | null = null;
let rolesMem: SystemRole[] | null = null;
let menuTreeMem: MenuTreeNode[] | null = null;
let auditMem: AuditLog[] | null = null;
let orgTreeMem: OrgTreeNode[] | null = null;
let orgPersonMem: OrgPerson[] | null = null;

export function cloneTree(nodes: MenuTreeNode[]): MenuTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children?.length ? cloneTree(n.children) : undefined,
  }));
}

/** 去掉与父级同 path / 同名的异常子节点（避免侧栏出现重复「系统管理」） */
export function sanitizeMenuTree(nodes: MenuTreeNode[], parent?: MenuTreeNode): MenuTreeNode[] {
  const parentPath = parent?.path?.replace(/\/$/, '') || '';
  return nodes
    .filter((n) => {
      if (!parent) return true;
      const path = (n.path || '').replace(/\/$/, '');
      if (n.key === parent.key) return false;
      if (path && parentPath && path === parentPath) return false;
      if (n.name === parent.name && (!path || path === parentPath)) return false;
      return true;
    })
    .map((n) => ({
      ...n,
      children: n.children?.length ? sanitizeMenuTree(n.children, n) : undefined,
    }));
}

function markBuiltin(nodes: MenuTreeNode[]): MenuTreeNode[] {
  return nodes.map((n, idx) => ({
    ...n,
    builtin: n.builtin ?? true,
    order: n.order ?? idx,
    children: n.children ? markBuiltin(n.children) : undefined,
  }));
}

export function getUsers(): SystemUser[] {
  if (!usersMem) {
    usersMem = readJson(USERS_KEY, DEFAULT_USERS.map((u) => ({ ...u })));
  }
  return usersMem;
}

export function saveUsers(list: SystemUser[]) {
  usersMem = list;
  writeJson(USERS_KEY, list);
}

export function getRoles(): SystemRole[] {
  if (!rolesMem) {
    rolesMem = readJson(
      ROLES_KEY,
      DEFAULT_ROLES.map((r) => ({ ...r, menus: [...r.menus], operations: [...r.operations] })),
    );
  }
  return rolesMem;
}

export function saveRoles(list: SystemRole[]) {
  rolesMem = list;
  writeJson(ROLES_KEY, list);
}

export function countUsersByRole(roleId: string) {
  return getUsers().filter((u) => u.roleId === roleId).length;
}

export function getMenuTree(): MenuTreeNode[] {
  if (!menuTreeMem) {
    const stored = readJson<MenuTreeNode[] | null>(MENU_TREE_KEY, null);
    menuTreeMem = stored?.length
      ? sanitizeMenuTree(cloneTree(stored))
      : markBuiltin(cloneTree(DEFAULT_MENU_TREE));
  }
  return menuTreeMem;
}

export function saveMenuTree(list: MenuTreeNode[]) {
  menuTreeMem = sanitizeMenuTree(list);
  writeJson(MENU_TREE_KEY, menuTreeMem);
}

export function resetMenusToDefault() {
  saveMenuTree(markBuiltin(cloneTree(DEFAULT_MENU_TREE)));
}

export function cloneOrgTree(nodes: OrgTreeNode[]): OrgTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children?.length ? cloneOrgTree(n.children) : undefined,
  }));
}

export function getOrgTree(): OrgTreeNode[] {
  if (!orgTreeMem) {
    orgTreeMem = readJson(ORG_TREE_KEY, cloneOrgTree(DEFAULT_ORG_TREE));
  }
  return orgTreeMem;
}

export function saveOrgTree(list: OrgTreeNode[]) {
  orgTreeMem = list;
  writeJson(ORG_TREE_KEY, list);
}

export function getOrgPersons(): OrgPerson[] {
  if (!orgPersonMem) {
    orgPersonMem = readJson(ORG_PERSONS_KEY, DEFAULT_ORG_PERSONS.map((p) => ({ ...p })));
  }
  return orgPersonMem;
}

export function saveOrgPersons(list: OrgPerson[]) {
  orgPersonMem = list;
  writeJson(ORG_PERSONS_KEY, list);
}

export function findOrgNode(
  nodes: OrgTreeNode[],
  key: string,
): { node: OrgTreeNode; parent: OrgTreeNode | null; siblings: OrgTreeNode[] } | null {
  for (const n of nodes) {
    if (n.key === key) return { node: n, parent: null, siblings: nodes };
    if (n.children?.length) {
      const hit = findOrgNode(n.children, key);
      if (hit) {
        if (!hit.parent) return { ...hit, parent: n, siblings: n.children || [] };
        return hit;
      }
    }
  }
  return null;
}

export function upsertOrgNode(input: {
  key?: string;
  parentKey?: string | null;
  title: string;
  type: OrgNodeType;
}): { success: boolean; errorMessage?: string; tree?: OrgTreeNode[] } {
  const tree = cloneOrgTree(getOrgTree());
  const title = input.title.trim();
  if (!title) return { success: false, errorMessage: '请输入名称' };

  if (input.key && findOrgNode(tree, input.key)) {
    const hit = findOrgNode(tree, input.key)!;
    hit.node.title = title;
    hit.node.type = input.type;
    saveOrgTree(tree);
    return { success: true, tree };
  }

  const key = input.key || `org-${Date.now()}`;
  if (findOrgNode(tree, key)) return { success: false, errorMessage: '节点 key 已存在' };
  const node: OrgTreeNode = { key, title, type: input.type };

  if (input.parentKey) {
    const parentHit = findOrgNode(tree, input.parentKey);
    if (!parentHit) return { success: false, errorMessage: '上级组织不存在' };
    parentHit.node.children = [...(parentHit.node.children || []), node];
  } else {
    tree.push(node);
  }
  saveOrgTree(tree);
  return { success: true, tree };
}

export function deleteOrgNode(key: string): { success: boolean; errorMessage?: string; tree?: OrgTreeNode[] } {
  const tree = cloneOrgTree(getOrgTree());
  const hit = findOrgNode(tree, key);
  if (!hit) return { success: false, errorMessage: '节点不存在' };
  if (hit.node.children?.length) {
    return { success: false, errorMessage: '请先删除下属部门' };
  }
  const persons = getOrgPersons().filter((p) => p.orgKey === key);
  if (persons.length) return { success: false, errorMessage: '该节点下仍有人员，无法删除' };
  const idx = hit.siblings.findIndex((n) => n.key === key);
  if (idx < 0) return { success: false, errorMessage: '节点不存在' };
  hit.siblings.splice(idx, 1);
  if (hit.parent) {
    hit.parent.children = hit.siblings.length ? hit.siblings : undefined;
    saveOrgTree(tree);
  } else {
    saveOrgTree(hit.siblings);
  }
  return { success: true, tree: getOrgTree() };
}

export function filterOrgTree(nodes: OrgTreeNode[], keyword: string): OrgTreeNode[] {
  const q = keyword.trim();
  if (!q) return nodes;
  const walk = (list: OrgTreeNode[]): OrgTreeNode[] =>
    list
      .map((n) => {
        const children = n.children?.length ? walk(n.children) : undefined;
        const selfHit = n.title.includes(q);
        if (selfHit || children?.length) {
          return { ...n, children };
        }
        return null;
      })
      .filter(Boolean) as OrgTreeNode[];
  return walk(nodes);
}

export function getAuditLogs(): AuditLog[] {
  if (!auditMem) {
    const stored = readJson<AuditLog[] | null>(AUDIT_KEY, null);
    if (stored && stored.length > 0) {
      auditMem = stored;
    } else {
      auditMem = buildSeedAuditLogs();
      writeJson(AUDIT_KEY, auditMem);
    }
  }
  return auditMem;
}

export function appendAudit(actor: string, action: string, detail?: string) {
  const logs = getAuditLogs();
  const row: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    actor,
    action,
    detail,
  };
  const next = [row, ...logs].slice(0, 200);
  auditMem = next;
  writeJson(AUDIT_KEY, next);
  return row;
}

export function findUserByUsername(username: string) {
  return getUsers().find((u) => u.username === username);
}

export function getRoleById(roleId: RoleId) {
  return getRoles().find((r) => r.id === roleId) || DEFAULT_ROLES[0];
}

/** 创建人可选的审批人列表（已按自审开关过滤） */
export function getApproverOptionsForCreator(creatorUsername: string): string[] {
  const user = findUserByUsername(creatorUsername);
  if (!user) return [];
  let list = [...(user.approverIds || [])];
  if (user.allowSelfApprove) {
    if (!list.includes(user.username)) list = [user.username, ...list];
  } else {
    list = list.filter((x) => x !== user.username);
  }
  return list.filter((uname) => {
    const u = findUserByUsername(uname);
    return u && u.status === '启用';
  });
}

export function validateActivityApprover(creatorUsername: string, approver: string) {
  if (!approver) return '请选择审批人';
  const user = findUserByUsername(creatorUsername);
  if (!user) return '创建人账号不存在，请重新登录';
  const options = getApproverOptionsForCreator(creatorUsername);
  if (!options.length) {
    return '请先在用户管理中为当前账号配置「我的活动审批人」';
  }
  if (!options.includes(approver)) {
    return '审批人不在您的可选名单中';
  }
  if (!user.allowSelfApprove && approver === creatorUsername) {
    return '当前账号不允许自己审批';
  }
  return null;
}

export function findMenuNode(
  nodes: MenuTreeNode[],
  key: string,
): { node: MenuTreeNode; parent: MenuTreeNode | null; siblings: MenuTreeNode[] } | null {
  for (const n of nodes) {
    if (n.key === key) return { node: n, parent: null, siblings: nodes };
    if (n.children?.length) {
      const hit = findMenuNode(n.children, key);
      if (hit) {
        if (!hit.parent) return { ...hit, parent: n, siblings: n.children || [] };
        return hit;
      }
    }
  }
  return null;
}

export function flattenMenuTree(
  nodes: MenuTreeNode[],
  depth = 0,
): Array<MenuTreeNode & { depth: number }> {
  const out: Array<MenuTreeNode & { depth: number }> = [];
  const sorted = [...nodes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  sorted.forEach((n) => {
    out.push({ ...n, depth });
    if (n.children?.length) out.push(...flattenMenuTree(n.children, depth + 1));
  });
  return out;
}

/** 管理页用：带 children 的树（已排序） */
export function getMenuTreeForAdmin(): MenuTreeNode[] {
  const sortWalk = (list: MenuTreeNode[]): MenuTreeNode[] =>
    [...list]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((n) => ({
        ...n,
        children: n.children?.length ? sortWalk(n.children) : undefined,
      }));
  return sortWalk(cloneTree(getMenuTree()));
}

/** 侧栏生效树：过滤隐藏 */
export function getEffectiveMenuTree(): MenuTreeNode[] {
  const walk = (list: MenuTreeNode[]): MenuTreeNode[] =>
    [...list]
      .filter((n) => !n.hideInMenu)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((n) => ({
        ...n,
        children: n.children?.length ? walk(n.children) : undefined,
      }));
  return walk(cloneTree(getMenuTree()));
}

export function upsertMenuNode(input: {
  key?: string;
  parentKey?: string | null;
  name: string;
  path?: string;
  icon?: string;
  order?: number;
  hideInMenu?: boolean;
}): { success: boolean; errorMessage?: string; tree?: MenuTreeNode[] } {
  const tree = cloneTree(getMenuTree());
  const isEdit = !!input.key && !!findMenuNode(tree, input.key);

  if (isEdit && input.key) {
    const hit = findMenuNode(tree, input.key);
    if (!hit) return { success: false, errorMessage: '菜单不存在' };
    hit.node.name = input.name;
    if (!hit.node.builtin) {
      hit.node.path = input.path ?? hit.node.path;
    }
    if (input.icon !== undefined) hit.node.icon = input.icon || undefined;
    if (typeof input.order === 'number') hit.node.order = input.order;
    if (typeof input.hideInMenu === 'boolean') hit.node.hideInMenu = input.hideInMenu;
    saveMenuTree(tree);
    return { success: true, tree: getMenuTreeForAdmin() };
  }

  const key = input.key || `custom-${Date.now()}`;
  if (findMenuNode(tree, key)) return { success: false, errorMessage: '菜单 key 已存在' };
  const node: MenuTreeNode = {
    key,
    name: input.name,
    path: input.path || '',
    icon: input.icon || undefined,
    order: input.order ?? 99,
    hideInMenu: !!input.hideInMenu,
    builtin: false,
  };

  if (input.parentKey) {
    const parentHit = findMenuNode(tree, input.parentKey);
    if (!parentHit) return { success: false, errorMessage: '上级菜单不存在' };
    parentHit.node.children = [...(parentHit.node.children || []), node];
  } else {
    tree.push(node);
  }
  saveMenuTree(tree);
  return { success: true, tree: getMenuTreeForAdmin() };
}

export function deleteMenuNode(key: string): { success: boolean; errorMessage?: string; tree?: MenuTreeNode[] } {
  const tree = cloneTree(getMenuTree());
  const hit = findMenuNode(tree, key);
  if (!hit) return { success: false, errorMessage: '菜单不存在' };
  const idx = hit.siblings.findIndex((n) => n.key === key);
  if (idx < 0) return { success: false, errorMessage: '菜单不存在' };
  hit.siblings.splice(idx, 1);
  if (hit.parent) {
    hit.parent.children = hit.siblings.length ? hit.siblings : undefined;
  } else {
    saveMenuTree(hit.siblings);
    return { success: true, tree: getMenuTreeForAdmin() };
  }
  saveMenuTree(tree);
  return { success: true, tree: getMenuTreeForAdmin() };
}

/** ProLayout menuDataRender：按可编辑树改名/排序/显隐 */
export function applyMenuDataOverrides<
  T extends {
    path?: string;
    name?: string;
    children?: T[];
    hideInMenu?: boolean;
    icon?: any;
    locale?: string | false;
  },
>(menuData: T[]): T[] {
  const flat = flattenMenuTree(getMenuTree());
  const byPath = new Map<string, MenuTreeNode>();
  flat.forEach((n) => {
    if (n.path) byPath.set(n.path.replace(/\/$/, ''), n);
  });

  const walk = (list: T[]): T[] => {
    const mapped = list.map((item, idx) => {
      const path = (item.path || '').replace(/\/$/, '') || item.path;
      let meta: MenuTreeNode | undefined;
      if (path) {
        meta = byPath.get(path);
        if (!meta && path.endsWith('/list')) {
          meta = byPath.get(path.replace(/\/list$/, ''));
        }
      }
      const children = item.children ? walk(item.children) : undefined;
      const next = {
        ...item,
        children,
        name: meta?.name ?? item.name,
        hideInMenu: meta?.hideInMenu ? true : item.hideInMenu,
        locale: meta?.name ? false : item.locale,
        order: meta?.order ?? idx,
      } as T & { order?: number };
      return next;
    });
    return mapped
      .filter((m) => !m.hideInMenu)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  };

  const stripSelfDup = (list: T[], parent?: T): T[] =>
    list
      .filter((item) => {
        if (!parent) return true;
        const pPath = (parent.path || '').replace(/\/$/, '');
        const cPath = (item.path || '').replace(/\/$/, '');
        if (pPath && cPath && pPath === cPath) return false;
        if (parent.name && item.name && parent.name === item.name) return false;
        return true;
      })
      .map((item) => ({
        ...item,
        children: item.children ? stripSelfDup(item.children, item) : undefined,
      }));

  return stripSelfDup(walk(menuData));
}

export function pageSlice<T>(list: T[], current: any = 1, pageSize: any = 10) {
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

/** @deprecated 兼容旧调用名 */
export function getMenuOverrides() {
  return [];
}

/** @deprecated */
export function saveMenuOverrides(_list: unknown) {
  // no-op：已改为全树存储
}
