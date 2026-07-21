/** 演示用省市区树（精简数据，够演示多选与级联） */
export type RegionNode = {
  code: string;
  name: string;
  children?: RegionNode[];
};

export const regionTree: RegionNode[] = [
  {
    code: '14',
    name: '山西省',
    children: [
      {
        code: '1403',
        name: '阳泉市',
        children: [
          { code: '140302', name: '城区' },
          { code: '140303', name: '矿区' },
          { code: '140311', name: '郊区' },
          { code: '140321', name: '平定县' },
          { code: '140322', name: '盂县' },
        ],
      },
      {
        code: '1404',
        name: '长治市',
        children: [
          { code: '140403', name: '潞州区' },
          { code: '140404', name: '上党区' },
          { code: '140405', name: '屯留区' },
        ],
      },
      {
        code: '1405',
        name: '晋城市',
        children: [
          { code: '140502', name: '城区' },
          { code: '140521', name: '沁水县' },
          { code: '140522', name: '阳城县' },
        ],
      },
      {
        code: '1401',
        name: '太原市',
        children: [
          { code: '140105', name: '小店区' },
          { code: '140106', name: '迎泽区' },
          { code: '140107', name: '杏花岭区' },
        ],
      },
    ],
  },
  {
    code: '50',
    name: '重庆市',
    children: [
      {
        code: '5001',
        name: '市辖区',
        children: [
          { code: '500103', name: '渝中区' },
          { code: '500105', name: '江北区' },
          { code: '500112', name: '渝北区' },
          { code: '500108', name: '南岸区' },
        ],
      },
    ],
  },
  {
    code: '51',
    name: '四川省',
    children: [
      {
        code: '5101',
        name: '成都市',
        children: [
          { code: '510104', name: '锦江区' },
          { code: '510105', name: '青羊区' },
          { code: '510107', name: '武侯区' },
        ],
      },
      {
        code: '5107',
        name: '绵阳市',
        children: [
          { code: '510703', name: '涪城区' },
          { code: '510704', name: '游仙区' },
        ],
      },
    ],
  },
  {
    code: '11',
    name: '北京市',
    children: [
      {
        code: '1101',
        name: '市辖区',
        children: [
          { code: '110101', name: '东城区' },
          { code: '110102', name: '西城区' },
          { code: '110105', name: '朝阳区' },
          { code: '110108', name: '海淀区' },
        ],
      },
    ],
  },
  {
    code: '31',
    name: '上海市',
    children: [
      {
        code: '3101',
        name: '市辖区',
        children: [
          { code: '310101', name: '黄浦区' },
          { code: '310104', name: '徐汇区' },
          { code: '310115', name: '浦东新区' },
        ],
      },
    ],
  },
];

export type RegionSelection = {
  code: string;
  name: string;
  level: 'province' | 'city' | 'district';
  path: string[];
};

export function flattenLeaves(node: RegionNode, path: string[] = []): RegionSelection[] {
  const next = [...path, node.name];
  if (!node.children?.length) {
    return [{ code: node.code, name: node.name, level: 'district', path: next }];
  }
  return node.children.flatMap((c) => flattenLeaves(c, next));
}

export function findNode(tree: RegionNode[], code: string): RegionNode | undefined {
  for (const n of tree) {
    if (n.code === code) return n;
    if (n.children) {
      const found = findNode(n.children, code);
      if (found) return found;
    }
  }
  return undefined;
}
