import { PageContainer, StepsForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Card, message, Result } from 'antd';
import React, { useState } from 'react';

const StepFormPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <PageContainer>
        <Card>
          <Result
            status="success"
            title="操作成功"
            subTitle="分步表单已提交，原型演示可用。"
          />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {contextHolder}
      <Card>
        <StepsForm
          onFinish={async () => {
            messageApi.success('提交成功');
            setDone(true);
            return true;
          }}
        >
          <StepsForm.StepForm title="填写信息">
            <ProFormText
              name="name"
              label="收款人姓名"
              width="md"
              rules={[{ required: true }]}
            />
            <ProFormText
              name="account"
              label="收款账号"
              width="md"
              rules={[{ required: true }]}
            />
          </StepsForm.StepForm>
          <StepsForm.StepForm title="确认信息">
            <ProFormSelect
              name="channel"
              label="支付渠道"
              width="md"
              options={[
                { label: '支付宝', value: 'alipay' },
                { label: '银行卡', value: 'bank' },
              ]}
              rules={[{ required: true }]}
            />
            <ProFormText name="amount" label="转账金额" width="md" rules={[{ required: true }]} />
          </StepsForm.StepForm>
          <StepsForm.StepForm title="完成">
            <ProFormText name="remark" label="备注" width="md" />
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </PageContainer>
  );
};

export default StepFormPage;
