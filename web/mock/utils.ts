/**
 * Mock 工具函数和数据
 * 所有 mock 文件共享的公共数据和方法
 */

// 公共数据数组
export const titles = [
  '618 大促活动',
  '新客拉新计划',
  '会员日营销',
  '品牌曝光投放',
  '私域社群运营',
  '短视频种草',
  '直播带货',
  '短信召回',
];

export const avatars = [
  'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png',
  'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png',
  'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png',
  'https://gw.alipayobjects.com/zos/rmsportal/siCrBXXhmvTQGWPNLBow.png',
  'https://gw.alipayobjects.com/zos/rmsportal/kZzEzemZyKLKFsojXItE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ComBAopevLwENQdKWiIn.png',
  'https://gw.alipayobjects.com/zos/rmsportal/nxkuOJlFJuAUhzlMTCEe.png',
];

export const covers = [
  'https://gw.alipayobjects.com/zos/rmsportal/uMfMFlvUuceEyPpotzlq.png',
  'https://gw.alipayobjects.com/zos/rmsportal/iZBVOIhGJiAnhplqjvZW.png',
  'https://gw.alipayobjects.com/zos/rmsportal/iXjVmWVHbCJAyqvDxdtx.png',
  'https://gw.alipayobjects.com/zos/rmsportal/gLaIAoVWTtLbBWZNYEMg.png',
];

export const desc = [
  '那是一种内在的东西， 他们到达不了，也无法触及的',
  '希望是一个好东西，也许是最好的，好东西是不会消亡的',
  '生命就像一盒巧克力，结果往往出人意料',
  '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
  '那时候我只会想自己想要什么，从不想自己拥有什么',
];

export const user = [
  '付小小',
  '曲丽丽',
  '林东东',
  '周星星',
  '吴加好',
  '朱偏右',
  '鱼酱',
  '乐哥',
  '谭小仪',
  '仲尼',
];

// 默认用户信息
export const defaultUser = {
  name: '演示管理员',
  avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
  userid: '00000001',
  email: 'demo@marketing.local',
  signature: '数据驱动增长，精准触达用户',
  title: '营销运营',
  group: '数字营销平台－运营部',
  tags: [
    { key: '0', label: '增长黑客' },
    { key: '1', label: '数据分析' },
    { key: '2', label: '内容运营' },
    { key: '3', label: '渠道投放' },
    { key: '4', label: '用户洞察' },
    { key: '5', label: '活动策划' },
  ],
  notifyCount: 12,
  unreadCount: 11,
  country: 'China',
  geographic: {
    province: { label: '浙江省', key: '330000' },
    city: { label: '杭州市', key: '330100' },
  },
  address: '西湖区工专路 77 号',
  phone: '0752-268888888',
};

// 成员数据（用于列表项）
export const memberAvatars = [
  'https://gw.alipayobjects.com/zos/rmsportal/ZiESqWwCXBRQoaPONSJe.png',
  'https://gw.alipayobjects.com/zos/rmsportal/tBOxZPlITHqwlGjsJWaF.png',
  'https://gw.alipayobjects.com/zos/rmsportal/sBxjgqiuHMGRkIjqlQCd.png',
];

export const memberNames = ['曲丽丽', '王昭君', '董娜娜'];

export const members = memberAvatars.map((avatar, i) => ({
  avatar,
  name: memberNames[i],
  id: `member${i + 1}`,
}));

/**
 * 模拟异步延迟
 */
export const waitTime = (time: number = 100): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

/**
 * 生成模拟列表数据
 */
export function fakeList(count: number) {
  const list = [];
  for (let i = 0; i < count; i += 1) {
    list.push({
      id: `fake-list-${Math.random().toString(36).slice(2, 6)}${i}`,
      owner: user[i % user.length],
      title: titles[i % titles.length],
      avatar: avatars[i % avatars.length],
      cover: Math.floor(i / 4) % 2 === 0 ? covers[i % covers.length] : covers[3 - (i % covers.length)],
      status: ['active', 'exception', 'normal'][i % 3],
      percent: Math.ceil(Math.random() * 50) + 50,
      logo: avatars[i % 8],
      href: 'https://ant.design',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2 * i).getTime(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 * i).getTime(),
      subDescription: desc[i % 5],
      description: '在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。',
      activeUser: Math.ceil(Math.random() * 100000) + 100000,
      newUser: Math.ceil(Math.random() * 1000) + 1000,
      star: Math.ceil(Math.random() * 100) + 100,
      like: Math.ceil(Math.random() * 100) + 100,
      message: Math.ceil(Math.random() * 10) + 10,
      content: '段落示意：数字营销平台支持活动创建、人群圈选、多渠道触达与效果分析，帮助团队以数据驱动的方式提升转化与 ROI。',
      members,
    });
  }
  return list;
}