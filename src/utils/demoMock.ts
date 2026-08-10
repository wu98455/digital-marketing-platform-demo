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

function toCurrentUser(username: string): API.CurrentUser {
  const user = findUserByUsername(username);
  const role = user ? getRoleById(user.roleId) : getRoleById('admin');
  const access =
    user?.roleId === 'admin' ? 'admin' : user?.roleId === 'tagger' ? 'tagger' : 'marketer';
  return {
    name: user?.name || username,
    avatar:
      'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: user?.id || '00000001',
    email: `${username}@marketing.local`,
    signature: role.description,
    title: role.name,
    group: '数字营销平台',
    tags: [{ key: '0', label: role.name }],
    notifyCount: 12,
    unreadCount: 11,
    country: 'China',
    access,
    phone: '0752-268888888',
    // 扩展字段：活动侧读 username
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
  if (!user && username === 'admin' && password === 'ant.design') {
    user = findUserByUsername('admin') || {
      id: 'u-admin',
      username: 'admin',
      name: '系统管理员',
      password: 'ant.design',
      status: '启用',
      roleId: 'admin',
      approverIds: ['demo'],
      allowSelfApprove: true,
    };
  }

  const validMobile = body.type === 'mobile';
  const passwordOk = user && user.password === password && user.status === '启用';

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
