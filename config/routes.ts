/**
 * 数字营销平台 · 菜单：经营分析 → 数据打标 → 目标人群 → 营销管理 → 系统管理
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    path: '/analytics',
    name: 'welcome',
    icon: 'home',
    component: './Welcome',
    access: 'canWelcome',
  },
  /** 旧欢迎页路径兼容跳转 */
  { path: '/welcome', redirect: '/analytics' },
  {
    path: '/tag-center',
    name: 'tag-center',
    icon: 'tags',
    access: 'canTagCenter',
    routes: [
      {
        path: '/tag-center',
        redirect: '/tag-center/list',
      },
      {
        path: '/tag-center/list',
        name: 'tag-center-list',
        component: './tag-center/list',
      },
      {
        path: '/tag-center/customer',
        name: 'tag-center-customer',
        component: './tag-center/customer',
      },
      {
        path: '/tag-center/store',
        name: 'tag-center-store',
        component: './tag-center/store',
      },
      {
        path: '/tag-center/store/view/:id',
        name: 'tag-center-store-view',
        component: './tag-center/store/view',
        hideInMenu: true,
      },
      {
        path: '/tag-center/product',
        name: 'tag-center-product',
        component: './tag-center/product',
      },
      {
        path: '/tag-center/product/view/:id',
        name: 'tag-center-product-view',
        component: './tag-center/product/view',
        hideInMenu: true,
      },
      {
        path: '/tag-center/campaign',
        name: 'tag-center-campaign',
        component: './tag-center/campaign',
      },
      {
        path: '/tag-center/campaign/view/:id',
        name: 'tag-center-campaign-view',
        component: './tag-center/campaign/view',
        hideInMenu: true,
      },
      {
        path: '/tag-center/create',
        name: 'tag-create',
        component: './tag-center/create',
        hideInMenu: true,
      },
      {
        path: '/tag-center/data-create/:kind',
        name: 'tag-data-create',
        component: './tag-center/data-create',
        hideInMenu: true,
      },
      {
        path: '/tag-center/edit/:group/:tag',
        name: 'tag-edit',
        component: './tag-center/create',
        hideInMenu: true,
      },
      {
        path: '/tag-center/detail/:group/:tag',
        name: 'tag-detail',
        component: './tag-center/detail',
        hideInMenu: true,
      },
      {
        path: '/tag-center/customer/view/:id',
        name: 'customer-view',
        component: './customer-asset/customer-list/view',
        hideInMenu: true,
      },
      { path: '/tag-center/rules', redirect: '/tag-center/list', hideInMenu: true },
      { path: '/tag-center/rules/create', redirect: '/tag-center/list', hideInMenu: true },
      { path: '/tag-center/rules/edit/:id', redirect: '/tag-center/list', hideInMenu: true },
      { path: '/tag-center/tags', redirect: '/tag-center/list', hideInMenu: true },
    ],
  },
  {
    path: '/crowd',
    name: 'crowd',
    icon: 'usergroupAdd',
    hideChildrenInMenu: true,
    access: 'canCrowd',
    routes: [
      {
        path: '/crowd',
        component: './customer-asset/crowd/list',
      },
      {
        path: '/crowd/create',
        name: 'crowd-create',
        component: './customer-asset/crowd/create',
        hideInMenu: true,
      },
      {
        path: '/crowd/detail/:id',
        name: 'crowd-detail',
        component: './customer-asset/crowd/detail',
        hideInMenu: true,
      },
    ],
  },
  {
    path: '/crowd-marketing',
    name: 'crowd-marketing',
    icon: 'notification',
    access: 'canMarketing',
    routes: [
      {
        path: '/crowd-marketing',
        redirect: '/crowd-marketing/activity',
      },
      {
        path: '/crowd-marketing/activity',
        name: 'marketing-activity',
        hideChildrenInMenu: true,
        routes: [
          {
            path: '/crowd-marketing/activity',
            component: './crowd-marketing/activity/list',
          },
          {
            path: '/crowd-marketing/activity/design/:id',
            name: 'activity-design',
            component: './crowd-marketing/activity/design',
            hideInMenu: true,
          },
          {
            path: '/crowd-marketing/activity/report/:id',
            name: 'activity-report',
            component: './crowd-marketing/activity/report',
            hideInMenu: true,
          },
        ],
      },
      {
        path: '/crowd-marketing/template',
        name: 'activity-template',
        hideChildrenInMenu: true,
        routes: [
          {
            path: '/crowd-marketing/template',
            redirect: '/crowd-marketing/template/local',
          },
          {
            path: '/crowd-marketing/template/local',
            component: './crowd-marketing/template/local',
          },
          {
            path: '/crowd-marketing/template/local/design/:id',
            name: 'template-design',
            component: './crowd-marketing/activity/design',
            hideInMenu: true,
          },
        ],
      },
      {
        path: '/crowd-marketing/template/cloud',
        redirect: '/crowd-marketing/template/local',
        hideInMenu: true,
      },
      {
        path: '/crowd-marketing/node-record',
        name: 'node-record',
        hideChildrenInMenu: true,
        routes: [
          {
            path: '/crowd-marketing/node-record',
            component: './crowd-marketing/node-record',
          },
          {
            path: '/crowd-marketing/node-record/result/:id',
            name: 'node-record-result',
            component: './crowd-marketing/activity/report',
            hideInMenu: true,
          },
        ],
      },
    ],
  },
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    access: 'canSystem',
    routes: [
      {
        path: '/system',
        redirect: '/system/users',
        hideInMenu: true,
      },
      {
        path: '/system/users',
        name: 'users',
        component: './system/users',
        access: 'canSystemUsers',
      },
      {
        path: '/system/roles',
        name: 'roles',
        component: './system/roles',
        access: 'canSystemRoles',
      },
      {
        path: '/system/org',
        name: 'org',
        component: './system/org',
        access: 'canSystemOrg',
      },
      {
        path: '/system/menus',
        name: 'menus',
        component: './system/menus',
        access: 'canSystemMenus',
      },
      {
        path: '/system/audit',
        name: 'audit',
        component: './system/audit',
        access: 'canSystemAudit',
      },
    ],
  },
  /** 路由保留、菜单隐藏：企微/微盟等细节页仍可直达 */
  {
    path: '/customer-asset',
    name: 'customer-asset',
    icon: 'team',
    hideInMenu: true,
    routes: [
      {
        path: '/customer-asset',
        redirect: '/customer-asset/customer-list',
      },
      {
        path: '/customer-asset/customer-list',
        name: 'customer-list',
        hideChildrenInMenu: true,
        routes: [
          {
            path: '/customer-asset/customer-list',
            component: './customer-asset/customer-list',
          },
          {
            path: '/customer-asset/customer-list/view/:id',
            name: 'customer-view',
            component: './customer-asset/customer-list/view',
            hideInMenu: true,
          },
        ],
      },
      {
        path: '/customer-asset/tag',
        name: 'tag',
        routes: [
          {
            path: '/customer-asset/tag',
            redirect: '/customer-asset/tag/shop',
          },
          {
            path: '/customer-asset/tag/shop',
            name: 'shop-tag',
            component: './customer-asset/tag/shop',
          },
          {
            path: '/customer-asset/tag/activity',
            name: 'activity-tag',
            component: './customer-asset/tag/activity',
          },
          {
            path: '/customer-asset/tag/omnichannel',
            name: 'omnichannel-tag',
            component: './customer-asset/tag/omnichannel',
          },
          {
            path: '/customer-asset/tag/import',
            name: 'tagged-import',
            component: './customer-asset/tag/import',
          },
          {
            path: '/customer-asset/tag/wecom',
            name: 'wecom-tag',
            component: './customer-asset/tag/wecom',
          },
          {
            path: '/customer-asset/tag/weimob',
            name: 'weimob-tag',
            component: './customer-asset/tag/weimob',
          },
        ],
      },
      {
        path: '/customer-asset/product',
        name: 'product',
        routes: [
          {
            path: '/customer-asset/product',
            redirect: '/customer-asset/product/list',
          },
          {
            path: '/customer-asset/product/list',
            name: 'product-list',
            component: './customer-asset/product/list',
          },
          {
            path: '/customer-asset/product/tag',
            name: 'product-tag',
            component: './customer-asset/product/tag',
          },
          {
            path: '/customer-asset/product/tagging-task',
            name: 'product-tagging-task',
            component: './customer-asset/product/tagging-task',
          },
        ],
      },
    ],
  },
  // 旧路径兼容
  { path: '/customer-asset/crowd', redirect: '/crowd' },
  { path: '/customer-asset/crowd/create', redirect: '/crowd/create' },
  { path: '/customer-asset/crowd/custom', redirect: '/crowd' },
  {
    path: '/',
    redirect: '/analytics',
  },
  {
    path: '*',
    layout: false,
    component: './exception/404',
  },
];
