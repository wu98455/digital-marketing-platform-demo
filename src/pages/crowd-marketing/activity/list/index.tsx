import type { ActionType, ProColumns, ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { history, request, useModel } from '@umijs/max';
import { Button, Checkbox, Dropdown, Modal, Space, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

/** 仅正式执行过的活动展示「执行结果」入口 */
const canViewExecResult = (status?: string) =>
  ['进行中', '已暂停', '已结束'].includes(status || '');

type ActivityItem = {
  id: string;
  name: string;
  status: string;
  catalog: string;
  creator: string;
  createdAt: string;
  periodic?: boolean;
  approver?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  pinned?: boolean;
};

type TemplateOption = { id: string; name: string };

type ApproverProfile = {
  allowSelfApprove: boolean;
  approvers: string[];
};

const DEFAULT_CATALOGS = ['文旅营销', '业务目录', '未分类'];
const PROTECTED = new Set(['未分类']);

const ActivityList: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const CURRENT_USER = initialState?.currentUser?.username || 'demo';
  const actionRef = useRef<ActionType | null>(null);
  const createFormRef = useRef<ProFormInstance>(undefined);
  const [catalogs, setCatalogs] = useState<string[]>(DEFAULT_CATALOGS);
  const [createOpen, setCreateOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [catalogFormOpen, setCatalogFormOpen] = useState(false);
  const [catalogFormMode, setCatalogFormMode] = useState<'create' | 'edit'>('create');
  const [editingCatalog, setEditingCatalog] = useState<string>();
  const [onlyPeriodic, setOnlyPeriodic] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [pendingApprove, setPendingApprove] = useState(false);
  const [selectedRows, setSelectedRows] = useState<ActivityItem[]>([]);
  const [templateOptions, setTemplateOptions] = useState<{ label: string; value: string }[]>([
    { label: '空白活动', value: 'blank' },
  ]);
  const [approvalSettings, setApprovalSettings] = useState<ApproverProfile>({
    allowSelfApprove: false,
    approvers: [],
  });

  const catalogOptions = useMemo(
    () => catalogs.map((name) => ({ label: name, value: name })),
    [catalogs],
  );

  const approverOptions = useMemo(
    () =>
      (approvalSettings.approvers || []).map((name) => ({
        label: name === CURRENT_USER ? `${name}（自己）` : name,
        value: name,
      })),
    [approvalSettings.approvers, CURRENT_USER],
  );

  const loadTemplates = async () => {
    const res = await request<{ data: TemplateOption[] }>('/api/crowd-marketing/templates/local', {
      params: { current: 1, pageSize: 100 },
    });
    const list = res.data || [];
    setTemplateOptions([
      { label: '空白活动', value: 'blank' },
      ...list.map((t) => ({ label: t.name, value: t.id })),
    ]);
  };

  const loadApprovalSettings = async () => {
    const res = await request<{
      data: { allowSelfApprove: boolean; approvers: string[] };
    }>(`/api/system/users/${CURRENT_USER}/approver-options`);
    if (res?.data) {
      setApprovalSettings({
        allowSelfApprove: !!res.data.allowSelfApprove,
        approvers: res.data.approvers || [],
      });
    }
  };

  useEffect(() => {
    loadApprovalSettings();
  }, [CURRENT_USER]);

  useEffect(() => {
    if (createOpen) {
      loadApprovalSettings();
      if (formMode === 'create') loadTemplates();
    }
  }, [createOpen, formMode]);

  const openCreateActivity = () => {
    setFormMode('create');
    setEditingActivity(null);
    setCreateOpen(true);
  };

  const openEditActivity = (row: ActivityItem) => {
    if (row.canEdit === false) {
      message.warning('当前活动不可编辑（演示）');
      return;
    }
    setFormMode('edit');
    setEditingActivity(row);
    setCreateOpen(true);
  };

  const openCreateCatalog = () => {
    setCatalogFormMode('create');
    setEditingCatalog(undefined);
    setCatalogFormOpen(true);
  };

  const openEditCatalog = (name?: string) => {
    const target = name;
    if (!target) {
      message.warning('请先选择要编辑的分类');
      return;
    }
    if (PROTECTED.has(target)) {
      message.warning('「未分类」为系统分类，不可编辑');
      return;
    }
    setCatalogFormMode('edit');
    setEditingCatalog(target);
    setCatalogFormOpen(true);
  };

  const removeCatalog = (name?: string) => {
    const target = name;
    if (!target) {
      message.warning('请先选择要删除的分类');
      return;
    }
    if (PROTECTED.has(target)) {
      message.warning('「未分类」为系统分类，不可删除');
      return;
    }
    Modal.confirm({
      title: `确认删除分类「${target}」？`,
      content: '该分类下的活动将归入「未分类」（演示）',
      onOk: () => {
        setCatalogs((prev) => prev.filter((x) => x !== target));
        if (createFormRef.current?.getFieldValue('category') === target) {
          createFormRef.current?.setFieldsValue({ category: '未分类' });
        }
        message.success('已删除分类（演示）');
        actionRef.current?.reload();
      },
    });
  };

  const handleApprove = async (row: ActivityItem) => {
    const res = await request<{ success: boolean; errorMessage?: string }>(
      `/api/crowd-marketing/activities/${row.id}/approve`,
      { method: 'POST', data: { currentUser: CURRENT_USER } },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '审批失败');
      return;
    }
    message.success('已通过审批');
    actionRef.current?.reload();
  };

  const handleReject = (row: ActivityItem) => {
    Modal.confirm({
      title: `驳回活动「${row.name}」？`,
      content: '驳回后活动回到已驳回状态，创建人可修改后重新提交。',
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string }>(
          `/api/crowd-marketing/activities/${row.id}/reject`,
          { method: 'POST', data: { currentUser: CURRENT_USER } },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '驳回失败');
          return;
        }
        message.success('已驳回');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<ActivityItem>[] = [
    { title: '活动名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '状态',
      dataIndex: 'statusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        草稿: { text: '草稿' },
        待审批: { text: '待审批' },
        已通过: { text: '已通过' },
        已驳回: { text: '已驳回' },
        进行中: { text: '进行中' },
        已暂停: { text: '已暂停' },
        已结束: { text: '已结束' },
      },
    },
    {
      title: '分类',
      dataIndex: 'catalogSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: {
        全部: { text: '全部' },
        ...Object.fromEntries(catalogs.map((c) => [c, { text: c }])),
      },
    },
    { title: '创建人', dataIndex: 'creatorSearch', hideInTable: true },
    {
      title: '是否周期活动',
      dataIndex: 'periodicSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '全部',
      valueEnum: { 全部: { text: '全部' }, 是: { text: '是' }, 否: { text: '否' } },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '活动ID', dataIndex: 'id', search: false, width: 110 },
    {
      title: '活动名称',
      dataIndex: 'name',
      search: false,
      width: 200,
      ellipsis: true,
      render: (_, row) => (
        <Space>
          {row.pinned ? <span style={{ color: '#faad14' }}>置顶</span> : null}
          <a onClick={() => history.push(`/crowd-marketing/activity/design/${row.id}`)}>
            {row.name}
          </a>
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', search: false, width: 90 },
    { title: '分类', dataIndex: 'catalog', search: false, width: 100 },
    {
      title: '周期活动',
      dataIndex: 'periodic',
      search: false,
      width: 90,
      render: (_, row) => (row.periodic ? '是' : '否'),
    },
    { title: '审批人', dataIndex: 'approver', search: false, width: 100 },
    { title: '创建人', dataIndex: 'creator', search: false, width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      search: false,
      fixed: 'right',
      render: (_, row) => {
        const canDecide = row.status === '待审批' && row.approver === CURRENT_USER;
        return (
          <div className="table-op-row">
            {canDecide ? (
              <>
                <a onClick={() => handleApprove(row)}>通过</a>
                <a onClick={() => handleReject(row)}>驳回</a>
              </>
            ) : null}
            <a
              className={row.canEdit === false ? 'disabled' : undefined}
              onClick={() => openEditActivity(row)}
            >
              编辑
            </a>
            {canViewExecResult(row.status) ? (
              <a onClick={() => history.push(`/crowd-marketing/activity/report/${row.id}`)}>
                执行结果
              </a>
            ) : null}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'pin',
                    label: row.pinned ? '取消置顶' : '置顶',
                    onClick: () =>
                      message.success(row.pinned ? '已取消置顶（演示）' : '已置顶（演示）'),
                  },
                  {
                    key: 'copy',
                    label: '复制',
                    onClick: () => message.success('已复制（演示）'),
                  },
                  {
                    key: 'export',
                    label: '导出',
                    onClick: () => message.success('已导出（演示）'),
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    danger: true,
                    disabled: row.canDelete === false,
                    onClick: () => {
                      if (row.canDelete === false) return;
                      Modal.confirm({
                        title: '确认删除该活动？',
                        onOk: () => {
                          message.success('已删除（演示）');
                          actionRef.current?.reload();
                        },
                      });
                    },
                  },
                ],
              }}
            >
              <a>更多</a>
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const defaultApprover = approverOptions[0]?.value;

  return (
    <PageContainer title={false}>
      <ProTable<ActivityItem>
        headerTitle="营销活动"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        scroll={{ x: 1200 }}
        rowSelection={{ onChange: (_, rows) => setSelectedRows(rows) }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={openCreateActivity}>
            新建活动
          </Button>,
          <Button
            key="batchDel"
            disabled={!selectedRows.length}
            onClick={() =>
              Modal.confirm({
                title: `确认删除已选 ${selectedRows.length} 个活动？`,
                onOk: () => {
                  message.success('已批量删除（演示）');
                  actionRef.current?.reload();
                },
              })
            }
          >
            批量删除
          </Button>,
          <Button
            key="batchExport"
            disabled={!selectedRows.length}
            onClick={() => message.success('已批量导出（演示）')}
          >
            批量导出
          </Button>,
          <Checkbox
            key="periodic"
            checked={onlyPeriodic}
            onChange={(e) => {
              setOnlyPeriodic(e.target.checked);
              actionRef.current?.reload();
            }}
          >
            只看周期性活动
          </Checkbox>,
          <Checkbox
            key="mine"
            checked={onlyMine}
            onChange={(e) => {
              setOnlyMine(e.target.checked);
              actionRef.current?.reload();
            }}
          >
            只看我的活动
          </Checkbox>,
          <Checkbox
            key="approve"
            checked={pendingApprove}
            onChange={(e) => {
              setPendingApprove(e.target.checked);
              actionRef.current?.reload();
            }}
          >
            待我审批
          </Checkbox>,
        ]}
        request={async (params) =>
          request('/api/crowd-marketing/activities', {
            params: {
              ...params,
              keyword: params.keyword,
              status: params.statusSearch,
              catalog: params.catalogSearch,
              creator: params.creatorSearch,
              periodic:
                params.periodicSearch && params.periodicSearch !== '全部'
                  ? params.periodicSearch
                  : undefined,
              onlyPeriodic: onlyPeriodic ? 'true' : undefined,
              onlyMine: onlyMine ? 'true' : undefined,
              pendingApprove: pendingApprove ? 'true' : undefined,
              currentUser: CURRENT_USER,
            },
          })
        }
      />

      <ModalForm
        title={formMode === 'create' ? '新建活动' : '编辑活动'}
        formRef={createFormRef}
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditingActivity(null);
        }}
        modalProps={{ destroyOnHidden: true }}
        initialValues={
          formMode === 'edit' && editingActivity
            ? {
                name: editingActivity.name,
                category: editingActivity.catalog,
                target: '全渠道会员',
                approver: editingActivity.approver,
                balanceAlert: true,
                periodic: !!editingActivity.periodic,
                remark: '',
              }
            : {
                category: '未分类',
                target: '全渠道会员',
                approver: defaultApprover,
                balanceAlert: true,
                periodic: false,
                template: 'blank',
              }
        }
        onFinish={async (values) => {
          if (!values.approver) {
            message.error('请选择审批人');
            return false;
          }
          if (!approvalSettings.approvers.length) {
            message.error('请先在「系统管理 / 用户管理」为当前账号配置活动审批人');
            return false;
          }
          if (!approvalSettings.allowSelfApprove && values.approver === CURRENT_USER) {
            message.error('当前账号不允许自己审批，请选择其他审批人或在用户管理中开启');
            return false;
          }
          if (formMode === 'edit') {
            message.success(`已更新活动「${values.name}」（演示）`);
            actionRef.current?.reload();
            return true;
          }
          const res = await request<{ success: boolean; data?: ActivityItem; errorMessage?: string }>(
            '/api/crowd-marketing/activities',
            { method: 'POST', data: { ...values, currentUser: CURRENT_USER, creator: CURRENT_USER } },
          );
          if (res?.success === false) {
            message.error(res.errorMessage || '创建失败');
            return false;
          }
          message.success(`已创建活动「${values.name}」（演示）`);
          const tpl = values.template;
          if (tpl && tpl !== 'blank') {
            message.info('已套用模板（演示）');
          }
          actionRef.current?.reload();
          history.push(`/crowd-marketing/activity/design/${res.data?.id || 'ACT202600'}`);
          return true;
        }}
      >
        <ProFormText name="name" label="活动名称" rules={[{ required: true }]} />
        {formMode === 'create' ? (
          <ProFormSelect
            name="template"
            label="空版/活动模板"
            options={templateOptions}
            initialValue="blank"
            extra={
              <a
                onClick={(e) => {
                  e.preventDefault();
                  history.push('/crowd-marketing/template/local');
                }}
              >
                去营销活动模板管理
              </a>
            }
          />
        ) : null}
        <ProFormSelect
          name="category"
          label="分类"
          options={catalogOptions}
          rules={[{ required: true, message: '请选择分类' }]}
          extra={
            <Space size={12} style={{ marginTop: 4 }}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  openCreateCatalog();
                }}
              >
                新建分类
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  openEditCatalog(createFormRef.current?.getFieldValue('category'));
                }}
              >
                编辑分类
              </a>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  removeCatalog(createFormRef.current?.getFieldValue('category'));
                }}
              >
                删除分类
              </a>
            </Space>
          }
        />
        <ProFormSelect
          name="target"
          label="营销对象"
          options={[
            { label: '全渠道会员', value: '全渠道会员' },
            { label: '店铺会员', value: '店铺会员' },
          ]}
        />
        <ProFormSwitch name="periodic" label="周期性活动" />
        <ProFormSelect
          name="approver"
          label="审批人"
          options={approverOptions}
          rules={[{ required: true, message: '请选择审批人' }]}
          extra={
            <TypographyHint allowSelf={approvalSettings.allowSelfApprove} />
          }
        />
        <ProFormSwitch name="balanceAlert" label="余额不足提醒" initialValue />
        <ProFormTextArea name="remark" label="备注" />
      </ModalForm>

      <ModalForm
        title={catalogFormMode === 'create' ? '新建分类' : '编辑分类'}
        open={catalogFormOpen}
        onOpenChange={setCatalogFormOpen}
        modalProps={{ destroyOnHidden: true }}
        initialValues={{ name: editingCatalog }}
        onFinish={async (values) => {
          const name = String(values.name || '').trim();
          if (!name) {
            message.error('请输入分类名称');
            return false;
          }
          if (catalogFormMode === 'create') {
            if (catalogs.includes(name)) {
              message.error('分类已存在');
              return false;
            }
            setCatalogs((prev) => [...prev, name]);
            message.success(`已新建分类「${name}」（演示）`);
          } else if (editingCatalog) {
            if (name !== editingCatalog && catalogs.includes(name)) {
              message.error('分类已存在');
              return false;
            }
            setCatalogs((prev) => prev.map((x) => (x === editingCatalog ? name : x)));
            if (createFormRef.current?.getFieldValue('category') === editingCatalog) {
              createFormRef.current?.setFieldsValue({ category: name });
            }
            message.success(`已更新分类为「${name}」（演示）`);
          }
          return true;
        }}
      >
        <ProFormText
          name="name"
          label="分类名称"
          rules={[{ required: true, message: '请输入分类名称' }]}
          placeholder="如：节庆营销"
        />
      </ModalForm>
    </PageContainer>
  );
};

const TypographyHint: React.FC<{ allowSelf: boolean }> = ({ allowSelf }) => (
  <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
    {allowSelf
      ? '审批人来自当前账号在「用户管理」中的配置；可选自己，仍须提交并通过'
      : '审批人来自当前账号在「用户管理」中的配置；当前不允许自己审批'}
  </span>
);

export default ActivityList;
