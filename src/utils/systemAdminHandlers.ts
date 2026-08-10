import {
  appendAudit,
  countUsersByRole,
  deleteMenuNode,
  deleteOrgNode,
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

  listRoles() {
    return { success: true, data: getRoles() };
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
    const used = countUsersByRole(id);
    if (used > 0) {
      return { success: false, errorMessage: `仍有 ${used} 个用户绑定该角色，请先调整用户角色` };
    }
    saveRoles(list.filter((r) => r.id !== id));
    appendAudit(body.actor || 'system', '删除角色', role.name);
    return { success: true };
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
    const { keyword, actor, current = 1, pageSize = 10 } = params;
    if (keyword) {
      list = list.filter(
        (l) => l.action.includes(String(keyword)) || (l.detail || '').includes(String(keyword)),
      );
    }
    if (actor) list = list.filter((l) => l.actor.includes(String(actor)));
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
    if (orgKey) list = list.filter((p) => p.orgKey === orgKey);
    const { keyword, current = 1, pageSize = 10 } = params;
    if (keyword) {
      list = list.filter(
        (p) => p.name.includes(String(keyword)) || p.phone.includes(String(keyword)),
      );
    }
    return pageSlice(list, current, pageSize);
  },
};
