import {
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { history, request, useParams } from '@umijs/max';
import { Button, Form, Input, Modal, Space, Table, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useTagCatalog } from '@/components/Tagging';
import type { TagRule, TagRuleConditions } from '@/utils/tagRuleTypes';
import {
  emptyTagRuleConditions,
  hasAnyDimCondition,
  normalizeTagRuleConditions,
  summarizeDimFilters,
} from '@/utils/tagRuleTypes';
import { pageHeader } from '@/utils/pageHeader';
import { remapTagIdentity } from '@/utils/tagFavorites';
import { useAllowedCenters } from '@/utils/useAllowedCenters';
import TagRuleConditionsEditor from '../components/TagRuleConditionsEditor';

const TagCreatePage: React.FC = () => {
  const params = useParams<{ group?: string; tag?: string }>();
  const isEdit = Boolean(params.group && params.tag);
  const editGroup = params.group ? decodeURIComponent(params.group) : '';
  const editTag = params.tag ? decodeURIComponent(params.tag) : '';

  const { getCatalog, addGroup, renameGroup, deleteGroup, addTag, renameTag } = useTagCatalog();
  const catalog = getCatalog('customer');
  const { options: centerOptions } = useAllowedCenters();
  const groupOptions = useMemo(
    () => catalog.map((g) => ({ label: g.group, value: g.group })),
    [catalog],
  );

  const [category, setCategory] = useState(editGroup || groupOptions[0]?.value || '行为类');
  const [tagName, setTagName] = useState(editTag || '');
  const [tagNameError, setTagNameError] = useState<string>();
  const [description, setDescription] = useState('');
  const [centers, setCenters] = useState<string[]>(
    centerOptions.length ? [centerOptions[0].value] : [],
  );
  const [ruleId, setRuleId] = useState<string>();
  const [conditions, setConditions] = useState<TagRuleConditions>(emptyTagRuleConditions());
  const [initialConditions, setInitialConditions] = useState<TagRuleConditions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sqlOpen, setSqlOpen] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{
    mode: 'add' | 'edit';
    open: boolean;
    name: string;
  }>({ mode: 'add', open: false, name: '' });

  const checkTagNameDup = (raw: string) => {
    const n = raw.trim();
    if (!n) {
      setTagNameError(undefined);
      return false;
    }
    const dup = catalog.some((g) => {
      if (!g.tags.includes(n)) return false;
      // 编辑态：允许保留原名（含仅改分类）
      if (isEdit && n === editTag) return false;
      return true;
    });
    setTagNameError(dup ? '标签名称已存在，请换一个名称' : undefined);
    return dup;
  };

  const resolvedCategory = category;

  const conditionsChanged = useMemo(() => {
    if (!isEdit) return true;
    if (!initialConditions) return true;
    return (
      JSON.stringify(normalizeTagRuleConditions(conditions)) !==
      JSON.stringify(normalizeTagRuleConditions(initialConditions))
    );
  }, [isEdit, conditions, initialConditions]);

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
        setDescription(hit.description || '');
        if (hit.centers?.length) setCenters(hit.centers);
        const normalized = normalizeTagRuleConditions(hit.conditions);
        setConditions(normalized);
        setInitialConditions(normalized);
      }
    });
  }, [isEdit, editGroup, editTag]);

  const handleFinish = async (formValues?: Record<string, any>) => {
    const finalTagName = String(formValues?.tagName || tagName || '').trim();
    const finalCategory = String(formValues?.category || resolvedCategory || '').trim();
    const finalCenters = (formValues?.centers as string[])?.length
      ? (formValues.centers as string[])
      : centers;

    if (!finalCategory) {
      message.warning('请选择分类');
      return false;
    }
    if (!finalTagName) {
      message.warning('请填写标签名称');
      return false;
    }
    if (checkTagNameDup(finalTagName)) {
      message.error('标签名称已存在，请换一个名称');
      return false;
    }
    if (!finalCenters.length) {
      message.warning('请选择平台');
      return false;
    }
    if (!hasAnyDimCondition(conditions)) {
      message.warning('请至少填写一个筛选条件');
      return false;
    }

    const identityChanged =
      isEdit && (finalCategory !== editGroup || finalTagName !== editTag);
    const shouldStartCalc = !isEdit || conditionsChanged;

    setSubmitting(true);
    try {
      if (!isEdit) {
        const err = addTag('customer', finalCategory, finalTagName);
        if (err) {
          message.error(err);
          return false;
        }
      } else if (identityChanged) {
        const err = renameTag(
          'customer',
          { group: editGroup, tag: editTag },
          { group: finalCategory, tag: finalTagName },
        );
        if (err) {
          message.error(err);
          return false;
        }
        remapTagIdentity(
          { group: editGroup, tag: editTag },
          { group: finalCategory, tag: finalTagName },
        );
      }

      const targetTag = { group: finalCategory, tag: finalTagName };
      const ruleName = `${finalTagName}打标规则`;
      let currentRuleId = ruleId;
      if (currentRuleId) {
        const saveRes = await request<{ success: boolean; errorMessage?: string }>(
          `/api/tag-center/rules/${currentRuleId}`,
          {
            method: 'PUT',
            data: {
              name: ruleName,
              targetTag,
              description: description.trim() || undefined,
              conditions,
              centers: finalCenters,
              startCalc: shouldStartCalc,
            },
            skipErrorHandler: true,
          } as any,
        );
        if (saveRes?.success === false) {
          message.error(saveRes.errorMessage || '提交失败');
          return false;
        }
      } else {
        const saveRes = await request<{
          success: boolean;
          data?: TagRule;
          errorMessage?: string;
        }>('/api/tag-center/rules', {
          method: 'POST',
          data: {
            name: ruleName,
            targetTag,
            description: description.trim() || undefined,
            conditions,
            centers: finalCenters,
            startCalc: true,
          },
          skipErrorHandler: true,
        } as any);
        if (saveRes?.success === false) {
          message.error(saveRes.errorMessage || '提交失败');
          return false;
        }
        currentRuleId = saveRes.data?.id;
      }
      message.success(shouldStartCalc ? '已提交计算，请在列表查看进度' : '已保存');
      history.push('/tag-center/list?tab=all');
      return true;
    } catch (e: any) {
      message.error(e?.info?.errorMessage || e?.message || '提交失败');
      return false;
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
                {step < 1 ? (
                  <Button type="primary" onClick={() => props.onSubmit?.()}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" loading={submitting} onClick={() => onSubmit?.()}>
                    {isEdit && !conditionsChanged ? '保存' : '提交计算'}
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
            description: '',
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
            if (checkTagNameDup(name)) {
              message.error('标签名称已存在，请换一个名称');
              return false;
            }
            const nextCenters = (values.centers as string[]) || centers;
            if (!nextCenters?.length) {
              message.warning('请选择平台');
              return false;
            }
            setCategory(cat);
            setTagName(name);
            setDescription(String(values.description || ''));
            setCenters(nextCenters);
            return true;
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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
              <ProFormText
                name="tagName"
                hidden
                fieldProps={{ value: tagName }}
                formItemProps={{ style: { display: 'none' } }}
              />
              <ProFormSelect
                name="centers"
                label="平台"
                options={centerOptions}
                rules={[{ required: true, message: '请选择平台' }]}
                width="md"
                fieldProps={{
                  mode: 'multiple',
                  placeholder: centerOptions.length ? '请选择平台' : '当前角色未配置平台权限',
                  value: centers,
                  onChange: (v: string[]) => setCenters(v || []),
                  disabled: !centerOptions.length,
                }}
                extra="选项来自角色「数据权限 · 平台」；可多选"
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
                    rules={[{ required: true, message: '请选择分类' }]}
                    width="md"
                    fieldProps={{
                      value: category,
                      onChange: (v: string) => setCategory(v),
                      placeholder: '请选择分类',
                      style: { width: 280 },
                    }}
                  />
                  <Space size={8} wrap={false}>
                    <Button onClick={openAddCategory}>新增分类</Button>
                    <Button onClick={openEditCategory}>编辑分类</Button>
                    <Button danger onClick={handleDeleteCategory}>
                      删除分类
                    </Button>
                  </Space>
                </Space>
              </div>
              <ProFormTextArea
                name="description"
                label="描述"
                placeholder="可选"
                fieldProps={{
                  rows: 3,
                  value: description,
                  onChange: (e) => setDescription(e.target.value),
                }}
                width="xl"
              />
            </div>
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm
          name="rule"
          title="打标规则"
          stepProps={{ description: '按维度筛选人' }}
          style={{ width: '100%', maxWidth: '100%' }}
          onFinish={async () => {
            if (!centers.length) {
              message.warning('请先在标签信息中选择平台');
              return false;
            }
            if (!hasAnyDimCondition(conditions)) {
              message.warning('请至少填写一个筛选条件');
              return false;
            }
            return true;
          }}
        >
          <div style={{ width: '100%' }}>
            <TagRuleConditionsEditor value={conditions} onChange={setConditions} />
          </div>
        </StepsForm.StepForm>
      </StepsForm>

      <Modal
        title="预览 SQL（说明清单）"
        open={sqlOpen}
        onCancel={() => setSqlOpen(false)}
        footer={<Button onClick={() => setSqlOpen(false)}>关闭</Button>}
        width={800}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          将按平台 + 各维度筛选条件以 SQL 形式访问数据中台（演示为条件摘要，非真实 SQL；组内且、组间或；维度之间关系见规则配置）。
        </Typography.Paragraph>
        <Table
          size="small"
          pagination={false}
          rowKey="key"
          dataSource={sqlRows}
          columns={[
            { title: '平台', dataIndex: 'center', width: 120 },
            { title: '维度', dataIndex: 'dim', width: 160 },
            { title: '筛选条件', dataIndex: 'summary', ellipsis: true },
          ]}
          locale={{ emptyText: '暂无条件摘要，请先填写筛选条件' }}
        />
      </Modal>

      <Modal
        title={categoryModal.mode === 'add' ? '新增分类' : '编辑分类'}
        open={categoryModal.open}
        onCancel={() => setCategoryModal((s) => ({ ...s, open: false }))}
        onOk={submitCategoryModal}
        destroyOnClose
      >
        <Input
          placeholder="分类名称"
          value={categoryModal.name}
          onChange={(e) => setCategoryModal((s) => ({ ...s, name: e.target.value }))}
        />
      </Modal>
    </PageContainer>
  );
};

export default TagCreatePage;
