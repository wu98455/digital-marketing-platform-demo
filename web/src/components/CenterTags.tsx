import { Space, Tag } from 'antd';
import React from 'react';
import { formatCenters } from '@/utils/centers';

type Props = {
  centers?: string[] | null;
  max?: number;
};

/** 列表「分中心」列：多值 Tag 展示 */
const CenterTags: React.FC<Props> = ({ centers, max = 4 }) => {
  if (!centers?.length) {
    return <span style={{ color: 'rgba(0,0,0,0.45)' }}>--</span>;
  }
  const show = centers.slice(0, max);
  const rest = centers.length - show.length;
  return (
    <Space size={[4, 4]} wrap>
      {show.map((c) => (
        <Tag key={c} style={{ marginInlineEnd: 0 }}>
          {c}
        </Tag>
      ))}
      {rest > 0 ? (
        <Tag style={{ marginInlineEnd: 0 }} title={formatCenters(centers)}>
          +{rest}
        </Tag>
      ) : null}
    </Space>
  );
};

export default CenterTags;
