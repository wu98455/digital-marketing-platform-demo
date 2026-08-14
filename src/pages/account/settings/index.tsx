import {
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useMemo, useState } from 'react';
import {
  demoChangePassword,
  demoUpdateProfile,
  getDemoUsername,
} from '@/utils/demoMock';
import { findUserByUsername, getRoleById } from '@/utils/systemAdminStore';

const AccountSettings: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const [messageApi, contextHolder] = message.useMessage();
  const [pwdKey, setPwdKey] = useState(0);
  const currentUser = initialState?.currentUser;
  const username = (currentUser as any)?.username || getDemoUsername() || 'demo';

  const accountMeta = useMemo(() => {
    const user = findUserByUsername(username);
    const role = user ? getRoleById(user.roleId) : getRoleById((currentUser as any)?.roleId);
    return { user, role };
  }, [username, currentUser]);

  return (
    <PageContainer
      title="个人设置"
      subTitle="管理基本资料、查看账号权限，并修改登录密码"
    >
      {contextHolder}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={88} src={currentUser?.avatar} icon={<UserOutlined />} />
              <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {currentUser?.name || username}
              </Typography.Title>
              <Typography.Text type="secondary">@{username}</Typography.Text>
              <div style={{ marginTop: 12 }}>
                <Space wrap size={[4, 8]} style={{ justifyContent: 'center' }}>
                  <Tag color="blue">{accountMeta.role?.name || currentUser?.title || '未分配角色'}</Tag>
                  <Tag color={accountMeta.user?.status === '停用' ? 'error' : 'success'}>
                    {accountMeta.user?.status || '启用'}
                  </Tag>
                </Space>
              </div>
            </div>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="角色说明">
                {accountMeta.role?.description || currentUser?.signature || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="数据权限">
                {(accountMeta.role?.centers || []).length
                  ? accountMeta.role!.centers.join('、')
                  : '未配置分中心'}
              </Descriptions.Item>
              <Descriptions.Item label="最近登录">
                {accountMeta.user?.lastLoginAt || '--'}
              </Descriptions.Item>
              <Descriptions.Item label="审批人">
                {(accountMeta.user?.approverIds || []).length
                  ? accountMeta.user!.approverIds.join('、')
                  : '--'}
              </Descriptions.Item>
              <Descriptions.Item label="允许自审">
                {accountMeta.user?.allowSelfApprove ? '是' : '否'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <UserOutlined />
                基本资料
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <ProForm
              key={`profile-${currentUser?.userid || username}-${currentUser?.name}`}
              layout="vertical"
              initialValues={{
                name: currentUser?.name,
                phone: currentUser?.phone,
                signature: currentUser?.signature,
              }}
              submitter={{
                searchConfig: { submitText: '保存资料' },
                resetButtonProps: { style: { display: 'none' } },
              }}
              onFinish={async (values) => {
                const res = await demoUpdateProfile(values);
                if (!res.success) {
                  messageApi.error(res.errorMessage || '保存失败');
                  return false;
                }
                setInitialState((s) => ({ ...s, currentUser: res.data }));
                messageApi.success('基本资料已保存');
                return true;
              }}
            >
              <ProFormText
                name="name"
                label="姓名"
                width="md"
                rules={[{ required: true, message: '请填写姓名' }]}
                fieldProps={{ maxLength: 32 }}
              />
              <ProFormText
                name="phone"
                label="手机号"
                width="md"
                rules={[
                  {
                    pattern: /^1\d{10}$|^0\d{2,3}-?\d{7,8}$/,
                    message: '请输入有效手机号或座机',
                  },
                ]}
              />
              <ProFormTextArea
                name="signature"
                label="个人简介"
                width="xl"
                fieldProps={{ rows: 3, maxLength: 120, showCount: true }}
                placeholder="一句话介绍你的职责，便于同事识别"
              />
            </ProForm>
          </Card>

          <Card
            title={
              <Space>
                <LockOutlined />
                安全设置
              </Space>
            }
          >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
              <SafetyCertificateOutlined style={{ marginRight: 6 }} />
              修改后立即生效；演示环境密码保存在本机用户表中。
            </Typography.Paragraph>
            <ProForm
              key={pwdKey}
              layout="vertical"
              submitter={{
                searchConfig: { submitText: '修改密码' },
                resetButtonProps: { style: { display: 'none' } },
              }}
              onFinish={async (values) => {
                const res = await demoChangePassword({
                  oldPassword: values.oldPassword,
                  newPassword: values.newPassword,
                });
                if (!res.success) {
                  messageApi.error(res.errorMessage || '修改失败');
                  return false;
                }
                messageApi.success('密码已更新，请牢记新密码');
                setPwdKey((k) => k + 1);
                return true;
              }}
            >
              <ProFormText.Password
                name="oldPassword"
                label="当前密码"
                width="md"
                rules={[{ required: true, message: '请输入当前密码' }]}
              />
              <ProFormText.Password
                name="newPassword"
                label="新密码"
                width="md"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '至少 6 位' },
                ]}
              />
              <ProFormText.Password
                name="confirmPassword"
                label="确认新密码"
                width="md"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请再次输入新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              />
            </ProForm>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AccountSettings;
