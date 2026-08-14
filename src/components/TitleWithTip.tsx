import { QuestionCircleOutlined } from '@ant-design/icons';
import { Space, Tooltip } from 'antd';
import React from 'react';

type Props = {
  title: React.ReactNode;
  tip: React.ReactNode;
};

/** 标题 + 注释图标（悬停/点击看说明，不占页面顶栏） */
const TitleWithTip: React.FC<Props> = ({ title, tip }) => (
  <Space size={6}>
    <span>{title}</span>
    <Tooltip title={tip} placement="topLeft">
      <QuestionCircleOutlined
        style={{ color: 'rgba(0,0,0,0.45)', cursor: 'help', fontSize: 14 }}
      />
    </Tooltip>
  </Space>
);

export default TitleWithTip;
