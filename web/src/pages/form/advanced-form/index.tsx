import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';

const AdvancedForm: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <PageContainer>
      {contextHolder}
      <ProForm
        onFinish={async (values) => {
          messageApi.success('高级表单已提交');
          console.log(values);
          return true;
        }}
      >
        <ProCard title="仓库管理" bordered headerBordered style={{ marginBottom: 16 }}>
          <ProForm.Group>
            <ProFormText name="name" label="仓库名" width="md" rules={[{ required: true }]} />
            <ProFormSelect
              name="url"
              label="仓库域名"
              width="md"
              options={[
                { label: 'demo.pro', value: 'demo' },
                { label: 'preview.pro', value: 'preview' },
              ]}
            />
          </ProForm.Group>
          <ProForm.Group>
            <ProFormSelect
              name="owner"
              label="仓库管理员"
              width="md"
              options={[
                { label: '付小小', value: 'fx' },
                { label: '周毛毛', value: 'zm' },
              ]}
            />
            <ProFormSelect
              name="approver"
              label="审批人"
              width="md"
              options={[
                { label: '王昭君', value: 'wzj' },
                { label: '孙悟空', value: 'swk' },
              ]}
            />
          </ProForm.Group>
        </ProCard>
        <ProCard title="任务管理" bordered headerBordered>
          <ProFormList
            name="tasks"
            label="成员任务"
            creatorButtonProps={{ creatorButtonText: '添加任务行' }}
            initialValue={[{ name: 'Demo', role: 'owner' }]}
          >
            <ProForm.Group key="group">
              <ProFormText name="name" label="成员姓名" width="sm" />
              <ProFormSelect
                name="role"
                label="角色"
                width="sm"
                options={[
                  { label: '负责人', value: 'owner' },
                  { label: '执行人', value: 'member' },
                ]}
              />
              <ProFormDigit name="count" label="工时" width="xs" min={0} />
            </ProForm.Group>
          </ProFormList>
        </ProCard>
      </ProForm>
    </PageContainer>
  );
};

export default AdvancedForm;
