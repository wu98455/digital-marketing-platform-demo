import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Space, Statistic, message } from 'antd';
import React, { useState } from 'react';

const CrowdCreate: React.FC = () => {
  const [estimate, setEstimate] = useState<number>();

  return (
    <PageContainer
      title={false}
      onBack={() => history.push('/customer-asset/crowd/custom')}
    >
      <ProCard title="人群工坊" bordered>
        <ProForm
          layout="vertical"
          submitter={{
            render: (_, dom) => (
              <Space>
                <Button onClick={() => history.push('/customer-asset/crowd/custom')}>返回列表</Button>
                <Button
                  onClick={() => {
                    setEstimate(Math.floor(800 + Math.random() * 12000));
                    message.success('已估算人数');
                  }}
                >
                  估算人数
                </Button>
                {dom}
              </Space>
            ),
          }}
          onFinish={async () => {
            message.success('人群已保存（演示）');
            history.push('/customer-asset/crowd/custom');
            return true;
          }}
        >
          <ProFormText
            name="name"
            label="人群名称"
            rules={[{ required: true, message: '请输入人群名称' }]}
            width="md"
          />
          <ProFormSelect
            name="catalog"
            label="所属目录"
            width="md"
            options={[
              { label: '文旅人群', value: '文旅人群' },
              { label: '业务目录', value: '业务目录' },
              { label: '未分类', value: '未分类' },
            ]}
            rules={[{ required: true }]}
          />
          <ProFormSelect
            name="tags"
            label="标签条件（组内且）"
            mode="multiple"
            width="md"
            options={[
              { label: '高价值', value: '高价值' },
              { label: '新客', value: '新客' },
              { label: '沉默', value: '沉默' },
              { label: '大会员', value: '大会员' },
            ]}
          />
          <ProFormSelect
            name="behaviors"
            label="行为条件（组内且）"
            mode="multiple"
            width="md"
            options={[
              { label: '近90天有互动', value: '近90天有互动' },
              { label: '近2年有订单', value: '近2年有订单' },
              { label: '近90天领券', value: '近90天领券' },
            ]}
          />
          <ProFormTextArea name="remark" label="备注" width="lg" />
          {estimate != null && (
            <Statistic title="估算人数" value={estimate} style={{ marginBottom: 16 }} />
          )}
        </ProForm>
      </ProCard>
    </PageContainer>
  );
};

export default CrowdCreate;
