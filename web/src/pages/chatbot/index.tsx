import { PageContainer } from '@ant-design/pro-components';
import { Card, Input, List, Typography } from 'antd';
import React, { useState } from 'react';

type ChatItem = { role: 'user' | 'assistant'; content: string };

const ChatbotPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([
    { role: 'assistant', content: '你好，我是 AI 助手（原型演示）。可以问我菜单或页面怎么找。' },
  ]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      {
        role: 'assistant',
        content: '已收到。正式项目可接入真实大模型；此处仅为母版占位。',
      },
    ]);
    setInput('');
  };

  return (
    <PageContainer>
      <Card title="AI 助手">
        <List
          style={{ minHeight: 280, marginBottom: 16 }}
          dataSource={messages}
          renderItem={(item) => (
            <List.Item>
              <Typography.Text strong={item.role === 'assistant'}>
                {item.role === 'user' ? '我：' : '助手：'}
              </Typography.Text>
              <span style={{ marginLeft: 8 }}>{item.content}</span>
            </List.Item>
          )}
        />
        <Input.Search
          placeholder="输入消息后回车发送"
          enterButton="发送"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSearch={send}
        />
      </Card>
    </PageContainer>
  );
};

export default ChatbotPage;
