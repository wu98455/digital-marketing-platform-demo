import {
  PageContainer,
  ProFormSelect,
  StepsForm,
} from '@ant-design/pro-components';
import { history, request, useSearchParams } from '@umijs/max';
import { Button, Card, Form, Input, Space, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  MultiLibraryTagPicker,
  type LibraryTagItem,
} from '@/components/Tagging';
import TitleWithTip from '@/components/TitleWithTip';
import TagRuleConditionsEditor from '@/pages/tag-center/components/TagRuleConditionsEditor';
import type { TagRuleConditions } from '@/utils/tagRuleTypes';
import { emptyTagRuleConditions } from '@/utils/tagRuleTypes';
import { pageHeader } from '@/utils/pageHeader';
import { useAllowedCenters } from '@/utils/useAllowedCenters';

const CrowdCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const copyName = searchParams.get('copyName') || '';
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
      message.warning('请选择平台');
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
            startCalc: true,
          },
        },
      );
      if (res?.success === false) {
        message.error(res.errorMessage || '提交失败');
        return false;
      }
      message.success('已提交计算，请在列表查看进度');
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
                {step < 1 ? (
                  <Button type="primary" onClick={() => props.onSubmit?.()}>
                    下一步
                  </Button>
                ) : (
                  <Button type="primary" loading={submitting} onClick={() => onSubmit?.()}>
                    提交计算
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
          stepProps={{ description: '名称与平台' }}
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
              message.warning('请选择平台');
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
                extra="选项来自角色「数据权限 · 平台」"
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
                  tip="七个维度 Tab；每维可添加多组条件（组内且、组间或）；维度之间关系可在 Tab 右侧切换。可不填。"
                />
              }
            >
              <TagRuleConditionsEditor value={conditions} onChange={setConditions} />
            </Card>
          </div>
        </StepsForm.StepForm>
      </StepsForm>
    </PageContainer>
  );
};

export default CrowdCreatePage;
