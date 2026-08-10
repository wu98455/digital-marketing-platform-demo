import { PageContainer, StepsForm } from '@ant-design/pro-components';
import { history, request, useParams, useSearchParams } from '@umijs/max';
import { Alert, Button, Space, Table, Tag, Typography, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import type { CatalogKind } from '@/components/Tagging';
import { colorForGroup, useTagCatalog } from '@/components/Tagging';
import type { PreviewSample, TagRule, TagRuleConditions } from '@/utils/tagRuleTypes';
import { emptyTagRuleConditions } from '@/utils/tagRuleTypes';
import TagRuleConditionsEditor from '../components/TagRuleConditionsEditor';

const KIND_META: Record<
  CatalogKind,
  { label: string; listPath: string; tagPrefix: string }
> = {
  customer: { label: '客户', listPath: '/tag-center/customer', tagPrefix: '客户' },
  store: { label: '店铺', listPath: '/tag-center/store', tagPrefix: '店铺' },
  product: { label: '商品', listPath: '/tag-center/product', tagPrefix: '商品' },
  campaign: { label: '专题活动', listPath: '/tag-center/campaign', tagPrefix: '活动' },
};

function downloadCsv(filename: string, rows: PreviewSample[]) {
  const header = ['会员ID', '姓名', '手机', '来源'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [r.memberId, r.name, r.phoneMasked, `"${(r.source || '').replace(/"/g, '""')}"`].join(','),
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

const DataTagCreatePage: React.FC = () => {
  const { kind: kindParam } = useParams<{ kind: string }>();
  const [searchParams] = useSearchParams();
  const kind = (kindParam || 'customer') as CatalogKind;
  const meta = KIND_META[kind] || KIND_META.customer;
  const selectedIds = useMemo(
    () =>
      (searchParams.get('ids') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  );
  const selectedLabels = useMemo(
    () =>
      (searchParams.get('labels') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  );

  const { getCatalog, addTag } = useTagCatalog();
  const catalog = getCatalog(kind);
  const [conditions, setConditions] = useState<TagRuleConditions>(emptyTagRuleConditions());
  const [previewCount, setPreviewCount] = useState<number>();
  const [samples, setSamples] = useState<PreviewSample[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const tagGroup = catalog[0]?.group || '默认分类';
  const tagName = useMemo(() => {
    if (selectedLabels.length === 1) return `${meta.tagPrefix}·${selectedLabels[0]}`;
    if (selectedLabels.length > 1) {
      return `${meta.tagPrefix}·${selectedLabels[0]}等${selectedLabels.length}项`;
    }
    if (selectedIds.length === 1) return `${meta.tagPrefix}·${selectedIds[0]}`;
    return `${meta.tagPrefix}·批量${selectedIds.length}项`;
  }, [meta.tagPrefix, selectedIds, selectedLabels]);

  useEffect(() => {
    if (!selectedIds.length) {
      message.warning(`请先在${meta.label}列表勾选记录，再批量打标`);
      history.replace(meta.listPath);
    }
  }, [meta.label, meta.listPath, selectedIds.length]);

  const doPreview = async () => {
    const res = await request<{ data: { count: number; samples: PreviewSample[] } }>(
      '/api/tag-center/rules/preview',
      { method: 'POST', data: { conditions, scope: { kind, ids: selectedIds } } },
    );
    setPreviewCount(res.data?.count);
    setSamples(res.data?.samples || []);
  };

  const handleFinish = async () => {
    if (!selectedIds.length) return false;
    setSubmitting(true);
    try {
      const err = addTag(kind, tagGroup, tagName);
      if (err) {
        message.error(err);
        return false;
      }
      const targetTag = { group: tagGroup, tag: tagName };
      const ruleName = `${tagName}打标规则`;
      const saveRes = await request<{
        success: boolean;
        data?: TagRule;
        errorMessage?: string;
      }>('/api/tag-center/rules', {
        method: 'POST',
        data: {
          name: ruleName,
          targetTag,
          conditions,
          enabled: true,
          scope: { kind, ids: selectedIds, labels: selectedLabels },
        },
      });
      if (saveRes?.success === false) {
        message.error(saveRes.errorMessage || '保存失败');
        return false;
      }
      const ruleId = saveRes.data?.id;
      if (ruleId) {
        const runRes = await request<{
          success: boolean;
          errorMessage?: string;
          data?: { count: number };
        }>(`/api/tag-center/rules/${ruleId}/run`, {
          method: 'POST',
          data: { scope: { kind, ids: selectedIds } },
        });
        if (runRes?.success === false) {
          message.error(runRes.errorMessage || '打标失败');
          return false;
        }
        message.success(`已保存并打标（${runRes.data?.count ?? 0} 人）`);
      } else {
        message.success('已保存');
      }
      history.push(meta.listPath);
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedIds.length) return null;

  return (
    <PageContainer title={`${meta.label} · 批量打标`} onBack={() => history.push(meta.listPath)}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          <>
            已选 {selectedIds.length} 条{meta.label}记录
            {selectedLabels.length ? `：${selectedLabels.slice(0, 3).join('、')}` : ''}
            {selectedLabels.length > 3 ? '…' : ''}
          </>
        }
      />
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
                    确认打标
                  </Button>
                )}
                <Button onClick={() => history.push(meta.listPath)}>取消</Button>
              </Space>
            );
          },
        }}
      >
        <StepsForm.StepForm
          name="rule"
          title="打标规则"
          stepProps={{ description: '按维度筛人' }}
          style={{ width: '100%', maxWidth: '100%' }}
          onFinish={async () => {
            await doPreview();
            return true;
          }}
        >
          <Typography.Paragraph type="secondary">
            标签名称：<Typography.Text strong>{tagName}</Typography.Text>
            <span style={{ marginInline: 12 }} />
            分类：
            <Tag color={colorForGroup(tagGroup, catalog)}>{tagGroup}</Tag>
          </Typography.Paragraph>
          <TagRuleConditionsEditor value={conditions} onChange={setConditions} />
        </StepsForm.StepForm>

        <StepsForm.StepForm name="preview" title="预览确认" stepProps={{ description: '确认打标' }}>
          <Typography.Paragraph>
            标签：
            <Tag color={colorForGroup(tagGroup, catalog)} style={{ marginInline: 8 }}>
              {tagName}
            </Tag>
            作用范围：已选 {selectedIds.length} 条{meta.label}
            <Button type="link" onClick={doPreview}>
              刷新预估
            </Button>
            <Button
              type="link"
              disabled={!samples.length}
              onClick={() => downloadCsv(`${tagName}-预览.csv`, samples)}
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
              { title: '会员ID', dataIndex: 'memberId', width: 120 },
              { title: '姓名', dataIndex: 'name', width: 100 },
              { title: '手机', dataIndex: 'phoneMasked', width: 130 },
              { title: '来源', dataIndex: 'source', ellipsis: true },
            ]}
            locale={{ emptyText: '进入本步时已预估；也可点「刷新预估」' }}
          />
        </StepsForm.StepForm>
      </StepsForm>
    </PageContainer>
  );
};

export default DataTagCreatePage;
