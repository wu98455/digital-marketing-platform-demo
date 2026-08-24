import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Card, message } from 'antd';
import React from 'react';

const BasicForm: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <PageContainer>
      {contextHolder}
      <Card>
        <ProForm
          onFinish={async (values) => {
            messageApi.success(`提交成功：${JSON.stringify(values)}`);
            return true;
          }}
          submitter={{
            render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>,
          }}
        >
          <ProFormText
            name="title"
            label="标题"
            width="md"
            rules={[{ required: true, message: '请输入标题' }]}
            placeholder="给目标起个名字"
          />
          <ProFormDatePicker name="date" label="起止日期" width="md" />
          <ProFormSelect
            name="goal"
            label="目标"
            width="md"
            options={[
              { label: '提升转化', value: 'conversion' },
              { label: '扩大覆盖', value: 'coverage' },
            ]}
            rules={[{ required: true, message: '请选择目标' }]}
          />
          <ProFormTextArea
            name="desc"
            label="目标描述"
            width="xl"
            placeholder="请输入你的阶段性工作目标"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default BasicForm;
