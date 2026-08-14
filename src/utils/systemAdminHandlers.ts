import {
  appendAudit,
  countUsersByRole,
  deleteMenuNode,
  collectOrgSubtreeKeys,
  checkOrgNodeDeletable,
  deleteOrgNode,
  deleteOrgPerson as removeOrgPerson,
  filterOrgTree,
  findUserByUsername,
  getApproverOptionsForCreator,
  getAuditLogs,
  getEffectiveMenuTree,
  getMenuTreeForAdmin,
  getOrgPersons,
  getOrgTree,
  getRoles,
  getUsers,
  pageSlice,
  resetMenusToDefault,
  saveRoles,
  saveUsers,
  upsertMenuNode,
  upsertOrgNode,
  upsertOrgPerson as saveOrgPerson,
  type RoleId,
  type SystemRole,
  type SystemUser,
} from './systemAdminStore';

type Ctx = {
  params?: Record<string, any>;
  pathParams?: Record<string, string>;
  data?: any;
};

function slugifyRoleId(name: string) {
  const base = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]/gi, '')
    .slice(0, 24);
  return `${base || 'role'}-${Date.now().toString(36).slice(-4)}`;
}

export const systemAdminHandlers = {
  listUsers({ params = {} }: Ctx) {
    let list = [...getUsers()];
    const { keyword, status, roleId, current = 1, pageSize = 10 } = params;
    if (keyword) {
      list = list.filter(
        (u) => u.username.includes(String(keyword)) || u.name.includes(String(keyword)),
      );
    }
    if (status && status !== '全部') list = list.filter((u) => u.status === status);
    if (roleId && roleId !== '全部') list = list.filter((u) => u.roleId === roleId);
    return pageSlice(list, current, pageSize);
  },

  createUser({ data }: Ctx) {
    const body = (data || {}) as Partial<SystemUser> & { actor?: string };
    if (!body.username || !body.name) return { success: false, errorMessage: '请填写账号与姓名' };
    if (findUserByUsername(String(body.username))) {
      return { success: false, errorMessage: '账号已存在' };
    }
    const user: SystemUser = {
      id: `u-${Date.now()}`,
      username: String(body.username),
      name: String(body.name),
      password: String(body.password || '123456'),
      status: body.status === '停用' ? '停用' : '启用',
      roleId: (body.roleId as RoleId) || 'marketer',
      approverIds: Array.isArray(body.approverIds) ? body.approverIds.map(String) : [],
      allowSelfApprove: !!body.allowSelfApprove,
    };
    saveUsers([user, ...getUsers()]);
    appendAudit(body.actor || 'system', '新建用户', user.username);
    return { success: true, data: user };
  },

  updateUser({ pathParams = {}, data }: Ctx) {
    const id = pathParams.id;
    const body = (data || {}) as Partial<SystemUser> & { actor?: string };
    const list = getUsers();
    const idx = list.findIndex((u) => u.id === id);
    if (idx < 0) return { success: false, errorMessage: '用户不存在' };
    const prev = list[idx];
    const next: SystemUser = {
      ...prev,
      name: body.name ?? prev.name,
      status: body.status === '停用' || body.status === '启用' ? body.status : prev.status,
      roleId: (body.roleId as RoleId) || prev.roleId,
      approverIds: Array.isArray(body.approverIds)
        ? body.approverIds.map(String)
        : prev.approverIds,
      allowSelfApprove:
        typeof body.allowSelfApprove === 'boolean'
          ? body.allowSelfApprove
          : prev.allowSelfApprove,
      password: body.password ? String(body.password) : prev.password,
    };
    const copy = [...list];
    copy[idx] = next;
    saveUsers(copy);
    appendAudit(body.actor || 'system', '编辑用户', next.username);
    return { success: true, data: next };
  },

  resetPassword({ pathParams = {}, data }: Ctx) {
    const id = pathParams.id;
    const body = (data || {}) as { password?: string; actor?: string };
    const list = getUsers();
    const idx = list.findIndex((u) => u.id === id);
    if (idx < 0) return { success: false, errorMessage: '用户不存在' };
    const copy = [...list];
    copy[idx] = { ...copy[idx], password: body.password || '123456' };
    saveUsers(copy);
    appendAudit(body.actor || 'system', '重置密码', copy[idx].username);
    return { success: true, data: { id, username: copy[idx].username } };
  },

  deleteUser({ pathParams = {}, data }: Ctx) {
    const id = String(pathParams.id || '');
    const body = (data || {}) as { actor?: string };
    const list = getUsers();
    const user = list.find((u) => u.id === id);
    if (!user) return { success: false, errorMessage: '用户不存在' };
    if (['demo', 'admin'].includes(user.username)) {
      return { success: false, errorMessage: '系统内置账号不可删除，可改为停用' };
    }
    if (body.actor && user.username === body.actor) {
      return { success: false, errorMessage: '不能删除当前登录账号' };
    }
    saveUsers(list.filter((u) => u.id !== id));
    appendAudit(body.actor || 'system', '删除用户', user.username);
    return { success: true };
  },

  approverOptions({ pathParams = {} }: Ctx) {
    const username = pathParams.username;
    const user = findUserByUsername(username);
    return {
      success: true,
      data: {
        username,
        allowSelfApprove: !!user?.allowSelfApprove,
        approvers: getApproverOptionsForCreator(username),
      },
    };
  },

  listRoles(ctx: Ctx = {}) {
    const params = ctx.params || {};
    let list = [...getRoles()];
    const { keyword, name, center, current = 1, pageSize = 10 } = params || {};
    const kw = String(keyword || name || '').trim();
    if (kw) {
      list = list.filter((r) => r.name.includes(kw) || (r.description || '').includes(kw));
    }
    if (center && center !== '全部') {
      list = list.filter((r) => (r.centers || []).includes(String(center)));
    }
    return pageSlice(list, current, pageSize);
  },

  createRole({ data }: Ctx) {
    const body = (data || {}) as Partial<SystemRole> & { actor?: string };
    if (!body.name) return { success: false, errorMessage: '请填写角色名称' };
    const id = body.id ? String(body.id) : slugifyRoleId(String(body.name));
    if (getRoles().some((r) => r.id === id)) {
      return { success: false, errorMessage: '角色 ID 已存在' };
    }
    const role: SystemRole = {
      id,
      name: String(body.name),
      description: String(body.description || ''),
      menus: Array.isArray(body.menus) ? body.menus.map(String) : [],
      operations: Array.isArray(body.operations) ? (body.operations as any) : [],
      centers: Array.isArray(body.centers) ? (body.centers as any) : [],
    };
    saveRoles([...getRoles(), role]);
    appendAudit(body.actor || 'system', '新建角色', role.name);
    return { success: true, data: role };
  },

  updateRole({ pathParams = {}, data }: Ctx) {
    const id = pathParams.id as RoleId;
    const body = (data || {}) as Partial<SystemRole> & { actor?: string };
    const list = getRoles();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return { success: false, errorMessage: '角色不存在' };
    const next: SystemRole = {
      ...list[idx],
      name: body.name ?? list[idx].name,
      description: body.description ?? list[idx].description,
      menus: Array.isArray(body.menus) ? body.menus.map(String) : list[idx].menus,
      operations: Array.isArray(body.operations)
        ? (body.operations as any)
        : list[idx].operations,
      centers: Array.isArray(body.centers) ? (body.centers as any) : list[idx].centers,
    };
    const copy = [...list];
    copy[idx] = next;
    saveRoles(copy);
    appendAudit(body.actor || 'system', '编辑角色', next.name);
    return { success: true, data: next };
  },

  deleteRole({ pathParams = {}, data }: Ctx) {
    const id = pathParams.id as RoleId;
    const body = (data || {}) as { actor?: string };
    const list = getRoles();
    const role = list.find((r) => r.id === id);
    if (!role) return { success: false, errorMessage: '角色不存在' };
    if (['admin', 'tagger', 'marketer'].includes(String(id))) {
      return { success: false, errorMessage: '内置角色不可删除，可复制后调整' };
    }
    const used = countUsersByRole(id);
    if (used > 0) {
      return { success: false, errorMessage: `仍有 ${used} 个用户绑定该角色，请先调整用户角色` };
    }
    saveRoles(list.filter((r) => r.id !== id));
    appendAudit(body.actor || 'system', '删除角色', role.name);
    return { success: true };
  },

  copyRole({ pathParams = {}, data }: Ctx) {
    const id = pathParams.id as RoleId;
    const body = (data || {}) as { actor?: string; name?: string };
    const src = getRoles().find((r) => r.id === id);
    if (!src) return { success: false, errorMessage: '角色不存在' };
    const name = String(body.name || `${src.name}（副本）`).trim();
    if (!name) return { success: false, errorMessage: '请填写角色名称' };
    if (getRoles().some((r) => r.name === name)) {
      return { success: false, errorMessage: '角色名称已存在' };
    }
    const newId = slugifyRoleId(name);
    const role: SystemRole = {
      id: newId,
      name,
      description: src.description,
      menus: [...(src.menus || [])],
      operations: [...(src.operations || [])],
      centers: [...(src.centers || [])],
    };
    saveRoles([...getRoles(), role]);
    appendAudit(body.actor || 'system', '复制角色', `${src.name} → ${name}`);
    return { success: true, data: role };
  },

  getMenus() {
    return {
      success: true,
      data: {
        tree: getMenuTreeForAdmin(),
        effective: getEffectiveMenuTree(),
      },
    };
  },

  createMenu({ data }: Ctx) {
    const body = (data || {}) as {
      parentKey?: string | null;
      name?: string;
      path?: string;
      icon?: string;
      order?: number;
      hideInMenu?: boolean;
      actor?: string;
    };
    if (!body.name) return { success: false, errorMessage: '请填写菜单名称' };
    const res = upsertMenuNode({
      parentKey: body.parentKey || null,
      name: body.name,
      path: body.path,
      icon: body.icon,
      order: body.order,
      hideInMenu: body.hideInMenu,
    });
    if (!res.success) return res;
    appendAudit(body.actor || 'system', '新增菜单', body.name);
    return { success: true, data: { tree: res.tree } };
  },

  updateMenu({ pathParams = {}, data }: Ctx) {
    const key = pathParams.key;
    const body = (data || {}) as {
      name?: string;
      path?: string;
      icon?: string;
      order?: number;
      hideInMenu?: boolean;
      actor?: string;
    };
    if (!key) return { success: false, errorMessage: '缺少菜单 key' };
    if (!body.name) return { success: false, errorMessage: '请填写菜单名称' };
    const res = upsertMenuNode({
      key,
      name: body.name,
      path: body.path,
      icon: body.icon,
      order: body.order,
      hideInMenu: body.hideInMenu,
    });
    if (!res.success) return res;
    appendAudit(body.actor || 'system', '编辑菜单', body.name);
    return { success: true, data: { tree: res.tree } };
  },

  deleteMenu({ pathParams = {}, data }: Ctx) {
    const key = pathParams.key;
    const body = (data || {}) as { actor?: string };
    if (!key) return { success: false, errorMessage: '缺少菜单 key' };
    const res = deleteMenuNode(key);
    if (!res.success) return res;
    appendAudit(body.actor || 'system', '删除菜单', key);
    return { success: true, data: { tree: res.tree } };
  },

  resetMenus({ data }: Ctx) {
    const body = (data || {}) as { actor?: string };
    resetMenusToDefault();
    appendAudit(body.actor || 'system', '重置菜单默认');
    return {
      success: true,
      data: {
        tree: getMenuTreeForAdmin(),
        effective: getEffectiveMenuTree(),
      },
    };
  },

  listAudit({ params = {} }: Ctx) {
    let list = [...getAuditLogs()];
    const { keyword, actor, action, atRange, current = 1, pageSize = 10 } = params;
    if (keyword) {
      list = list.filter(
        (l) => l.action.includes(String(keyword)) || (l.detail || '').includes(String(keyword)),
      );
    }
    if (actor) list = list.filter((l) => l.actor.includes(String(actor)));
    if (action) list = list.filter((l) => l.action.includes(String(action)));
    if (atRange) {
      const range = String(atRange).split(',');
      if (range.length === 2) {
        const [from, to] = range;
        list = list.filter((l) => {
          const d = (l.at || '').slice(0, 10);
          return d >= from && d <= to;
        });
      }
    }
    return pageSlice(list, current, pageSize);
  },

  getOrgTree({ params = {} }: Ctx) {
    const keyword = String(params.keyword || '');
    const tree = filterOrgTree(getOrgTree(), keyword);
    return { success: true, data: { tree } };
  },

  upsertOrg({ data }: Ctx) {
    const body = (data || {}) as {
      key?: string;
      parentKey?: string | null;
      title?: string;
      type?: '组织' | '部门';
      actor?: string;
    };
    const res = upsertOrgNode({
      key: body.key,
      parentKey: body.parentKey,
      title: String(body.title || ''),
      type: body.type === '部门' ? '部门' : '组织',
    });
    if (!res.success) return res;
    appendAudit(body.actor || 'system', body.key ? '编辑组织' : '新增组织', body.title);
    return { success: true, data: { tree: res.tree } };
  },

  checkDeleteOrg({ pathParams = {} }: Ctx) {
    const key = String(pathParams.key || '');
    const res = checkOrgNodeDeletable(key);
    return { success: true, data: res };
  },

  deleteOrg({ pathParams = {}, data }: Ctx) {
    const key = pathParams.key;
    const body = (data || {}) as { actor?: string };
    const res = deleteOrgNode(String(key));
    if (!res.success) return res;
    appendAudit(body.actor || 'system', '删除组织', key);
    return { success: true, data: { tree: res.tree } };
  },

  listOrgPersons({ params = {} }: Ctx) {
    const orgKey = String(params.orgKey || '');
    let list = getOrgPersons();
    if (orgKey) {
      const keys = new Set(collectOrgSubtreeKeys(orgKey));
      list = list.filter((p) => keys.has(p.orgKey));
    }
    const { keyword, name, phone, status, current = 1, pageSize = 10 } = params;
    const kw = String(keyword || name || '').trim();
    if (kw) {
      list = list.filter((p) => p.name.includes(kw) || p.phone.includes(kw));
    }
    if (phone) {
      list = list.filter((p) => p.phone.includes(String(phone)));
    }
    if (status && status !== '全部') {
      list = list.filter((p) => p.status === status);
    }
    return pageSlice(list, current, pageSize);
  },

  upsertOrgPerson({ data, pathParams = {} }: Ctx) {
    const body = (data || {}) as {
      id?: string;
      orgKey?: string;
      name?: string;
      phone?: string;
      role?: string;
      status?: '在职' | '离职';
      actor?: string;
    };
    const id = body.id || pathParams.id;
    const res = saveOrgPerson({
      id,
      orgKey: String(body.orgKey || ''),
      name: String(body.name || ''),
      phone: String(body.phone || ''),
      role: String(body.role || ''),
      status: body.status === '离职' ? '离职' : '在职',
    });
    if (!res.success) return res;
    appendAudit(body.actor || 'system', id ? '编辑组织人员' : '新增组织人员', body.name);
    return { success: true };
  },

  deleteOrgPerson({ pathParams = {}, data }: Ctx) {
    const id = String(pathParams.id || '');
    const body = (data || {}) as { actor?: string };
    const res = removeOrgPerson(id);
    if (!res.success) return res;
    appendAudit(body.actor || 'system', '删除组织人员', id);
    return { success: true };
  },
};
