import { Popover, Space, Tag, Typography } from 'antd';
import React from 'react';
import type { TagGroup, TagItem } from './types';
import { colorForGroup } from './types';

type Props = {
  tags?: TagItem[];
  /** 标签库（用于分组配色） */
  catalog?: TagGroup[];
  maxVisible?: number;
  onClick?: () => void;
  emptyText?: string;
};

const TagChips: React.FC<Props> = ({
  tags = [],
  catalog,
  maxVisible = 3,
  onClick,
  emptyText = '暂无标签',
}) => {
  if (!tags.length) {
    return (
      <Typography.Text
        type="secondary"
        style={{ cursor: onClick ? 'pointer' : undefined }}
        onClick={onClick}
      >
        {emptyText}
      </Typography.Text>
    );
  }

  const visible = tags.slice(0, maxVisible);
  const rest = tags.slice(maxVisible);

  const chip = (item: TagItem) => (
    <Tag
      key={`${item.group}::${item.tag}`}
      color={colorForGroup(item.group, catalog)}
      style={{ marginInlineEnd: 0, cursor: onClick ? 'pointer' : undefined }}
    >
      {item.tag}
    </Tag>
  );

  const body = (
    <Space
      size={[4, 4]}
      wrap
      style={{ cursor: onClick ? 'pointer' : undefined, maxWidth: 280 }}
      onClick={onClick}
    >
      {visible.map(chip)}
      {rest.length > 0 && (
        <Popover
          content={
            <Space size={[4, 4]} wrap style={{ maxWidth: 280 }}>
              {tags.map(chip)}
            </Space>
          }
          title="全部标签"
        >
          <Tag style={{ cursor: 'pointer', marginInlineEnd: 0 }}>+{rest.length}</Tag>
        </Popover>
      )}
    </Space>
  );

  return body;
};

export default TagChips;
