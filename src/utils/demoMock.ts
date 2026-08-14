/**
 * 登录态与演示数据：
 * - 登录 / 当前用户 / 退出：始终走 localStorage，同浏览器刷新后仍保持登录
 * - 账号来自系统用户表（systemAdminStore）
 */

import {
  appendAudit,
  findUserByUsername,
  getRoleById,
  getUsers,
  saveUsers,
} from './systemAdminStore';

const AUTH_KEY = 'antd-prototype-demo-auth';
const PROFILE_KEY = 'dmp-account-profile-v1';

type AccountProfile = {
  email?: string;
  phone?: string;
  signature?: string;
};

const tableData: API.RuleListItem[] = Array.from({ length: 20 }).map(
  (_, index) => ({
    key: index,
    disabled: index % 6 === 0,
    href: 'https://ant.design',
    avatar:
      index % 2 === 0
        ? 'https://gw.alipayobjects.com/zos/rmsportal/eeHMaZBwmTvLdIwMfBpg.png'
        : 'https://gw.alipayobjects.com/zos/rmsportal/udxAbMEhpwthVVcjLXik.png',
    name: `TradeCode ${index}`,
    owner: '曲丽丽',
    desc: '这是一段描述',
    callNo: Math.floor(Math.random() * 1000),
    status: Math.floor(Math.random() * 10) % 4,
    updatedAt: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString().slice(0, 10),
    progress: Math.ceil(Math.random() * 100),
  }),
);

/** 生产静态包业务接口走本地 mock；开发仍用 Umi mock */
export const useClientDemoMock = process.env.NODE_ENV === 'production';

export function isDemoAuthed() {
  return !!localStorage.getItem(AUTH_KEY);
}

export function getDemoUsername() {
  return localStorage.getItem(AUTH_KEY) || '';
}

export function setDemoAuth(username: string) {
  localStorage.setItem(AUTH_KEY, username);
}

export function clearDemoAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function readProfiles(): Record<string, AccountProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfiles(map: Record<string, AccountProfile>) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(map));
}

function getAccountProfile(username: string): AccountProfile {
  return readProfiles()[username] || {};
}

export function saveAccountProfile(
  username: string,
  patch: AccountProfile,
): AccountProfile {
  const map = readProfiles();
  const next = { ...(map[username] || {}), ...patch };
  map[username] = next;
  writeProfiles(map);
  return next;
}

function toCurrentUser(username: string): API.CurrentUser {
  const user = findUserByUsername(username);
  const role = user ? getRoleById(user.roleId) : getRoleById('admin');
  const profile = getAccountProfile(username);
  const access =
    user?.roleId === 'admin' ? 'admin' : user?.roleId === 'tagger' ? 'tagger' : 'marketer';
  return {
    name: user?.name || username,
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: user?.id || '00000001',
    email: profile.email || `${username}@marketing.local`,
    signature: profile.signature || role?.description || '',
    title: role?.name || '用户',
    group: '数字营销平台',
    tags: role?.name ? [{ key: '0', label: role.name }] : [],
    notifyCount: 12,
    unreadCount: 11,
    country: 'China',
    access,
    phone: profile.phone || '13800000000',
    username: user?.username || username,
    roleId: user?.roleId || 'admin',
  } as API.CurrentUser;
}

export async function demoLogin(body: API.LoginParams): Promise<API.LoginResult> {
  await new Promise((r) => setTimeout(r, 200));
  const username = String(body.username || '');
  const password = String(body.password || '');

  // 兼容旧演示账号：user/ant.design → marketer
  let user = findUserByUsername(username);
  if (!user && username === 'user' && password === 'ant.design') {
    user = findUserByUsername('marketer');
  }
  // 兜底：用户表异常时仍保证 demo/admin 可登录
  if (!user && username === 'demo' && password === '123456') {
    user = {
      id: 'u-demo',
      username: 'demo',
      name: '演示管理员',
      password: '123456',
      status: '启用',
      roleId: 'admin',
      approverIds: ['WangSiyi', 'JiangYajuan', 'marketer'],
      allowSelfApprove: true,
    };
  }
  if (!user && username === 'admin' && (password === '123456' || password === 'ant.design')) {
    user = findUserByUsername('admin') || {
      id: 'u-admin',
      username: 'admin',
      name: '系统管理员',
      password: '123456',
      status: '启用',
      roleId: 'admin',
      approverIds: ['demo', 'WangSiyi'],
      allowSelfApprove: true,
    };
  }

  const validMobile = body.type === 'mobile';
  const passwordOk =
    user &&
    (user.password === password ||
      (user.username === 'admin' &&
        (password === '123456' || password === 'ant.design'))) &&
    user.status === '启用';

  if ((user && passwordOk) || validMobile) {
    const loginName = user?.username || 'demo';
    setDemoAuth(loginName);
    const list = getUsers();
    const idx = list.findIndex((u) => u.username === loginName);
    if (idx >= 0) {
      const copy = [...list];
      copy[idx] = {
        ...copy[idx],
        lastLoginAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
      saveUsers(copy);
    }
    try {
      appendAudit(loginName, '登录');
    } catch {
      // 审计失败不影响登录
    }
    const roleId = findUserByUsername(loginName)?.roleId || user?.roleId || 'admin';
    return {
      status: 'ok',
      type: body.type,
      currentAuthority: roleId === 'admin' ? 'admin' : 'user',
    };
  }

  clearDemoAuth();
  return {
    status: 'error',
    type: body.type,
    currentAuthority: 'guest',
  };
}

export async function demoCurrentUser(): Promise<{ data: API.CurrentUser }> {
  if (!isDemoAuthed()) {
    const error: any = new Error('请先登录！');
    error.name = 'BizError';
    error.info = {
      success: false,
      data: { isLogin: false },
      errorCode: '401',
      errorMessage: '请先登录！',
    };
    error.response = { status: 401 };
    throw error;
  }
  const username = getDemoUsername() || 'demo';
  // 兼容旧 auth 值 admin/user
  const mapped =
    username === 'admin' || username === 'user'
      ? username === 'user'
        ? 'marketer'
        : 'demo'
      : username;
  if (mapped !== username) setDemoAuth(mapped);
  return { data: toCurrentUser(mapped) };
}

export async function demoOutLogin() {
  const username = getDemoUsername();
  if (username) appendAudit(username, '退出登录');
  clearDemoAuth();
  return { data: {}, success: true };
}

/** 更新当前用户基本资料（姓名写回用户表，联系信息本地持久化） */
export async function demoUpdateProfile(input: {
  name?: string;
  email?: string;
  phone?: string;
  signature?: string;
}): Promise<{ success: boolean; data?: API.CurrentUser; errorMessage?: string }> {
  const username = getDemoUsername();
  if (!username) return { success: false, errorMessage: '请先登录' };
  const user = findUserByUsername(username);
  if (!user) return { success: false, errorMessage: '用户不存在' };

  const name = String(input.name || '').trim();
  if (!name) return { success: false, errorMessage: '请填写姓名' };

  const list = getUsers();
  const idx = list.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = { ...copy[idx], name };
    saveUsers(copy);
  }

  saveAccountProfile(username, {
    email: String(input.email || '').trim() || undefined,
    phone: String(input.phone || '').trim() || undefined,
    signature: String(input.signature || '').trim() || undefined,
  });
  appendAudit(username, '更新个人资料');
  return { success: true, data: toCurrentUser(username) };
}

/** 修改当前登录密码 */
export async function demoChangePassword(input: {
  oldPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; errorMessage?: string }> {
  const username = getDemoUsername();
  if (!username) return { success: false, errorMessage: '请先登录' };
  const user = findUserByUsername(username);
  if (!user) return { success: false, errorMessage: '用户不存在' };
  if (user.password !== input.oldPassword) {
    return { success: false, errorMessage: '当前密码不正确' };
  }
  const nextPwd = String(input.newPassword || '');
  if (nextPwd.length < 6) {
    return { success: false, errorMessage: '新密码至少 6 位' };
  }
  if (nextPwd === input.oldPassword) {
    return { success: false, errorMessage: '新密码不能与当前密码相同' };
  }
  const list = getUsers();
  const idx = list.findIndex((u) => u.id === user.id);
  if (idx < 0) return { success: false, errorMessage: '用户不存在' };
  const copy = [...list];
  copy[idx] = { ...copy[idx], password: nextPwd };
  saveUsers(copy);
  appendAudit(username, '修改登录密码');
  return { success: true };
}

export async function demoRule(params: {
  current?: number;
  pageSize?: number;
}): Promise<API.RuleList> {
  const current = Number(params.current || 1);
  const pageSize = Number(params.pageSize || 10);
  const start = (current - 1) * pageSize;
  return {
    data: tableData.slice(start, start + pageSize),
    total: tableData.length,
    success: true,
    pageSize,
    current,
  };
}

export async function demoNotices(): Promise<API.NoticeIconList> {
  return { data: [], total: 0, success: true };
}

export async function demoCaptcha() {
  return 'captcha-demo';
}
