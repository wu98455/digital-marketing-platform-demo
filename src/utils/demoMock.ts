/**
 * 登录态与演示数据：
 * - 登录 / 当前用户 / 退出：始终走 localStorage，同浏览器刷新后仍保持登录
 * - 业务列表等：开发走 Umi mock，生产静态包走本地函数
 */

const AUTH_KEY = 'antd-prototype-demo-auth';

const demoUser: API.CurrentUser = {
  name: '演示管理员',
  avatar:
    'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
  userid: '00000001',
  email: 'demo@marketing.local',
  signature: '数据驱动增长，精准触达用户',
  title: '营销运营',
  group: '数字营销平台－运营部',
  tags: [
    { key: '0', label: '增长黑客' },
    { key: '1', label: '数据分析' },
  ],
  notifyCount: 12,
  unreadCount: 11,
  country: 'China',
  access: 'admin',
  geographic: {
    province: { label: '浙江省', key: '330000' },
    city: { label: '杭州市', key: '330100' },
  },
  address: '西湖区工专路 77 号',
  phone: '0752-268888888',
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

export function setDemoAuth(authority = 'admin') {
  localStorage.setItem(AUTH_KEY, authority);
}

export function clearDemoAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export async function demoLogin(body: API.LoginParams): Promise<API.LoginResult> {
  await new Promise((r) => setTimeout(r, 200));
  const valid =
    (body.username === 'demo' && body.password === '123456') ||
    (body.username === 'admin' && body.password === 'ant.design') ||
    (body.username === 'user' && body.password === 'ant.design') ||
    body.type === 'mobile';

  if (valid) {
    const authority = body.username === 'user' ? 'user' : 'admin';
    setDemoAuth(authority);
    return {
      status: 'ok',
      type: body.type,
      currentAuthority: authority,
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
  const access = localStorage.getItem(AUTH_KEY) || 'admin';
  return { data: { ...demoUser, access } };
}

export async function demoOutLogin() {
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
