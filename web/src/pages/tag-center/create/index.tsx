import {
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Form, Input, Modal, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { colorForGroup, useTagCatalog } from '@/components/Tagging';
import type { PreviewSample, TagRule, TagRuleConditions } from '@/utils/tagRuleTypes';
import {
  emptyTagRuleConditions,
  summarizeDimFilters,
} from '@/utils/tagRuleTypes';
import { pageHeader } from '@/utils/pageHeader';
import { useAllowedCenters } from '@/utils/useAllowedCenters';
import TagRuleConditionsEditor from '../components/TagRuleConditionsEditor';

function downloadCsv(filename: string, rows: PreviewSample[]) {
  const header = ['OneID', '会员ID', '姓名', '手机', '分中心', '来源'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.oneId || '',
        r.memberId,
        r.name,
        r.phoneMasked,
        (r.centers || []).join('|'),
        `"${(r.source || '').replace(/"/g, '""')}"`,
      ].join(','),
    ),
  ];
  const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TagCreatePage: React.FC = () => {
  const params = useParams<{ group?: string; tag?: string }>();
  const isEdit = Boolean(params.group && params.tag);
  const editGroup = params.group ? decodeURIComponent(params.group) : '';
  const editTag = params.tag ? decodeURIComponent(params.tag) : '';

  const { getCatalog, addGroup, renameGroup, deleteGroup, addTag } = useTagCatalog();
  const catalog = getCatalog('customer');
  const { options: centerOptions } = useAllowedCenters();
  const groupOptions = useMemo(
    () => catalog.map((g) => ({ label: g.group, value: g.group })),
    [catalog],
  );

  const [category, setCategory] = useState(editGroup || groupOptions[0]?.value || '客户价值');
  const [tagName, setTagName] = useState(editTag || '');
  const [tagNameError, setTagNameError] = useState<string>();
  const [remark, setRemark] = useState('');
  const [centers, setCenters] = useState<string[]>(
    centerOptions.length ? [centerOptions[0].value] : [],
  );
  const [ruleId, setRuleId] = useState<string>();
  const [conditions, setConditions] = useState<TagRuleConditions>(emptyTagRuleConditions());
  const [previewCount, setPreviewCount] = useState<number>();
  const [samples, setSamples] = useState<PreviewSample[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{
    mode: 'add' | 'edit';
    open: boolean;
    name: string;
  }>({ mode: 'add', open: false, name: '' });

  const checkTagNameDup = (raw: string) => {
    const n = raw.trim();
    if (!n || isEdit) {
      setTagNameError(undefined);
      return false;
    }
    const dup = catalog.some((g) => g.tags.includes(n));
    setTagNameError(dup ? '标签名称已存在，请换一个名称' : undefined);
    return dup;
  };

  const resolvedCategory = category;

  const sqlRows = useMemo(() => {
    const dimRows = summarizeDimFilters(conditions);
    return centers.flatMap((center) =>
      dimRows.map((d) => ({
        key: `${center}-${d.dim}`,
        center,
        dim: d.dim,
        summary: d.summary,
      })),
    );
  }, [centers, conditions]);

  useEffect(() => {
    if (!centers.length && centerOptions.length) {
      setCenters([centerOptions[0].value]);
    }
  }, [centerOptions, centers.length]);

  useEffect(() => {
    if (!isEdit) return;
    request<{ data: TagRule[] }>('/api/tag-center/rules', {
      params: { current: 1, pageSize: 100 },
    }).then((res) => {
      const hit = (res.data || []).find(
        (r) => r.targetTag.group === editGroup && r.targetTag.tag === editTag,
      );
      if (hit) {
        setRuleId(hit.id);
        setRemark(`规则：${hit.name}`);
        if (hit.centers?.length) setCenters(hit.centers);
        setConditions({
          ...emptyTagRuleConditions(),
          ...hit.conditions,
          member: hit.conditions?.member || emptyTagRuleConditions().member,
          order: hit.conditions?.order || emptyTagRuleConditions().order,
          product: hit.conditions?.product || emptyTagRuleConditions().product,
          combo: hit.conditions?.combo || emptyTagRuleConditions().combo,
          campaign: hit.conditions?.campaign || emptyTagRuleConditions().campaign,
          coupon: hit.conditions?.coupon || emptyTagRuleConditions().coupon,
          points: hit.conditions?.points || emptyTagRuleConditions().points,
          storedValue: hit.conditions?.storedValue || emptyTagRuleConditions().storedValue,
          userBehavior: hit.conditions?.userBehavior || emptyTagRuleConditions().userBehavior,
        });
      }
    });
  }, [isEdit, editGroup, editTag]);

  const doPreview = async () => {
    const res = await request<{ data: { count: number; samples: PreviewSample[] } }>(
      '/api/tag-center/rules/preview',
      { method: 'POST', data: { conditions, centers } },
    );
    setPreviewCount(res.data?.count);
    setSamples(res.data?.samples || []);
  };

  const handleFinish = async () => {
    if (!resolvedCategory) {
      message.warning('请选择分类');
      return false;
    }
    if (!tagName.trim()) {
      message.warning('请填写标签名称');
      return false;
    }
    setSubmitting(true);
    try {
      if (!isEdit) {
        const err = addTag('customer', resolvedCategory, tagName.trim());
        if (err) {
          message.error(err);
          return false;
        }
      }
      const targetTag = {
        group: isEdit ? editGroup : resolvedCategory,
        tag: isEdit ? editTag : tagName.trim(),
      };
      const ruleName = `${targetTag.tag}打标规则`;
      let currentRuleId = ruleId;
      if (currentRuleId) {
        await request(`/api/tag-center/rules/${currentRuleId}`, {
          method: 'PUT',
          data: { name: ruleName, targetTag, conditions, centers, enabled: true },
        });
      } else {
        const saveRes = await request<{
          success: boolean;
          data?: TagRule;
          errorMessage?: string;
        }>('/api/tag-center/rules', {
          method: 'POST',
          data: { name: ruleName, targetTag, conditions, centers, enabled: true },
        });
        if (saveRes?.success === false) {
          message.error(saveRes.errorMessage || '保存失败');
          return false;
        }
        currentRuleId = saveRes.data?.id;
      }
      if (currentRuleId) {
        const runRes = await request<{
          success: boolean;
          errorMessage?: string;
          data?: { count: number };
        }>(`/api/tag-center/rules/${currentRuleId}/run`, { method: 'POST' });
        if (runRes?.success === false) {
          message.error(runRes.errorMessage || '打标失败');
          return false;
        }
        message.success(`已保存并打标（${runRes.data?.count ?? 0} 人）`);
      } else {
        message.success('已保存');
      }
      history.push('/tag-center/list');
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  const openAddCategory = () => setCategoryModal({ mode: 'add', open: true, name: '' });
  const openEditCategory = () => {
    if (!category) {
      message.warning('请先选择要编辑的分类');
      return;
    }
    setCategoryModal({ mode: 'edit', open: true, name: category });
  };
  const submitCategoryModal = () => {
    const name = categoryModal.name.trim();
    if (!name) {
      message.warning('请输入分类名');
      return;
    }
    if (categoryModal.mode === 'add') {
      const err = addGroup('customer', name);
      if (err) {
        message.error(err);
        return;
      }
      setCategory(name);
      message.success('已新增分类');
    } else {
      const err = renameGroup('customer', category, name);
      if (err) {
        message.error(err);
        return;
      }
      setCategory(name);
      message.success('已修改分类');
    }
    setCategoryModal((s) => ({ ...s, open: false }));
  };
  const handleDeleteCategory = () => {
    if (!category) {
      message.warning('请先选择分类');
      return;
    }
    const remain = catalog.filter((g) => g.group !== category);
    Modal.confirm({
      title: `删除分类「${category}」？`,
      content: '仅允许删除空分类（无下属标签）。',
      onOk: () => {
        const err = deleteGroup('customer', category);
        if (err) {
          message.error(err);
          return;
        }
        setCategory(remain[0]?.group || '');
        message.success('已删除分类');
      },
    });
  };

  return (
    <PageContainer
      {...pageHeader({
        title: isEdit ? '编辑标签' : '新建标签',
        backTo: '/tag-center/list',
        crumbs: [
          { title: '数据打标', path: '/tag-center/list' },
          { title: '人群标签', path: '/tag-center/list' },
          { title: isEdit ? '编辑标签' : '新建标签' },
        ],
      })}
    >
      <StepsForm
        onFinish={handleFinish}
        containerStyle={{ width: '100%', maxWidth: '100%' }}
        style={{ width: '100%' }}
        stepsFormRender={(dom, submitter) => (
          <div style={{ width: '100%' }}>
            {dom}
            <div
              style={{
                marginTop: 24,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {submitter}
            </div>
          </div>
        )}
        submitter={{
          render: (props) => {
            const { step, onPre, onSubmit } = props;
            return (
              <Space>
                {step > 0 ? <Button onClick={() => onPre?.()}>上一步</Button> : null}
                {step < 2 ? (
                  <Button type="primary" onClick={() => props.onSubmit?.()}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" loading={submitting} onClick={() => onSubmit?.()}>
                    确认打标
                  </Button>
                )}
                {step === 1 ? (
                  <Button onClick={() => setSqlOpen(true)}>预览 SQL</Button>
                ) : null}
                <Button onClick={() => history.push('/tag-center/list')}>取消</Button>
              </Space>
            );
          },
        }}
      >
        <StepsForm.StepForm
          name="basic"
          title="标签信息"
          stepProps={{ description: '名称与分类' }}
          style={{ width: '100%' }}
          initialValues={{
            category: editGroup || groupOptions[0]?.value,
            tagName: editTag || '',
            remark: '',
            centers: centerOptions[0] ? [centerOptions[0].value] : [],
          }}
          onFinish={async (values) => {
            const cat = String(values.category || category || '').trim();
            const name = String(values.tagName || tagName || '').trim();
            if (!name) {
              message.warning('请填写标签名称');
              return false;
            }
            if (!cat) {
              message.warning('请选择分类');
              return false;
            }
            if (!isEdit) {
              if (checkTagNameDup(name)) {
                message.error('标签名称已存在，请换一个名称');
                return false;
              }
            }
            const nextCenters = (values.centers as string[]) || centers;
            if (!nextCenters?.length) {
              message.warning('请选择分中心');
              return false;
            }
            setCategory(cat);
            setTagName(name);
            setRemark(String(values.remark || ''));
            setCenters(nextCenters);
            return true;
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '100%', maxWidth: 520 }}>
              <Form.Item
                label="标签名称"
                required
                validateStatus={tagNameError ? 'error' : undefined}
                help={tagNameError || undefined}
              >
                <Input
                  value={tagName}
                  placeholder="如：沉睡召回"
                  disabled={isEdit}
                  status={tagNameError ? 'error' : undefined}
                  allowClear
                  onChange={(e) => {
                    const v = e.target.value;
                    setTagName(v);
                    checkTagNameDup(v);
                  }}
                  onBlur={() => checkTagNameDup(tagName)}
                  style={{ maxWidth: 328 }}
                />
              </Form.Item>
              {/* 同步到 StepsForm 校验用 */}
              <ProFormText name="tagName" hidden initialValue={tagName} fieldProps={{ value: tagName }} />
              <ProFormSelect
                name="centers"
                label="分中心"
                options={centerOptions}
                rules={[{ required: true, message: '请选择分中心' }]}
                width="md"
                fieldProps={{
                  mode: 'multiple',
                  placeholder: centerOptions.length ? '请选择分中心' : '当前角色未配置分中心权限',
                  value: centers,
                  onChange: (v: string[]) => setCenters(v || []),
                  disabled: !centerOptions.length,
                }}
                extra="选项来自角色「数据权限 · 分中心」；可多选"
              />
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 8 }}>
                  <Typography.Text>
                    分类 <Typography.Text type="danger">*</Typography.Text>
                  </Typography.Text>
                </div>
                <Space wrap align="center">
                  <ProFormSelect
                    name="category"
                    noStyle
                    options={groupOptions}
                    disabled={isEdit}
                    rules={[{ required: true, message: '请选择分类' }]}
                    width="md"
                    fieldProps={{
                      value: category,
                      onChange: (v: string) => setCategory(v),
                      placeholder: '请选择分类',
                      style: { width: 280 },
                    }}
                  />
                  {!isEdit ? (
                    <Space size={8} wrap={false}>
                      <Button onClick={openAddCategory}>新增分类</Button>
                      <Button onClick={openEditCategory}>编辑分类</Button>
                      <Button danger onClick={handleDeleteCategory}>
                        删除分类
                      </Button>
                    </Space>
                  ) : null}
                </Space>
              </div>
              <ProFormTextArea
                name="remark"
                label="说明"
                placeholder="可选"
                fieldProps={{ rows: 3, value: remark, onChange: (e) => setRemark(e.target.value) }}
                width="xl"
              />
            </div>
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm
          name="rule"
          title="打标规则"
          stepProps={{ description: '按维度筛人' }}
          style={{ width: '100%', maxWidth: '100%' }}
          onFinish={async () => {
            if (!centers.length) {
              message.warning('请先在标签信息中选择分中心');
              return false;
            }
            message.loading({ content: '正在按分中心向数据中台下发筛选…', key: 'mid', duration: 0 });
            await new Promise((r) => setTimeout(r, 400));
            await doPreview();
            message.success({ content: '中台已返回预估结果', key: 'mid' });
            return true;
          }}
        >
          <div style={{ width: '100%' }}>
            <TagRuleConditionsEditor value={conditions} onChange={setConditions} />
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm name="preview" title="预览确认" stepProps={{ description: '确认打标' }}>
          <Typography.Paragraph>
            标签：
            <Tag
              color={colorForGroup(isEdit ? editGroup : resolvedCategory, catalog)}
              style={{ marginInline: 8 }}
            >
              {isEdit ? editTag : tagName}
            </Tag>
            分类：
            <Typography.Text strong>{isEdit ? editGroup : resolvedCategory}</Typography.Text>
            <span style={{ marginLeft: 12 }}>
              分中心：
              <Typography.Text strong>{centers.join('、') || '--'}</Typography.Text>
            </span>
            <Button type="link" onClick={doPreview}>
              刷新预估
            </Button>
            <Button
              type="link"
              disabled={!samples.length}
              onClick={() => downloadCsv(`${tagName || '标签'}-预览.csv`, samples)}
            >
              导出
            </Button>
          </Typography.Paragraph>
          <Typography.Paragraph>
            预估人数：<Typography.Text strong>{previewCount ?? '—'}</Typography.Text>
          </Typography.Paragraph>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={samples}
            columns={[
              { title: '人员 OneID', dataIndex: 'oneId', width: 160 },
              { title: '会员ID', dataIndex: 'memberId', width: 100 },
              { title: '姓名', dataIndex: 'name', width: 80 },
              { title: '手机', dataIndex: 'phoneMasked', width: 120 },
              {
                title: '分中心',
                dataIndex: 'centers',
                width: 120,
                render: (v: string[]) => (v || []).join('、') || '--',
              },
              { title: '来源', dataIndex: 'source', ellipsis: true },
            ]}
            locale={{ emptyText: '进入本步时已预估；也可点「刷新预估」' }}
          />
        </StepsForm.StepForm>
      </StepsForm>

      <Modal
        title="预览 SQL（说明清单）"
        open={sqlOpen}
        onCancel={() => setSqlOpen(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setSqlOpen(false)}>
            知道了
          </Button>,
        ]}
        width={720}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          将按分中心 + 维度条件以 SQL 形式访问数据中台筛选。
        </Typography.Paragraph>
        <Tabs
          items={(centers.length ? centers : ['未选分中心']).map((center) => ({
            key: center,
            label: center,
            children: (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={sqlRows.filter((r) => r.center === center)}
                columns={[
                  { title: '维度', dataIndex: 'dim', width: 160 },
                  { title: '筛选条件', dataIndex: 'summary', ellipsis: true },
                ]}
                locale={{ emptyText: '该分中心暂无维度条件摘要' }}
              />
            ),
          }))}
        />
      </Modal>

      <Modal
        title={categoryModal.mode === 'add' ? '新增分类' : '编辑分类'}
        open={categoryModal.open}
        onCancel={() => setCategoryModal((s) => ({ ...s, open: false }))}
        onOk={submitCategoryModal}
        destroyOnHidden
      >
        <Input
          placeholder="分类名称"
          value={categoryModal.name}
          onChange={(e) => setCategoryModal((s) => ({ ...s, name: e.target.value }))}
          maxLength={20}
        />
      </Modal>
    </PageContainer>
  );
};

export default TagCreatePage;
