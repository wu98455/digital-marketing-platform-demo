import {
  PageContainer,
  ProFormSelect,
  StepsForm,
} from '@ant-design/pro-components';
import { history, request, useSearchParams } from '@umijs/max';
import { Button, Card, Form, Input, Space, Table, Tag, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  MultiLibraryTagPicker,
  colorForGroup,
  useTagCatalog,
  type LibraryTagItem,
} from '@/components/Tagging';
import TitleWithTip from '@/components/TitleWithTip';
import TagRuleConditionsEditor from '@/pages/tag-center/components/TagRuleConditionsEditor';
import type { PreviewSample, TagRuleConditions } from '@/utils/tagRuleTypes';
import { emptyTagRuleConditions, samplesFromConditions } from '@/utils/tagRuleTypes';
import { pageHeader } from '@/utils/pageHeader';
import { useAllowedCenters } from '@/utils/useAllowedCenters';

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

const CrowdCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const copyName = searchParams.get('copyName') || '';
  const { getCatalog } = useTagCatalog();
  const { options: centerOptions } = useAllowedCenters();

  const [name, setName] = useState(copyName);
  const [nameError, setNameError] = useState<string>();
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [persistType, setPersistType] = useState('正式人群');
  const [centers, setCenters] = useState<string[]>(
    centerOptions.length ? [centerOptions[0].value] : [],
  );
  const [selectedTags, setSelectedTags] = useState<LibraryTagItem[]>([]);
  const [tagError, setTagError] = useState<string>();
  const [conditions, setConditions] = useState<TagRuleConditions>(emptyTagRuleConditions());
  const [previewCount, setPreviewCount] = useState<number>();
  const [samples, setSamples] = useState<PreviewSample[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (copyName) setName(copyName);
  }, [copyName]);

  useEffect(() => {
    if (!centers.length && centerOptions.length) {
      setCenters([centerOptions[0].value]);
    }
  }, [centerOptions, centers.length]);

  useEffect(() => {
    request<{ data: { name: string }[] }>('/api/customer-asset/crowds', {
      params: { current: 1, pageSize: 200 },
    }).then((res) => {
      setExistingNames((res.data || []).map((x) => x.name));
    });
  }, []);

  const checkNameDup = (raw: string) => {
    const n = raw.trim();
    if (!n) {
      setNameError(undefined);
      return false;
    }
    const dup = existingNames.some((x) => x === n);
    setNameError(dup ? '人群名称已存在，请换一个名称' : undefined);
    return dup;
  };

  const runPreview = () => {
    const base = samplesFromConditions(conditions, centers);
    const withTagHint = base.map((row, i) => ({
      ...row,
      source:
        selectedTags.length > 0
          ? `标签：${selectedTags[i % selectedTags.length].sourceLabel}/${selectedTags[i % selectedTags.length].tag}`
          : row.source || '维度筛选',
    }));
    setSamples(withTagHint);
    const boost = selectedTags.length * 80;
    setPreviewCount(Math.max(withTagHint.length * 40 + boost, 120 + boost));
  };

  const handleFinish = async () => {
    if (!name.trim()) {
      message.warning('请填写人群名称');
      return false;
    }
    if (checkNameDup(name)) {
      message.error('人群名称已存在，请换一个名称');
      return false;
    }
    if (!centers.length) {
      message.warning('请选择分中心');
      return false;
    }
    if (!selectedTags.length) {
      setTagError('请至少选择一个标签');
      message.warning('请至少选择一个标签');
      return false;
    }
    setSubmitting(true);
    try {
      const res = await request<{ success: boolean; errorMessage?: string; data?: { id: string } }>(
        '/api/customer-asset/crowds',
        {
          method: 'POST',
          data: {
            name: name.trim(),
            type: persistType === '临时人群' ? '临时人群' : '条件人群',
            centers,
            tags: selectedTags,
            conditions,
            count: previewCount,
          },
        },
      );
      if (res?.success === false) {
        message.error(res.errorMessage || '创建失败');
        return false;
      }
      message.success(`已创建人群「${name.trim()}」`);
      history.push('/crowd');
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer
      {...pageHeader({
        title: '新建目标人群',
        backTo: '/crowd',
        crumbs: [
          { title: '目标人群', path: '/crowd' },
          { title: '新建目标人群' },
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
                    确认创建
                  </Button>
                )}
                <Button onClick={() => history.push('/crowd')}>取消</Button>
              </Space>
            );
          },
        }}
      >
        <StepsForm.StepForm
          name="basic"
          title="基本信息"
          stepProps={{ description: '名称与分中心' }}
          initialValues={{
            name: copyName || '',
            persistType: '正式人群',
            centers: centerOptions[0] ? [centerOptions[0].value] : [],
          }}
          onFinish={async (values) => {
            const nextName = String(values.name || name || '').trim();
            if (!nextName) {
              message.warning('请填写人群名称');
              return false;
            }
            if (checkNameDup(nextName)) {
              message.error('人群名称已存在，请换一个名称');
              return false;
            }
            const nextCenters = (values.centers as string[]) || centers;
            if (!nextCenters?.length) {
              message.warning('请选择分中心');
              return false;
            }
            setName(nextName);
            setCenters(nextCenters);
            setPersistType(String(values.persistType || persistType));
            return true;
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 520 }}>
              <Form.Item
                label="人群名称"
                required
                validateStatus={nameError ? 'error' : undefined}
                help={nameError || undefined}
              >
                <Input
                  value={name}
                  placeholder="如：暑期亲子游意向"
                  maxLength={40}
                  status={nameError ? 'error' : undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    checkNameDup(e.target.value);
                  }}
                  onBlur={() => checkNameDup(name)}
                />
              </Form.Item>
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
                extra="选项来自角色「数据权限 · 分中心」"
              />
              <ProFormSelect
                name="persistType"
                label="人群类型"
                width="md"
                options={[
                  { label: '正式人群', value: '正式人群' },
                  { label: '临时人群', value: '临时人群' },
                ]}
                fieldProps={{
                  value: persistType,
                  onChange: (v: string) => setPersistType(v),
                }}
              />
            </div>
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm
          name="rule"
          title="圈选条件"
          stepProps={{ description: '选标签 + 维度筛选' }}
          style={{ width: '100%', maxWidth: '100%' }}
          onFinish={async () => {
            if (!selectedTags.length) {
              setTagError('请至少选择一个标签');
              message.warning('请至少选择一个标签');
              return false;
            }
            setTagError(undefined);
            runPreview();
            return true;
          }}
        >
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              size="small"
              title={
                <TitleWithTip
                  title="选择标签（必选）"
                  tip={
                    <div>
                      <div>已选（必选）：请从下方标签页选择标签。</div>
                      <div style={{ marginTop: 6 }}>
                        对应「数据打标」五个列表的标签库；每个标签页内按分类展示，可跨页多选。
                      </div>
                    </div>
                  }
                />
              }
            >
              <MultiLibraryTagPicker
                value={selectedTags}
                required
                error={tagError}
                onChange={(next) => {
                  setSelectedTags(next);
                  if (next.length) setTagError(undefined);
                }}
              />
            </Card>

            <Card
              size="small"
              title={
                <TitleWithTip
                  title="维度筛选（可选）"
                  tip="在已选标签基础上叠加会员/订单/行为等维度条件；组内且、组间或。可不填。"
                />
              }
            >
              <TagRuleConditionsEditor value={conditions} onChange={setConditions} />
            </Card>
          </div>
        </StepsForm.StepForm>

        <StepsForm.StepForm name="preview" title="预览确认" stepProps={{ description: '确认创建' }}>
          <Typography.Paragraph>
            人群：
            <Typography.Text strong style={{ marginInline: 8 }}>
              {name}
            </Typography.Text>
            类型：
            <Typography.Text strong>{persistType}</Typography.Text>
            <span style={{ marginLeft: 12 }}>
              分中心：
              <Typography.Text strong>{centers.join('、') || '--'}</Typography.Text>
            </span>
            <Button type="link" onClick={runPreview}>
              刷新预估
            </Button>
            <Button
              type="link"
              disabled={!samples.length}
              onClick={() => downloadCsv(`${name || '人群'}-预览.csv`, samples)}
            >
              导出
            </Button>
          </Typography.Paragraph>
          <Typography.Paragraph>
            已选标签：
            <Space size={[4, 4]} wrap style={{ marginLeft: 8 }}>
              {selectedTags.map((t) => (
                <Tag
                  key={`${t.source}::${t.group}::${t.tag}`}
                  color={colorForGroup(t.group, getCatalog(t.kind))}
                >
                  {t.sourceLabel}/{t.tag}
                </Tag>
              ))}
            </Space>
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
    </PageContainer>
  );
};

export default CrowdCreatePage;
