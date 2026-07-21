import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, message } from 'antd';
import React from 'react';

const AccountSettings: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <PageContainer>
      {contextHolder}
      <Card title="基本设置">
        <ProForm
          initialValues={{
            name: initialState?.currentUser?.name,
            email: initialState?.currentUser?.email,
            phone: initialState?.currentUser?.phone,
          }}
          onFinish={async () => {
            messageApi.success('保存成功（演示）');
            return true;
          }}
        >
          <ProFormText name="name" label="昵称" width="md" rules={[{ required: true }]} />
          <ProFormText name="email" label="邮箱" width="md" />
          <ProFormText name="phone" label="手机" width="md" />
          <ProFormTextArea name="profile" label="个人简介" width="xl" />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default AccountSettings;
