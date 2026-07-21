/**
 * 数字营销平台 · 菜单：欢迎 + 客户资产 + 人群营销 + 事件营销（按 xlsx）
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
    path: '/welcome',
    name: 'welcome',
    icon: 'home',
    component: './Welcome',
  },
  {
    path: '/customer-asset',
    name: 'customer-asset',
    icon: 'team',
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
        path: '/customer-asset/crowd',
        name: 'crowd',
        routes: [
          {
            path: '/customer-asset/crowd',
            redirect: '/customer-asset/crowd/custom',
          },
          {
            path: '/customer-asset/crowd/custom',
            name: 'custom-crowd',
            component: './customer-asset/crowd/list',
          },
          {
            path: '/customer-asset/crowd/create',
            name: 'crowd-create',
            component: './customer-asset/crowd/create',
            hideInMenu: true,
          },
          {
            path: '/customer-asset/crowd/detail/:id',
            name: 'crowd-detail',
            component: './customer-asset/crowd/detail',
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
  {
    path: '/crowd-marketing',
    name: 'crowd-marketing',
    icon: 'notification',
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
        ],
      },
      {
        path: '/crowd-marketing/template',
        name: 'activity-template',
        routes: [
          {
            path: '/crowd-marketing/template',
            redirect: '/crowd-marketing/template/local',
          },
          {
            path: '/crowd-marketing/template/local',
            name: 'local-template',
            hideChildrenInMenu: true,
            routes: [
              {
                path: '/crowd-marketing/template/local',
                component: './crowd-marketing/template/local',
              },
              {
                path: '/crowd-marketing/template/local/design/:id',
                name: 'template-design',
                component: './crowd-marketing/template/design',
                hideInMenu: true,
              },
            ],
          },
          {
            path: '/crowd-marketing/template/cloud',
            name: 'cloud-template',
            component: './crowd-marketing/template/cloud',
          },
        ],
      },
      {
        path: '/crowd-marketing/node-record',
        name: 'node-record',
        component: './crowd-marketing/node-record',
      },
    ],
  },
  {
    path: '/event-marketing',
    name: 'event-marketing',
    icon: 'heart',
    routes: [
      {
        path: '/event-marketing',
        redirect: '/event-marketing/member-care/scenarios',
      },
      {
        path: '/event-marketing/member-care',
        name: 'member-care',
        routes: [
          {
            path: '/event-marketing/member-care',
            redirect: '/event-marketing/member-care/scenarios',
          },
          {
            path: '/event-marketing/member-care/scenarios',
            name: 'care-scenarios',
            component: './event-marketing/member-care/scenarios',
          },
          {
            path: '/event-marketing/member-care/plans',
            name: 'care-plans',
            component: './event-marketing/member-care/plans',
          },
          {
            path: '/event-marketing/member-care/records',
            name: 'care-records',
            component: './event-marketing/member-care/records',
          },
          {
            path: '/event-marketing/member-care/stats',
            name: 'care-stats',
            component: './event-marketing/member-care/stats',
          },
        ],
      },
    ],
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '*',
    layout: false,
    component: './exception/404',
  },
];
