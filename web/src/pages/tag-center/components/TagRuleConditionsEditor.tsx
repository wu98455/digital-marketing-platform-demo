import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormDateRangePicker,
} from '@ant-design/pro-components';
import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Card, InputNumber, Modal, Radio, Select, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';
import type {
  ActiveDimKey,
  ConditionGroupMap,
  DimKey,
  DimLogic,
  TagRuleConditions,
} from '@/utils/tagRuleTypes';
import {
  CONDITION_OPS,
  DIM_KEYS,
  DIM_LABELS,
  emptyGroup,
  emptyTagRuleConditions,
} from '@/utils/tagRuleTypes';
import {
  CAMPAIGN_TAG_CATALOG,
  PRODUCT_TAG_CATALOG,
  SUPPLIER_TAG_CATALOG,
  catalogTagOptions,
} from '@/components/Tagging/catalogs';
import {
  DIM_FILTER_CATALOG,
  getGroupKeys,
} from './tagRuleFilterCatalog';

type Props = {
  value?: TagRuleConditions;
  onChange: (next: TagRuleConditions) => void;
};

const COMPANIES = ['乐和乐都', '阿依河', '金刀峡', '乌江画廊景区'];
const BUY_TYPES = [
  { label: '门票类', value: '门票类' },
  { label: '酒店类', value: '酒店类' },
  { label: '餐饮类', value: '餐饮类' },
];
const PRODUCT_TAG_OPTIONS = catalogTagOptions(PRODUCT_TAG_CATALOG);
const SUPPLIER_TAG_OPTIONS = catalogTagOptions(SUPPLIER_TAG_CATALOG);
const CAMPAIGN_TAG_OPTIONS = catalogTagOptions(CAMPAIGN_TAG_CATALOG);

const addFilterBoxStyle: React.CSSProperties = {
  border: '1px dashed #d9d9d9',
  borderRadius: 8,
  padding: '16px 12px',
  textAlign: 'center',
  cursor: 'pointer',
  color: 'rgba(0,0,0,0.45)',
  background: '#fafafa',
  transition: 'border-color 0.2s, color 0.2s',
  userSelect: 'none',
};

/** 与 ProForm 字段一致：标签在上、控件在下（避免标签横排导致错位） */
const OpFields: React.FC<{
  label: string;
  value?: { op?: string; value?: string | number; min?: number | string; max?: number | string };
  onChange: (v: {
    op?: string;
    value?: string | number;
    min?: number | string;
    max?: number | string;
  }) => void;
}> = ({ label, value, onChange }) => (
  <div
    className="ant-form-item"
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      marginBottom: 24,
      marginInlineEnd: 16,
      verticalAlign: 'top',
    }}
  >
    <div className="ant-form-item-label" style={{ textAlign: 'left', padding: 0 }}>
      <label style={{ height: 'auto' }}>{label}</label>
    </div>
    <div className="ant-form-item-control">
      <Space size={8} align="center" wrap={false}>
        <Select
          allowClear
          placeholder="运算符"
          options={CONDITION_OPS}
          value={value?.op}
          onChange={(op) => onChange({ ...value, op })}
          style={{ width: 120 }}
        />
        {value?.op === 'BETWEEN' ? (
          <>
            <InputNumber
              placeholder="最小"
              value={value?.min as number | undefined}
              onChange={(min) => onChange({ ...value, min: min ?? undefined })}
              style={{ width: 100 }}
            />
            <InputNumber
              placeholder="最大"
              value={value?.max as number | undefined}
              onChange={(max) => onChange({ ...value, max: max ?? undefined })}
              style={{ width: 100 }}
            />
          </>
        ) : (
          <InputNumber
            placeholder="数值"
            value={value?.value as number | undefined}
            onChange={(val) => onChange({ ...value, value: val ?? undefined })}
            style={{ width: 120 }}
          />
        )}
      </Space>
    </div>
  </div>
);

function patchGroup<K extends DimKey>(
  all: TagRuleConditions,
  dim: K,
  index: number,
  patch: Partial<ConditionGroupMap[K]>,
): TagRuleConditions {
  const groups = [...(all[dim]?.groups || [emptyGroup(dim)])];
  groups[index] = { ...groups[index], ...patch };
  return { ...all, [dim]: { groups } };
}

function patchGroupKeys<K extends DimKey>(
  all: TagRuleConditions,
  dim: K,
  index: number,
  keys: string[],
  clearRemoved?: boolean,
): TagRuleConditions {
  const groups = [...(all[dim]?.groups || [emptyGroup(dim)])];
  const prev = { ...(groups[index] as Record<string, unknown>) };
  const prevKeys = getGroupKeys(prev);
  if (clearRemoved) {
    prevKeys.forEach((k) => {
      if (!keys.includes(k)) delete prev[k];
    });
  }
  groups[index] = { ...prev, __keys: keys } as ConditionGroupMap[K];
  return { ...all, [dim]: { groups } };
}

const MemberFields: React.FC<{
  g: ConditionGroupMap['member'];
  onPatch: (p: Partial<ConditionGroupMap['member']>) => void;
  visibleKeys?: string[];
}> = ({ g, onPatch, visibleKeys }) => {
  const show = (k: string) => !visibleKeys || visibleKeys.includes(k);
  return (
  <Space wrap size={[16, 12]} style={{ width: '100%' }}>
    {show('customerCompany') ? (
    <ProFormSelect
      label="数据范围/公司"
      options={['全部', ...COMPANIES].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.customerCompany,
        onChange: (v) => onPatch({ customerCompany: v }),
        style: { width: 160 },
      }}
    />
    ) : null}
    {show('gender') ? (
    <ProFormSelect
      label="性别"
      mode="multiple"
      options={['未知', '男', '女'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        value: g.gender,
        onChange: (v) => onPatch({ gender: v }),
        style: { width: 180 },
      }}
    />
    ) : null}
    {show('birthdayMonths') ? (
    <ProFormSelect
      label="生日月份"
      mode="multiple"
      options={Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}月`,
        value: String(i + 1),
      }))}
      fieldProps={{
        value: (g as any).birthdayMonths,
        onChange: (v) => onPatch({ birthdayMonths: v } as any),
        style: { width: 200 },
      }}
    />
    ) : null}
    {show('age') ? <OpFields label="年龄" value={g.age} onChange={(age) => onPatch({ age })} /> : null}
    {show('region') ? (
    <ProFormText
      label="地区"
      placeholder="省/市/区"
      fieldProps={{
        value: (g as any).region,
        onChange: (e) => onPatch({ region: e.target.value || undefined } as any),
        style: { width: 160 },
      }}
    />
    ) : null}
    {show('buyCompany') ? (
    <ProFormSelect
      label="买过的公司"
      mode="multiple"
      options={COMPANIES.map((v) => ({ label: v, value: v }))}
      fieldProps={{
        value: g.buyCompany,
        onChange: (v) => onPatch({ buyCompany: v }),
        style: { width: 220 },
      }}
    />
    ) : null}
    {show('buyType') ? (
    <ProFormSelect
      label="买过的产品类型"
      mode="multiple"
      options={BUY_TYPES}
      fieldProps={{
        value: g.buyType,
        onChange: (v) => onPatch({ buyType: v }),
        style: { width: 200 },
      }}
    />
    ) : null}
    {show('firstBuyCompany') ? (
    <ProFormSelect
      label="首次购买公司"
      mode="multiple"
      options={COMPANIES.map((v) => ({ label: v, value: v }))}
      fieldProps={{
        value: g.firstBuyCompany,
        onChange: (v) => onPatch({ firstBuyCompany: v }),
        style: { width: 220 },
      }}
    />
    ) : null}
    {show('latestBuyCompany') ? (
    <ProFormSelect
      label="最后购买公司"
      mode="multiple"
      options={COMPANIES.map((v) => ({ label: v, value: v }))}
      fieldProps={{
        value: g.latestBuyCompany,
        onChange: (v) => onPatch({ latestBuyCompany: v }),
        style: { width: 220 },
      }}
    />
    ) : null}
    {show('registrationRange') ? (
    <ProFormDateRangePicker
      label="注册时间"
      fieldProps={{
        value: g.registrationRange as any,
        onChange: (_: any, str: [string, string]) =>
          onPatch({ registrationRange: str?.[0] ? str : undefined }),
      }}
    />
    ) : null}
    {show('levelId') ? (
    <ProFormSelect
      label="成长值等级"
      options={['普通', '银卡', '金卡', '黑金'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.levelId,
        onChange: (v) => onPatch({ levelId: v }),
        style: { width: 140 },
      }}
    />
    ) : null}
    {show('vipCard') ? (
    <ProFormSelect
      label="会员卡"
      options={['年卡', '次卡', '亲子卡', '无'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: (g as any).vipCard,
        onChange: (v) => onPatch({ vipCard: v } as any),
        style: { width: 140 },
      }}
    />
    ) : null}
    {show('createOrderNoType') ? (
    <ProFormSelect
      label="下单次数档"
      options={['0次', '1次', '2-5次', '5次以上'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: (g as any).createOrderNoType,
        onChange: (v) => onPatch({ createOrderNoType: v } as any),
        style: { width: 140 },
      }}
    />
    ) : null}
    {show('userType') ? (
    <ProFormSelect
      label="账户类型"
      mode="multiple"
      options={['会员', '非会员'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.userType,
        onChange: (v) => onPatch({ userType: v }),
        style: { width: 120 },
      }}
    />
    ) : null}
    {show('phone') ? (
    <ProFormText
      label="手机号"
      fieldProps={{
        value: g.phone,
        onChange: (e) => onPatch({ phone: e.target.value || undefined }),
        style: { width: 140 },
      }}
    />
    ) : null}
  </Space>
  );
};

const OrderFields: React.FC<{
  g: ConditionGroupMap['order'];
  onPatch: (p: Partial<ConditionGroupMap['order']>) => void;
  visibleKeys?: string[];
}> = ({ g, onPatch, visibleKeys }) => {
  const show = (k: string) => !visibleKeys || visibleKeys.includes(k);
  return (
    <Space wrap size={[16, 12]} style={{ width: '100%' }}>
      {show('ticketOrderPaymentId') ? (
        <ProFormText
          label="主订单编号"
          fieldProps={{
            value: g.ticketOrderPaymentId,
            onChange: (e) => onPatch({ ticketOrderPaymentId: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
      ) : null}
      {show('orderCode') ? (
        <ProFormText
          label="订单编号"
          fieldProps={{
            value: g.orderCode,
            onChange: (e) => onPatch({ orderCode: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
      ) : null}
      {show('orderStatus') ? (
        <ProFormSelect
          label="订单状态"
          mode="multiple"
          options={['付款成功', '部分核销', '全部核销', '部分退款', '全部退款'].map((v) => ({
            label: v,
            value: v,
          }))}
          fieldProps={{
            value: g.orderStatus,
            onChange: (v) => onPatch({ orderStatus: v }),
            style: { width: 220 },
          }}
        />
      ) : null}
      {show('userType') ? (
        <ProFormSelect
          label="用户类型"
          options={['会员', '非会员'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.userType,
            onChange: (v) => onPatch({ userType: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('buyTicketPhone') ? (
        <ProFormText
          label="手机号"
          fieldProps={{
            value: g.buyTicketPhone,
            onChange: (e) => onPatch({ buyTicketPhone: e.target.value || undefined }),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('salesMethod') ? (
        <ProFormSelect
          label="售卖方式"
          options={['正常售卖', '积分兑换'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.salesMethod,
            onChange: (v) => onPatch({ salesMethod: v }),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('sessionType') ? (
        <ProFormSelect
          label="规格类型"
          options={['有座', '无座'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.sessionType,
            onChange: (v) => onPatch({ sessionType: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('projectName') ? (
        <ProFormText
          label="商品名称"
          fieldProps={{
            value: g.projectName,
            onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
      ) : null}
      {show('categorysId') ? (
        <ProFormSelect
          label="分类"
          mode="multiple"
          options={['门票', '酒店', '餐饮', '文创', '联票'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            value: g.categorysId,
            onChange: (v) => onPatch({ categorysId: v }),
            style: { width: 160 },
          }}
        />
      ) : null}
      {show('supplierId') ? (
        <ProFormSelect
          label="供应商"
          options={['自营', '景区A', '酒店集团B', '文创供应商C'].map((v) => ({
            label: v,
            value: v,
          }))}
          fieldProps={{
            allowClear: true,
            value: g.supplierId,
            onChange: (v) => onPatch({ supplierId: v }),
            style: { width: 150 },
          }}
        />
      ) : null}
      {show('productTags') ? (
        <ProFormSelect
          label="商品标签"
          mode="multiple"
          options={PRODUCT_TAG_OPTIONS}
          fieldProps={{
            allowClear: true,
            value: g.productTags,
            onChange: (v) => onPatch({ productTags: v?.length ? v : undefined }),
            style: { width: 260 },
            maxTagCount: 'responsive',
          }}
        />
      ) : null}
      {show('supplierTags') ? (
        <ProFormSelect
          label="供应商标签"
          mode="multiple"
          options={SUPPLIER_TAG_OPTIONS}
          fieldProps={{
            allowClear: true,
            value: g.supplierTags,
            onChange: (v) => onPatch({ supplierTags: v?.length ? v : undefined }),
            style: { width: 260 },
            maxTagCount: 'responsive',
          }}
        />
      ) : null}
      {show('createTimeRange') ? (
        <ProFormDateRangePicker
          label="下单日期"
          fieldProps={{
            value: g.createTimeRange as any,
            onChange: (_: any, str: [string, string]) =>
              onPatch({ createTimeRange: str?.[0] ? str : undefined }),
          }}
        />
      ) : null}
      {show('refuseTimeRange') ? (
        <ProFormDateRangePicker
          label="退单日期"
          fieldProps={{
            value: g.refuseTimeRange as any,
            onChange: (_: any, str: [string, string]) =>
              onPatch({ refuseTimeRange: str?.[0] ? str : undefined }),
          }}
        />
      ) : null}
      {show('verificationRange') ? (
        <ProFormDateRangePicker
          label="完成日期"
          fieldProps={{
            value: g.verificationRange as any,
            onChange: (_: any, str: [string, string]) =>
              onPatch({ verificationRange: str?.[0] ? str : undefined }),
          }}
        />
      ) : null}
      {show('sourceProject') ? (
        <ProFormSelect
          label="商品来源"
          options={['自营', '代售'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.sourceProject,
            onChange: (v) => onPatch({ sourceProject: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('orderType') ? (
        <ProFormSelect
          label="销售渠道"
          mode="multiple"
          options={['小程序', 'APP', '官网', '门店POS', '分销', 'OTA'].map((v) => ({
            label: v,
            value: v,
          }))}
          fieldProps={{
            value: g.orderType,
            onChange: (v) => onPatch({ orderType: v }),
            style: { width: 200 },
          }}
        />
      ) : null}
      {show('activityType') ? (
        <ProFormSelect
          label="订单类型"
          options={['普通', '砍价', '拼团'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.activityType,
            onChange: (v) => onPatch({ activityType: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('isDistributionNew') ? (
        <ProFormSelect
          label="是否分销订单"
          options={['是', '否'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.isDistributionNew,
            onChange: (v) => onPatch({ isDistributionNew: v }),
            style: { width: 130 },
          }}
        />
      ) : null}
      {show('distributionUserName') ? (
        <ProFormText
          label="分销人姓名"
          fieldProps={{
            value: (g as any).distributionUserName,
            onChange: (e) => onPatch({ distributionUserName: e.target.value || undefined } as any),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('lifeCycle') ? (
        <ProFormSelect
          label="客户生命周期"
          mode="multiple"
          options={[
            '潜在客户',
            '新客一次客户',
            '老客一次客户',
            '新客复购客户',
            '老客复购客户',
            '沉默客户',
            '流失客户',
          ].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            value: g.lifeCycle,
            onChange: (v) => onPatch({ lifeCycle: v }),
            style: { width: 240 },
          }}
        />
      ) : null}
      {show('amount') ? (
        <OpFields label="购买金额" value={g.amount} onChange={(amount) => onPatch({ amount })} />
      ) : null}
      {show('frequency') ? (
        <OpFields label="购买次数" value={g.frequency} onChange={(frequency) => onPatch({ frequency })} />
      ) : null}
      {show('avgUnitPrice') ? (
        <OpFields
          label="平均客单价"
          value={g.avgUnitPrice}
          onChange={(avgUnitPrice) => onPatch({ avgUnitPrice })}
        />
      ) : null}
      {show('customerBuyGoodsName') ? (
        <ProFormText
          label="购买商品名称"
          fieldProps={{
            value: g.customerBuyGoodsName,
            onChange: (e) => onPatch({ customerBuyGoodsName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
      ) : null}
    </Space>
  );
};

const SimpleDimFields: React.FC<{
  dim: Exclude<ActiveDimKey, 'member' | 'order' | 'userBehavior'>;
  g: Record<string, any>;
  onPatch: (p: Record<string, any>) => void;
  visibleKeys?: string[];
}> = ({ dim, g, onPatch, visibleKeys }) => {
  const show = (k: string) => !visibleKeys || visibleKeys.includes(k);
  if (dim === 'campaign') {
    return (
      <Space wrap size={[16, 12]}>
        {show('channelName') ? (
          <ProFormText
            label="渠道名称"
            fieldProps={{
              value: g.channelName,
              onChange: (e) => onPatch({ channelName: e.target.value || undefined }),
              style: { width: 160 },
            }}
          />
        ) : null}
        {show('promoteType') ? (
          <ProFormSelect
            label="推广类型"
            options={['线上投放', '线下物料', '社群', '分销', '异业'].map((v) => ({
              label: v,
              value: v,
            }))}
            fieldProps={{
              allowClear: true,
              value: g.promoteType,
              onChange: (v) => onPatch({ promoteType: v }),
              style: { width: 140 },
            }}
          />
        ) : null}
        {show('activityType') ? (
          <ProFormSelect
            label="活动类型"
            options={['普通', '砍价', '拼团', '音乐节专题'].map((v) => ({ label: v, value: v }))}
            fieldProps={{
              allowClear: true,
              value: g.activityType,
              onChange: (v) => onPatch({ activityType: v }),
              style: { width: 140 },
            }}
          />
        ) : null}
        {show('campaignTags') ? (
          <ProFormSelect
            label="活动标签"
            mode="multiple"
            options={CAMPAIGN_TAG_OPTIONS}
            fieldProps={{
              allowClear: true,
              value: g.campaignTags,
              onChange: (v) => onPatch({ campaignTags: v?.length ? v : undefined }),
              style: { width: 260 },
              maxTagCount: 'responsive',
            }}
          />
        ) : null}
        {show('hasOrder') ? (
          <ProFormSelect
            label="是否成交"
            options={['是', '否'].map((v) => ({ label: v, value: v }))}
            fieldProps={{
              allowClear: true,
              value: g.hasOrder,
              onChange: (v) => onPatch({ hasOrder: v }),
              style: { width: 100 },
            }}
          />
        ) : null}
      </Space>
    );
  }
  if (dim === 'coupon') {
    return (
      <Space wrap size={[16, 12]}>
        {show('name') ? (
          <ProFormText
            label="券名称"
            fieldProps={{
              value: g.name,
              onChange: (e) => onPatch({ name: e.target.value || undefined }),
              style: { width: 160 },
            }}
          />
        ) : null}
        {show('discountType') ? (
          <ProFormSelect
            label="券类型"
            options={['满减', '折扣', '兑换'].map((v) => ({ label: v, value: v }))}
            fieldProps={{
              allowClear: true,
              value: g.discountType,
              onChange: (v) => onPatch({ discountType: v }),
              style: { width: 120 },
            }}
          />
        ) : null}
        {show('status') ? (
          <ProFormSelect
            label="券状态"
            options={['已发放', '已领取未核销', '已核销', '已过期'].map((v) => ({
              label: v,
              value: v,
            }))}
            fieldProps={{
              allowClear: true,
              value: g.status,
              onChange: (v) => onPatch({ status: v }),
              style: { width: 160 },
            }}
          />
        ) : null}
      </Space>
    );
  }
  if (dim === 'points') {
    return (
      <Space wrap size={[16, 12]}>
        {show('projectName') ? (
          <ProFormText
            label="积分商品"
            fieldProps={{
              value: g.projectName,
              onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
              style: { width: 160 },
            }}
          />
        ) : null}
        {show('integralBalance') ? (
          <OpFields
            label="可用积分"
            value={g.integralBalance}
            onChange={(integralBalance) => onPatch({ integralBalance })}
          />
        ) : null}
        {show('hasPointsAccount') ? (
          <ProFormSelect
            label="是否有积分账户"
            options={['是', '否'].map((v) => ({ label: v, value: v }))}
            fieldProps={{
              allowClear: true,
              value: g.hasPointsAccount,
              onChange: (v) => onPatch({ hasPointsAccount: v }),
              style: { width: 140 },
            }}
          />
        ) : null}
        {show('salesMethod') ? (
          <ProFormSelect
            label="售卖方式"
            options={[{ label: '积分兑换', value: '积分兑换' }]}
            fieldProps={{
              allowClear: true,
              value: g.salesMethod,
              onChange: (v) => onPatch({ salesMethod: v }),
              style: { width: 140 },
            }}
          />
        ) : null}
      </Space>
    );
  }
  return (
    <Space wrap size={[16, 12]}>
      {show('orderNumber') ? (
        <ProFormText
          label="优品订单号"
          fieldProps={{
            value: g.orderNumber,
            onChange: (e) => onPatch({ orderNumber: e.target.value || undefined }),
            style: { width: 150 },
          }}
        />
      ) : null}
      {show('prodName') ? (
        <ProFormText
          label="商品名称"
          fieldProps={{
            value: g.prodName,
            onChange: (e) => onPatch({ prodName: e.target.value || undefined }),
            style: { width: 150 },
          }}
        />
      ) : null}
      {show('userPhone') ? (
        <ProFormText
          label="手机号"
          fieldProps={{
            value: g.userPhone,
            onChange: (e) => onPatch({ userPhone: e.target.value || undefined }),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('status') ? (
        <ProFormSelect
          label="订单状态"
          options={['待付款', '已付款', '已完成', '已取消'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.status,
            onChange: (v) => onPatch({ status: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('isMember') ? (
        <ProFormSelect
          label="是否会员"
          options={['是', '否'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.isMember,
            onChange: (v) => onPatch({ isMember: v }),
            style: { width: 100 },
          }}
        />
      ) : null}
      {show('companyName') ? (
        <ProFormText
          label="单位名称"
          fieldProps={{
            value: g.companyName,
            onChange: (e) => onPatch({ companyName: e.target.value || undefined }),
            style: { width: 150 },
          }}
        />
      ) : null}
      {show('balanceLevel') ? (
        <ProFormSelect
          label="卡余额"
          options={['余额充足', '余额偏低', '已用尽'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.balanceLevel,
            onChange: (v) => onPatch({ balanceLevel: v }),
            style: { width: 130 },
          }}
        />
      ) : null}
      {show('vipCard') ? (
        <ProFormSelect
          label="会员卡"
          options={['年卡', '次卡', '亲子卡'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.vipCard,
            onChange: (v) => onPatch({ vipCard: v }),
            style: { width: 120 },
          }}
        />
      ) : null}
      {show('cardName') ? (
        <ProFormText
          label="卡名称关键词"
          fieldProps={{
            value: g.cardName,
            onChange: (e) => onPatch({ cardName: e.target.value || undefined }),
            style: { width: 150 },
          }}
        />
      ) : null}
    </Space>
  );
};

const USER_BEHAVIOR_TIME_NODES = ['近7天', '近30天', '近90天', '近180天', '近1年'].map((v) => ({
  label: v,
  value: v,
}));
const USER_BEHAVIOR_ACTIONS = [
  { label: '浏览', value: '浏览' },
  { label: '加购', value: '加购' },
  { label: '分享', value: '分享' },
  { label: '登录', value: '登录' },
  { label: '活动访问', value: '活动访问' },
  { label: '活动参与', value: '活动参与' },
  { label: '搜索', value: '搜索' },
  { label: '商品详情点击', value: '商品详情点击' },
];
const USER_BEHAVIOR_EVENTS = ['浏览', '加购', '下单', '支付', '核销', '退款'].map((v) => ({
  label: v,
  value: v,
}));
const USER_BEHAVIOR_FEEDBACK = ['高活跃', '中活跃', '低活跃', '沉默', '流失预警'].map((v) => ({
  label: v,
  value: v,
}));
const USER_BEHAVIOR_INTERACTIONS = ['分享', '收藏', '评论', '领券', '签到', '客服咨询'].map(
  (v) => ({ label: v, value: v }),
);

const UserBehaviorFields: React.FC<{
  g: ConditionGroupMap['userBehavior'];
  onPatch: (p: Partial<ConditionGroupMap['userBehavior']>) => void;
  visibleKeys?: string[];
}> = ({ g, onPatch, visibleKeys }) => {
  const show = (k: string) => !visibleKeys || visibleKeys.includes(k);
  const actions = g.behaviorActions || [];
  return (
    <Space wrap size={[16, 12]} style={{ width: '100%' }}>
      {show('timeNode') ? (
        <ProFormSelect
          label="时间节点"
          options={USER_BEHAVIOR_TIME_NODES}
          fieldProps={{
            allowClear: true,
            placeholder: '可选',
            value: g.timeNode,
            onChange: (v) => onPatch({ timeNode: v }),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('behaviorActions') ? (
        <ProFormSelect
          label="行为动作"
          options={USER_BEHAVIOR_ACTIONS}
          fieldProps={{
            mode: 'multiple',
            allowClear: true,
            placeholder: '浏览/加购/分享/…',
            value: g.behaviorActions,
            onChange: (v) => {
              const next = v || [];
              onPatch({
                behaviorActions: next.length ? next : undefined,
                browsePages: next.includes('浏览') ? g.browsePages : undefined,
                browseDuration: next.includes('浏览') ? g.browseDuration : undefined,
                cartProducts: next.includes('加购') ? g.cartProducts : undefined,
                shareActivities: next.includes('分享') ? g.shareActivities : undefined,
                loginChannels: next.includes('登录') ? g.loginChannels : undefined,
                visitChannels: next.includes('活动访问') ? g.visitChannels : undefined,
                joinSpecials: next.includes('活动参与') ? g.joinSpecials : undefined,
                searchQuery: next.includes('搜索') ? g.searchQuery : undefined,
                detailProducts: next.includes('商品详情点击') ? g.detailProducts : undefined,
              });
            },
            style: { width: 320 },
          }}
        />
      ) : null}
      {show('behaviorActions') && actions.includes('浏览') ? (
        <ProFormText
          label="浏览页面摘要"
          fieldProps={{
            placeholder: '如：景区门票详情（演示）',
            value: (g.browsePages as any)?.[0]?.join?.('/') || (g as any).browsePagesText,
            onChange: (e) => {
              const t = e.target.value || undefined;
              onPatch({
                browsePages: t ? [[t]] : undefined,
              } as any);
            },
            style: { width: 220 },
          }}
        />
      ) : null}
      {show('behaviorActions') && actions.includes('加购') ? (
        <ProFormText
          label="加购商品摘要"
          fieldProps={{
            placeholder: '如：乐园年卡（演示）',
            value: (g.cartProducts as any)?.[0]?.join?.('/') || '',
            onChange: (e) => {
              const t = e.target.value || undefined;
              onPatch({ cartProducts: t ? [[t]] : undefined } as any);
            },
            style: { width: 220 },
          }}
        />
      ) : null}
      {show('behaviorActions') && actions.includes('分享') ? (
        <ProFormText
          label="分享活动摘要"
          fieldProps={{
            placeholder: '如：五一活动页（演示）',
            value: (g.shareActivities as any)?.[0]?.join?.('/') || '',
            onChange: (e) => {
              const t = e.target.value || undefined;
              onPatch({ shareActivities: t ? [[t]] : undefined } as any);
            },
            style: { width: 220 },
          }}
        />
      ) : null}
      {show('behaviorActions') && actions.includes('搜索') ? (
        <ProFormText
          label="搜索关键词"
          fieldProps={{
            allowClear: true,
            placeholder: '可空=任意搜索',
            value: g.searchQuery,
            onChange: (e) => onPatch({ searchQuery: e.target.value || undefined }),
            style: { width: 200 },
          }}
        />
      ) : null}
      {show('eventCondition') ? (
        <ProFormSelect
          label="事件条件"
          options={USER_BEHAVIOR_EVENTS}
          fieldProps={{
            allowClear: true,
            placeholder: '可选',
            value: (g as any).eventCondition,
            onChange: (v) => onPatch({ eventCondition: v } as any),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('dataFeedback') ? (
        <ProFormSelect
          label="数据反馈"
          options={USER_BEHAVIOR_FEEDBACK}
          fieldProps={{
            allowClear: true,
            placeholder: '可选',
            value: (g as any).dataFeedback,
            onChange: (v) => onPatch({ dataFeedback: v } as any),
            style: { width: 140 },
          }}
        />
      ) : null}
      {show('interactionBehavior') ? (
        <ProFormSelect
          label="互动行为"
          options={USER_BEHAVIOR_INTERACTIONS}
          fieldProps={{
            allowClear: true,
            placeholder: '可选',
            value: (g as any).interactionBehavior,
            onChange: (v) => onPatch({ interactionBehavior: v } as any),
            style: { width: 140 },
          }}
        />
      ) : null}
    </Space>
  );
};

const DimPanel: React.FC<{
  dim: ActiveDimKey;
  value: TagRuleConditions;
  onChange: (next: TagRuleConditions) => void;
}> = ({ dim, value, onChange }) => {
  const groups = value[dim]?.groups?.length ? value[dim].groups : [emptyGroup(dim)];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(0);
  const [draftKeys, setDraftKeys] = useState<string[]>([]);

  const addGroup = () => {
    onChange({
      ...value,
      [dim]: { groups: [...groups, emptyGroup(dim)] },
    });
  };

  const removeGroup = (index: number) => {
    if (groups.length <= 1) return;
    const next = groups.filter((_, i) => i !== index);
    onChange({ ...value, [dim]: { groups: next } });
  };

  const openAddFilters = (index: number) => {
    const keys = getGroupKeys(groups[index] as Record<string, unknown>);
    setEditingIndex(index);
    setDraftKeys([...keys]);
    setModalOpen(true);
  };

  const confirmFilters = () => {
    onChange(patchGroupKeys(value, dim, editingIndex, draftKeys, true));
    setModalOpen(false);
  };

  const toggleDraftKey = (key: string) => {
    setDraftKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const catalog = DIM_FILTER_CATALOG[dim] || [];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groups.map((g, index) => {
        const keys = getGroupKeys(g as Record<string, unknown>);
        return (
          <React.Fragment key={`${dim}-${index}`}>
            {index > 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'rgba(0,0,0,0.45)',
                  fontSize: 13,
                  userSelect: 'none',
                }}
              >
                或
              </div>
            ) : null}
            <Card
              size="small"
              title={`条件组 ${index + 1}`}
              style={{ width: '100%' }}
              styles={{ body: { width: '100%' } }}
              extra={
                groups.length > 1 ? (
                  <Button type="link" danger size="small" onClick={() => removeGroup(index)}>
                    删除本组
                  </Button>
                ) : null
              }
            >
              {keys.length ? (
                dim === 'member' ? (
                  <MemberFields
                    g={g as ConditionGroupMap['member']}
                    visibleKeys={keys}
                    onPatch={(p) => onChange(patchGroup(value, 'member', index, p))}
                  />
                ) : dim === 'order' ? (
                  <OrderFields
                    g={g as ConditionGroupMap['order']}
                    visibleKeys={keys}
                    onPatch={(p) => onChange(patchGroup(value, 'order', index, p))}
                  />
                ) : dim === 'userBehavior' ? (
                  <UserBehaviorFields
                    g={g as ConditionGroupMap['userBehavior']}
                    visibleKeys={keys}
                    onPatch={(p) => onChange(patchGroup(value, 'userBehavior', index, p))}
                  />
                ) : (
                  <SimpleDimFields
                    dim={dim as Exclude<ActiveDimKey, 'member' | 'order' | 'userBehavior'>}
                    g={g as Record<string, any>}
                    visibleKeys={keys}
                    onPatch={(p) => onChange(patchGroup(value, dim, index, p as any))}
                  />
                )
              ) : (
                <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  尚未添加筛选条件
                </Typography.Text>
              )}
              <div
                role="button"
                tabIndex={0}
                style={{ ...addFilterBoxStyle, marginTop: keys.length ? 12 : 0 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1677ff';
                  e.currentTarget.style.color = '#1677ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = 'rgba(0,0,0,0.45)';
                }}
                onClick={() => openAddFilters(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openAddFilters(index);
                }}
              >
                <PlusOutlined style={{ marginRight: 8 }} />
                添加筛选条件
              </div>
            </Card>
          </React.Fragment>
        );
      })}
      <Button type="dashed" block onClick={addGroup}>
        添加一组（组与组之间为「或」）
      </Button>
      <Modal
        title={`添加筛选条件 · ${DIM_LABELS[dim as ActiveDimKey] || dim}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={confirmFilters}
        okText="确定"
        destroyOnHidden
        width={560}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          点击标签切换选中/未选中，确定后写入条件组。
        </Typography.Paragraph>
        <Space wrap size={[8, 8]} style={{ width: '100%' }}>
          {catalog.map((item) => {
            const checked = draftKeys.includes(item.key);
            return (
              <Tag.CheckableTag
                key={item.key}
                checked={checked}
                onChange={() => toggleDraftKey(item.key)}
                style={{
                  marginInlineEnd: 0,
                  padding: '4px 10px',
                  fontSize: 13,
                  border: checked ? '1px solid #1677ff' : '1px solid #d9d9d9',
                  background: checked ? undefined : '#fafafa',
                }}
              >
                {item.label}
              </Tag.CheckableTag>
            );
          })}
        </Space>
      </Modal>
    </div>
  );
};


const TagRuleConditionsEditor: React.FC<Props> = ({ value, onChange }) => {
  const v = value || emptyTagRuleConditions();
  const [activeKey, setActiveKey] = useState<ActiveDimKey>('userBehavior');
  const dimLogic: DimLogic = v.dimLogic === 'OR' ? 'OR' : 'AND';

  return (
    <div style={{ width: '100%', display: 'block' }}>
      <style>{`
        .tag-rule-dim-tabs {
          width: 100% !important;
          display: block !important;
        }
        .tag-rule-dim-tabs .ant-tabs-nav {
          width: 100% !important;
        }
        .tag-rule-dim-tabs .ant-tabs-nav-wrap {
          flex: 1 1 auto !important;
        }
        .tag-rule-dim-tabs .ant-tabs-content-holder,
        .tag-rule-dim-tabs .ant-tabs-content,
        .tag-rule-dim-tabs .ant-tabs-tabpane {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          overflow: visible !important;
        }
        .tag-rule-dim-pane {
          width: 100% !important;
          box-sizing: border-box;
          height: auto !important;
          overflow: visible !important;
        }
        .tag-rule-dim-logic.ant-radio-group .ant-radio-button-wrapper {
          transition: none !important;
        }
        .tag-rule-dim-logic.ant-radio-group .ant-radio-button-wrapper::before {
          transition: none !important;
          display: none !important;
        }
        .ant-pro-steps-form .ant-form,
        .ant-pro-steps-form-container {
          max-width: 100% !important;
          width: 100% !important;
        }
      `}</style>
      <Tabs
        className="tag-rule-dim-tabs"
        size="small"
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as ActiveDimKey)}
        destroyInactiveTabPane={false}
        style={{ width: '100%' }}
        tabBarExtraContent={
          <Space size={8} align="center">
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              维度之间
            </Typography.Text>
            <Radio.Group
              className="tag-rule-dim-logic"
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={dimLogic}
              onChange={(e) =>
                onChange({ ...v, dimLogic: e.target.value as DimLogic })
              }
              options={[
                { label: '且', value: 'AND' },
                { label: '或', value: 'OR' },
              ]}
            />
            <Tooltip
              title={
                <div style={{ maxWidth: 280 }}>
                  控制多个维度 Tab 之间的组合关系：选「且」表示需同时满足各维度条件；选「或」表示满足任一维度即可。组内字段仍为「且」，条件组与条件组之间仍为「或」。
                </div>
              }
              placement="bottomRight"
            >
              <QuestionCircleOutlined
                style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, cursor: 'help' }}
              />
            </Tooltip>
          </Space>
        }
        items={DIM_KEYS.map((dim) => ({
          key: dim,
          label: DIM_LABELS[dim],
          children: (
            <div className="tag-rule-dim-pane" style={{ width: '100%', boxSizing: 'border-box' }}>
              <DimPanel dim={dim} value={v} onChange={onChange} />
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default TagRuleConditionsEditor;
