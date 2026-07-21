import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  DrawerForm,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Alert, Button, Card, Col, Modal, Row, Space, Tree, Upload, message } from 'antd';
import React, { useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type TagItem = {
  id: string;
  name: string;
  type: string;
  group: string;
  desc?: string;
  valid?: string;
  perm?: string;
  taggedCount: number;
  creator: string;
  createdAt: string;
};

type ImportBatchItem = {
  id: string;
  batchNo: string;
  level: string;
  platform: string;
  store: string;
  group: string;
  matchKey: string;
  status: string;
  successCount: number;
  failCount: number;
  createdAt: string;
};

const treeData = [
  {
    title: '全部',
    key: '全部',
    children: [
      { title: '测试平台', key: '测试平台' },
      { title: '惠游重庆', key: '惠游重庆' },
      { title: '国企优品', key: '国企优品' },
      { title: '重庆文旅集团大会员', key: '重庆文旅集团大会员' },
    ],
  },
];

const ShopTagPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const importActionRef = useRef<ActionType | null>(null);
  const [group, setGroup] = useState('全部');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TagItem[]>([]);
  const [currentRow, setCurrentRow] = useState<TagItem>();
  const [templateKey, setTemplateKey] = useState<string>('mother');

  const groupOptions = ['测试平台', '惠游重庆', '国企优品', '重庆文旅集团大会员'];

  const columns: ProColumns<TagItem>[] = [
    { title: '标签ID', dataIndex: 'tagId', hideInTable: true },
    { title: '标签名称', dataIndex: 'tagName', hideInTable: true },
    {
      title: '标签类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        手工标签: { text: '手工标签' },
        规则标签: { text: '规则标签' },
      },
    },
    { title: '创建人', dataIndex: 'creatorSearch', hideInTable: true },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
      search: {
        transform: (value) => ({ createdStart: value?.[0], createdEnd: value?.[1] }),
      },
    },
    { title: '标签ID', dataIndex: 'id', search: false, width: 100 },
    { title: '标签名称', dataIndex: 'name', search: false },
    { title: '类型', dataIndex: 'type', search: false, width: 100 },
    { title: '分组', dataIndex: 'group', search: false, width: 120 },
    { title: '已打标人数', dataIndex: 'taggedCount', search: false, width: 110 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 110 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      search: false,
      render: (_, row) => [
        <a
          key="view"
          onClick={() => {
            setCurrentRow(row);
            setDetailOpen(true);
          }}
        >
          查看
        </a>,
        <a
          key="move"
          onClick={() => {
            setCurrentRow(row);
            setMoveOpen(true);
          }}
        >
          改分组
        </a>,
        <a
          key="del"
          onClick={() =>
            Modal.confirm({
              title: '确认删除？',
              onOk: () => message.success('已删除（演示）'),
            })
          }
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          className="panel-surface"
          style={{
            width: 220,
            padding: '16px 12px',
          }}
        >
          <Space direction="vertical" style={{ width: '100%', marginBottom: 8 }}>
            <Button block type="primary" onClick={() => setSubscribeOpen(true)}>
              订阅行业标签模板
            </Button>
            <Button block onClick={() => setGroupOpen(true)}>
              新建分组
            </Button>
          </Space>
          <Tree.DirectoryTree
            defaultExpandAll
            treeData={treeData}
            selectedKeys={[group]}
            onSelect={(keys) => {
              if (keys[0]) {
                setGroup(String(keys[0]));
                actionRef.current?.reload();
              }
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProTable<TagItem>
            headerTitle="店铺标签"
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            search={listSearchProps}
            pagination={listPagination}
            rowSelection={{
              onChange: (_, rows) => setSelectedRows(rows),
            }}
            toolBarRender={() => [
              <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
                新建标签
              </Button>,
              <Button key="import" onClick={() => setImportOpen(true)}>
                导入客户
              </Button>,
              <Button key="records" onClick={() => setRecordsOpen(true)}>
                导入记录
              </Button>,
              <Button
                key="batchDelete"
                disabled={!selectedRows.length}
                onClick={() =>
                  Modal.confirm({
                    title: `确认删除已选 ${selectedRows.length} 个标签？`,
                    onOk: () => {
                      message.success('已批量删除（演示）');
                      setSelectedRows([]);
                      actionRef.current?.reload();
                    },
                  })
                }
              >
                批量删除
              </Button>,
              <Button key="refresh" onClick={() => actionRef.current?.reload()}>
                刷新
              </Button>,
            ]}
            request={async (params) =>
              request('/api/customer-asset/tags/shop', { params: { ...params, group } })
            }
          />
        </div>
      </div>

      <ModalForm
        title="新建标签"
        open={createOpen}
        onOpenChange={setCreateOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success('已创建（演示）');
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="标签名称" rules={[{ required: true }]} />
        <ProFormTextArea name="desc" label="描述" />
        <ProFormSelect
          name="group"
          label="标签分组"
          options={groupOptions.map((item) => ({ label: item, value: item }))}
          initialValue={group !== '全部' ? group : undefined}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="type"
          label="类型"
          options={[
            { label: '手工标签', value: '手工标签' },
            { label: '规则标签', value: '规则标签' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="valid" label="有效期" placeholder="如：永久 / 2026-12-31" />
        <ProFormSelect
          name="perm"
          label="权限控制"
          options={[
            { label: '仅自己', value: 'self' },
            { label: '本部门', value: 'dept' },
            { label: '全员', value: 'all' },
          ]}
        />
      </ModalForm>

      <DrawerForm
        title="标签详情"
        open={detailOpen}
        onOpenChange={setDetailOpen}
        submitter={false}
      >
        <ProDescriptions column={2}>
          <ProDescriptions.Item label="标签ID">{currentRow?.id}</ProDescriptions.Item>
          <ProDescriptions.Item label="标签名称">{currentRow?.name}</ProDescriptions.Item>
          <ProDescriptions.Item label="标签类型">{currentRow?.type}</ProDescriptions.Item>
          <ProDescriptions.Item label="所属分组">{currentRow?.group}</ProDescriptions.Item>
          <ProDescriptions.Item label="已打标人数">{currentRow?.taggedCount}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建人">{currentRow?.creator}</ProDescriptions.Item>
          <ProDescriptions.Item label="创建时间">{currentRow?.createdAt}</ProDescriptions.Item>
          <ProDescriptions.Item label="权限控制">{currentRow?.perm || '--'}</ProDescriptions.Item>
          <ProDescriptions.Item label="有效期">{currentRow?.valid || '--'}</ProDescriptions.Item>
          <ProDescriptions.Item label="描述" span={2}>
            {currentRow?.desc || '--'}
          </ProDescriptions.Item>
        </ProDescriptions>
      </DrawerForm>

      <ModalForm
        title="修改分组"
        open={moveOpen}
        onOpenChange={setMoveOpen}
        initialValues={{ group: currentRow?.group }}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success(`已将「${currentRow?.name}」移至新分组（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText name="name" label="标签名称" initialValue={currentRow?.name} disabled />
        <ProFormSelect
          name="group"
          label="目标分组"
          options={groupOptions.map((item) => ({ label: item, value: item }))}
          rules={[{ required: true }]}
        />
      </ModalForm>

      <ModalForm
        title="导入客户"
        open={importOpen}
        onOpenChange={setImportOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async () => {
          message.success('已提交导入（演示）');
          return true;
        }}
      >
        <ProFormSelect
          name="level"
          label="标签层级"
          options={[{ label: '店铺标签', value: '店铺标签' }]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="platform"
          label="平台"
          options={[
            { label: '全部平台', value: '全部平台' },
            { label: '测试平台', value: '测试平台' },
            { label: '惠游重庆', value: '惠游重庆' },
          ]}
        />
        <ProFormSelect
          name="group"
          label="分组"
          options={groupOptions.map((item) => ({ label: item, value: item }))}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="matchKey"
          label="匹配标识"
          options={[
            { label: '手机号', value: '手机号' },
            { label: '全渠道客户ID', value: '全渠道客户ID' },
            { label: '平台账号', value: '平台账号' },
          ]}
        />
        <a style={{ display: 'inline-block', marginBottom: 12 }}>下载模板</a>
        <Upload beforeUpload={() => false} maxCount={1} accept=".csv">
          <Button>上传 CSV（≤10MB）</Button>
        </Upload>
      </ModalForm>

      <DrawerForm
        title="导入记录"
        open={recordsOpen}
        onOpenChange={setRecordsOpen}
        width={960}
        submitter={false}
      >
        <ProTable<ImportBatchItem>
          actionRef={importActionRef}
          rowKey="id"
          search={false}
          options={false}
          pagination={listPagination}
          columns={[
            { title: '批次号', dataIndex: 'batchNo', width: 150 },
            { title: '标签层级', dataIndex: 'level', width: 100 },
            { title: '平台', dataIndex: 'platform', width: 100 },
            { title: '店铺', dataIndex: 'store', width: 100 },
            { title: '分组', dataIndex: 'group', width: 100 },
            { title: '匹配标识', dataIndex: 'matchKey', width: 120 },
            { title: '状态', dataIndex: 'status', width: 80 },
            { title: '成功数', dataIndex: 'successCount', width: 80 },
            { title: '失败数', dataIndex: 'failCount', width: 80 },
            { title: '导入时间', dataIndex: 'createdAt', width: 160 },
          ]}
          request={async (params) =>
            request('/api/customer-asset/tags/import', {
              params: { ...params, level: '店铺标签' },
            })
          }
          toolBarRender={() => [
            <Button key="refresh" onClick={() => importActionRef.current?.reload()}>
              刷新
            </Button>,
          ]}
        />
      </DrawerForm>

      <ModalForm
        title="新建分组"
        open={groupOpen}
        onOpenChange={setGroupOpen}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          message.success(`已新增分组「${values.name}」（演示）`);
          return true;
        }}
      >
        <ProFormText name="name" label="分组名称" rules={[{ required: true }]} />
        <ProFormSelect
          name="parent"
          label="上级目录"
          options={[
            { label: '全部', value: '全部' },
            ...groupOptions.map((item) => ({ label: item, value: item })),
          ]}
          initialValue="全部"
        />
      </ModalForm>

      <ModalForm
        title="订阅行业标签模板"
        open={subscribeOpen}
        onOpenChange={(open) => {
          setSubscribeOpen(open);
          if (open) setTemplateKey('mother');
        }}
        width={720}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const templateName = templateKey === 'mother' ? '母婴行业' : '花鸟宠物行业';
          message.success(`已订阅「${templateName}」模板至平台「${values.platform}」（演示）`);
          actionRef.current?.reload();
          return true;
        }}
      >
        <Alert
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
          message={
            <div style={{ lineHeight: 1.8 }}>
              <div>
                1.行业标签是针对特定行业定制的标签。商户订阅后，系统将创建对应标签分组和标签，可在人群圈选-人群工坊、客户视图中使用。
              </div>
              <div>2.商户可在系统内置的行业标签基础上，自行创建标签，完善行业标签模板。</div>
              <div>
                3.暂不支持取消订阅。取消订阅会删除该模板对应的所有标签，同时从所有客户身上删除标签，可能影响线上营销策略，故暂不支持。
              </div>
            </div>
          }
        />
        <ProFormSelect
          name="platform"
          label="平台"
          options={[
            { label: '测试平台', value: '测试平台' },
            { label: '惠游重庆', value: '惠游重庆' },
            { label: '国企优品', value: '国企优品' },
            { label: '重庆文旅集团大会员', value: '重庆文旅集团大会员' },
          ]}
          initialValue="测试平台"
          rules={[{ required: true, message: '请选择平台' }]}
        />
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
          选择模板
        </div>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={12}>
            <Card
              hoverable
              size="small"
              onClick={() => setTemplateKey('mother')}
              style={{
                borderColor: templateKey === 'mother' ? '#1677ff' : undefined,
                background: templateKey === 'mother' ? '#e6f4ff' : undefined,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>母婴行业</div>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, lineHeight: 1.6 }}>
                内置孕期、宝宝档案类标签。可根据预产期自动计算宝宝年龄/孕期阶段，适用于内容关怀营销。
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              hoverable
              size="small"
              onClick={() => setTemplateKey('pet')}
              style={{
                borderColor: templateKey === 'pet' ? '#1677ff' : undefined,
                background: templateKey === 'pet' ? '#e6f4ff' : undefined,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>花鸟宠物行业</div>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, lineHeight: 1.6 }}>
                内置宠物品种、生日等标签。可根据生日自动计算年龄/阶段，适用于宠物食品推荐营销。
              </div>
            </Card>
          </Col>
        </Row>
        <div style={{ color: 'rgba(0,0,0,0.45)', textAlign: 'center' }}>
          更多行业标签模板敬请期待
        </div>
      </ModalForm>
    </PageContainer>
  );
};

export default ShopTagPage;
