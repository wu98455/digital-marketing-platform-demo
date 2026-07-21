import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1677ff',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: '数字营销平台',
  // 运行时用 PUBLIC_PATH（由 config.define 注入），适配 GitHub Pages 子路径
  logo: `${String(process.env.PUBLIC_PATH || '/')
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/?$/, '/')}logo.svg`.replace(/([^:]\/)\/+/g, '$1'),
  iconfontUrl: '',
  token: {
    // 选中菜单：主题色背景 + 白字（CSS 会用 var(--ant-color-primary) 跟随主题色）
    sider: {
      colorBgMenuItemSelected: '#1677ff',
      colorTextMenuSelected: '#ffffff',
    },
  },
};

export default Settings;
