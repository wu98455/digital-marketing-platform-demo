import {
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormDateRangePicker,
} from '@ant-design/pro-components';
import { Button, Card, InputNumber, Select, Space, Tabs, Typography } from 'antd';
import React, { useLayoutEffect, useRef, useState } from 'react';
import type {
  ConditionGroupMap,
  DimKey,
  TagRuleConditions,
} from '@/utils/tagRuleTypes';
import { CONDITION_OPS, emptyGroup, emptyTagRuleConditions } from '@/utils/tagRuleTypes';

type Props = {
  value?: TagRuleConditions;
  onChange: (next: TagRuleConditions) => void;
};

const DIM_LABEL: Record<DimKey, string> = {
  member: '会员',
  order: '订单',
  product: '商品与供应商',
  combo: '联票与策略',
  campaign: '活动专题',
  coupon: '优惠券',
  points: '积分商城',
  storedValue: '优品/储值卡',
  userBehavior: '用户行为',
};

const COMPANIES = ['乐和乐都', '阿依河', '金刀峡', '乌江画廊景区'];
const BUY_TYPES = [
  { label: '门票类', value: '门票类' },
  { label: '酒店类', value: '酒店类' },
  { label: '餐饮类', value: '餐饮类' },
];

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

const MemberFields: React.FC<{
  g: ConditionGroupMap['member'];
  onPatch: (p: Partial<ConditionGroupMap['member']>) => void;
}> = ({ g, onPatch }) => (
  <Space wrap size={[16, 12]} style={{ width: '100%' }}>
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
    <ProFormSelect
      label="生日月份"
      mode="multiple"
      options={Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}月`,
        value: String(i + 1),
      }))}
      fieldProps={{
        value: g.birthdayMonths,
        onChange: (v) => onPatch({ birthdayMonths: v }),
        style: { width: 200 },
      }}
    />
    <OpFields label="年龄" value={g.age} onChange={(age) => onPatch({ age })} />
    <ProFormText
      label="地区"
      placeholder="省/市/区"
      fieldProps={{
        value: g.region,
        onChange: (e) => onPatch({ region: e.target.value || undefined }),
        style: { width: 160 },
      }}
    />
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
    <ProFormDateRangePicker
      label="注册时间"
      fieldProps={{
        value: g.registrationRange as any,
        onChange: (_: any, str: [string, string]) =>
          onPatch({ registrationRange: str?.[0] ? str : undefined }),
      }}
    />
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
    <ProFormSelect
      label="会员卡"
      options={['年卡', '次卡', '亲子卡', '无'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.vipCard,
        onChange: (v) => onPatch({ vipCard: v }),
        style: { width: 140 },
      }}
    />
    <ProFormSelect
      label="下单次数档"
      options={['0次', '1次', '2-5次', '5次以上'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.createOrderNoType,
        onChange: (v) => onPatch({ createOrderNoType: v }),
        style: { width: 140 },
      }}
    />
    <ProFormSelect
      label="账户类型"
      options={['会员', '非会员'].map((v) => ({ label: v, value: v }))}
      fieldProps={{
        allowClear: true,
        value: g.userType,
        onChange: (v) => onPatch({ userType: v }),
        style: { width: 120 },
      }}
    />
    <ProFormText
      label="手机号"
      fieldProps={{
        value: g.phone,
        onChange: (e) => onPatch({ phone: e.target.value || undefined }),
        style: { width: 140 },
      }}
    />
  </Space>
);

const OrderFields: React.FC<{
  g: ConditionGroupMap['order'];
  onPatch: (p: Partial<ConditionGroupMap['order']>) => void;
}> = ({ g, onPatch }) => (
  <Space direction="vertical" size={12} style={{ width: '100%' }}>
    <Typography.Text type="secondary">
      按订单字段搜索命中订单，再对下单人打标（组内且、组间或）
    </Typography.Text>
    <Space wrap size={[16, 12]} style={{ width: '100%' }}>
      <ProFormText
        label="主订单编号"
        fieldProps={{
          value: g.ticketOrderPaymentId,
          onChange: (e) => onPatch({ ticketOrderPaymentId: e.target.value || undefined }),
          style: { width: 160 },
        }}
      />
      <ProFormText
        label="订单编号"
        fieldProps={{
          value: g.orderCode,
          onChange: (e) => onPatch({ orderCode: e.target.value || undefined }),
          style: { width: 160 },
        }}
      />
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
      <ProFormText
        label="手机号"
        fieldProps={{
          value: g.buyTicketPhone,
          onChange: (e) => onPatch({ buyTicketPhone: e.target.value || undefined }),
          style: { width: 140 },
        }}
      />
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
      <ProFormText
        label="商品名称"
        fieldProps={{
          value: g.projectName,
          onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
          style: { width: 160 },
        }}
      />
      <ProFormSelect
        label="分类"
        options={['门票', '酒店', '餐饮', '文创', '联票'].map((v) => ({ label: v, value: v }))}
        fieldProps={{
          allowClear: true,
          value: g.categorysId,
          onChange: (v) => onPatch({ categorysId: v }),
          style: { width: 120 },
        }}
      />
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
      <ProFormDateRangePicker
        label="下单日期"
        fieldProps={{
          value: g.createTimeRange as any,
          onChange: (_: any, str: [string, string]) =>
            onPatch({ createTimeRange: str?.[0] ? str : undefined }),
        }}
      />
      <ProFormDateRangePicker
        label="退单日期"
        fieldProps={{
          value: g.refuseTimeRange as any,
          onChange: (_: any, str: [string, string]) =>
            onPatch({ refuseTimeRange: str?.[0] ? str : undefined }),
        }}
      />
      <ProFormDateRangePicker
        label="完成日期"
        fieldProps={{
          value: g.verificationRange as any,
          onChange: (_: any, str: [string, string]) =>
            onPatch({ verificationRange: str?.[0] ? str : undefined }),
        }}
      />
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
      <ProFormSelect
        label="销售渠道"
        options={['小程序', 'APP', '官网', '门店POS', '分销', 'OTA'].map((v) => ({
          label: v,
          value: v,
        }))}
        fieldProps={{
          allowClear: true,
          value: g.orderType,
          onChange: (v) => onPatch({ orderType: v }),
          style: { width: 140 },
        }}
      />
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
      <ProFormText
        label="分销人姓名"
        fieldProps={{
          value: g.distributionUserName,
          onChange: (e) => onPatch({ distributionUserName: e.target.value || undefined }),
          style: { width: 140 },
        }}
      />
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
      <OpFields label="购买金额" value={g.amount} onChange={(amount) => onPatch({ amount })} />
      <OpFields label="购买次数" value={g.frequency} onChange={(frequency) => onPatch({ frequency })} />
      <OpFields
        label="平均客单价"
        value={g.avgUnitPrice}
        onChange={(avgUnitPrice) => onPatch({ avgUnitPrice })}
      />
      <ProFormText
        label="购买商品名称"
        fieldProps={{
          value: g.customerBuyGoodsName,
          onChange: (e) => onPatch({ customerBuyGoodsName: e.target.value || undefined }),
          style: { width: 160 },
        }}
      />
    </Space>
  </Space>
);

const SimpleDimFields: React.FC<{
  dim: DimKey;
  g: Record<string, any>;
  onPatch: (p: Record<string, any>) => void;
}> = ({ dim, g, onPatch }) => {
  if (dim === 'product') {
    return (
      <Space wrap size={[16, 12]}>
        <ProFormText
          label="商品名称"
          fieldProps={{
            value: g.projectName,
            onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
        <ProFormSelect
          label="产品类型"
          mode="multiple"
          options={BUY_TYPES}
          fieldProps={{
            value: g.buyType,
            onChange: (v) => onPatch({ buyType: v }),
            style: { width: 200 },
          }}
        />
        <ProFormSelect
          label="公司"
          mode="multiple"
          options={COMPANIES.map((v) => ({ label: v, value: v }))}
          fieldProps={{
            value: g.buyCompany,
            onChange: (v) => onPatch({ buyCompany: v }),
            style: { width: 220 },
          }}
        />
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
        <OpFields
          label="近购次数近似"
          value={g.recentBuyApprox}
          onChange={(recentBuyApprox) => onPatch({ recentBuyApprox })}
        />
      </Space>
    );
  }
  if (dim === 'combo') {
    return (
      <Space wrap size={[16, 12]}>
        <ProFormText
          label="商品名称"
          fieldProps={{
            value: g.projectName,
            onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
        <ProFormSelect
          label="品类"
          mode="multiple"
          options={BUY_TYPES}
          fieldProps={{
            value: g.buyType,
            onChange: (v) => onPatch({ buyType: v }),
            style: { width: 200 },
          }}
        />
        <ProFormSelect
          label="是否套餐票"
          options={['是', '否'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.isPackageTicket,
            onChange: (v) => onPatch({ isPackageTicket: v }),
            style: { width: 120 },
          }}
        />
      </Space>
    );
  }
  if (dim === 'campaign') {
    return (
      <Space wrap size={[16, 12]}>
        <ProFormText
          label="渠道名称"
          fieldProps={{
            value: g.channelName,
            onChange: (e) => onPatch({ channelName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
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
      </Space>
    );
  }
  if (dim === 'coupon') {
    return (
      <Space wrap size={[16, 12]}>
        <ProFormText
          label="券名称"
          fieldProps={{
            value: g.name,
            onChange: (e) => onPatch({ name: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
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
      </Space>
    );
  }
  if (dim === 'points') {
    return (
      <Space wrap size={[16, 12]}>
        <ProFormText
          label="积分商品"
          fieldProps={{
            value: g.projectName,
            onChange: (e) => onPatch({ projectName: e.target.value || undefined }),
            style: { width: 160 },
          }}
        />
        <ProFormDigit
          label="积分不低于"
          fieldProps={{
            value: g.integralMin,
            onChange: (v) => onPatch({ integralMin: Number(v) || undefined }),
            style: { width: 120 },
          }}
        />
        <ProFormDigit
          label="积分不高于"
          fieldProps={{
            value: g.integralMax,
            onChange: (v) => onPatch({ integralMax: Number(v) || undefined }),
            style: { width: 120 },
          }}
        />
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
        <ProFormSelect
          label="积分行为"
          options={['获取', '发放', '使用/兑换', '回流'].map((v) => ({ label: v, value: v }))}
          fieldProps={{
            allowClear: true,
            value: g.pointsAction,
            onChange: (v) => onPatch({ pointsAction: v }),
            style: { width: 140 },
          }}
        />
      </Space>
    );
  }
  return (
    <Space wrap size={[16, 12]}>
      <ProFormText
        label="优品订单号"
        fieldProps={{
          value: g.orderNumber,
          onChange: (e) => onPatch({ orderNumber: e.target.value || undefined }),
          style: { width: 150 },
        }}
      />
      <ProFormText
        label="商品名称"
        fieldProps={{
          value: g.prodName,
          onChange: (e) => onPatch({ prodName: e.target.value || undefined }),
          style: { width: 150 },
        }}
      />
      <ProFormText
        label="手机号"
        fieldProps={{
          value: g.userPhone,
          onChange: (e) => onPatch({ userPhone: e.target.value || undefined }),
          style: { width: 140 },
        }}
      />
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
      <ProFormText
        label="单位名称"
        fieldProps={{
          value: g.companyName,
          onChange: (e) => onPatch({ companyName: e.target.value || undefined }),
          style: { width: 150 },
        }}
      />
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
      <ProFormText
        label="卡名称关键词"
        fieldProps={{
          value: g.cardName,
          onChange: (e) => onPatch({ cardName: e.target.value || undefined }),
          style: { width: 150 },
        }}
      />
    </Space>
  );
};

const USER_BEHAVIOR_TIME_NODES = ['近7天', '近30天', '近90天', '近180天', '近1年'].map((v) => ({
  label: v,
  value: v,
}));
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
}> = ({ g, onPatch }) => (
  <div style={{ maxWidth: 360 }}>
    <ProFormSelect
      label="时间节点"
      options={USER_BEHAVIOR_TIME_NODES}
      fieldProps={{
        allowClear: true,
        placeholder: '可选',
        value: g.timeNode,
        onChange: (v) => onPatch({ timeNode: v }),
      }}
    />
    <ProFormSelect
      label="事件条件"
      options={USER_BEHAVIOR_EVENTS}
      fieldProps={{
        allowClear: true,
        placeholder: '可选',
        value: g.eventCondition,
        onChange: (v) => onPatch({ eventCondition: v }),
      }}
    />
    <ProFormSelect
      label="数据反馈"
      options={USER_BEHAVIOR_FEEDBACK}
      fieldProps={{
        allowClear: true,
        placeholder: '可选',
        value: g.dataFeedback,
        onChange: (v) => onPatch({ dataFeedback: v }),
      }}
    />
    <ProFormSelect
      label="互动行为"
      options={USER_BEHAVIOR_INTERACTIONS}
      fieldProps={{
        allowClear: true,
        placeholder: '可选',
        value: g.interactionBehavior,
        onChange: (v) => onPatch({ interactionBehavior: v }),
      }}
    />
  </div>
);

const DimPanel: React.FC<{
  dim: DimKey;
  value: TagRuleConditions;
  onChange: (next: TagRuleConditions) => void;
}> = ({ dim, value, onChange }) => {
  const groups = value[dim]?.groups?.length ? value[dim].groups : [emptyGroup(dim)];

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

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Typography.Text type="secondary">组内条件为「且」，组与组之间为「或」</Typography.Text>
      {groups.map((g, index) => (
        <Card
          key={`${dim}-${index}`}
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
          {dim === 'member' ? (
            <MemberFields
              g={g as ConditionGroupMap['member']}
              onPatch={(p) => onChange(patchGroup(value, 'member', index, p))}
            />
          ) : dim === 'order' ? (
            <OrderFields
              g={g as ConditionGroupMap['order']}
              onPatch={(p) => onChange(patchGroup(value, 'order', index, p))}
            />
          ) : dim === 'userBehavior' ? (
            <UserBehaviorFields
              g={g as ConditionGroupMap['userBehavior']}
              onPatch={(p) => onChange(patchGroup(value, 'userBehavior', index, p))}
            />
          ) : (
            <SimpleDimFields
              dim={dim}
              g={g as Record<string, any>}
              onPatch={(p) => onChange(patchGroup(value, dim, index, p as any))}
            />
          )}
        </Card>
      ))}
      <Button type="dashed" block onClick={addGroup}>
        添加一组
      </Button>
    </div>
  );
};

const TagRuleConditionsEditor: React.FC<Props> = ({ value, onChange }) => {
  const v = value || emptyTagRuleConditions();
  const [activeKey, setActiveKey] = useState<DimKey>('member');
  const memberPaneRef = useRef<HTMLDivElement>(null);
  const [paneHeight, setPaneHeight] = useState(0);

  useLayoutEffect(() => {
    if (activeKey !== 'member') return;
    const el = memberPaneRef.current;
    if (!el) return;
    const h = Math.ceil(el.getBoundingClientRect().height);
    if (h > 0) setPaneHeight(h);
  }, [activeKey, v.member]);

  return (
    <div style={{ width: '100%', display: 'block' }}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        按经营分析维度筛选要打标的人；多维度之间为「且」。字段对齐现网列表/工坊可搜条件。
      </Typography.Text>
      <style>{`
        .tag-rule-dim-tabs {
          width: 100% !important;
          display: block !important;
        }
        .tag-rule-dim-tabs .ant-tabs-nav {
          width: 100% !important;
        }
        .tag-rule-dim-tabs .ant-tabs-content-holder,
        .tag-rule-dim-tabs .ant-tabs-content,
        .tag-rule-dim-tabs .ant-tabs-tabpane {
          width: 100% !important;
          max-width: 100% !important;
        }
        .tag-rule-dim-pane {
          width: 100% !important;
          box-sizing: border-box;
        }
        /* StepsForm 默认表单区偏窄，红框条件面板拉满 */
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
        onChange={(key) => setActiveKey(key as DimKey)}
        destroyInactiveTabPane={false}
        style={{ width: '100%' }}
        items={(Object.keys(DIM_LABEL) as DimKey[]).map((dim) => ({
          key: dim,
          label: DIM_LABEL[dim],
          children: (
            <div
              className="tag-rule-dim-pane"
              ref={dim === 'member' ? memberPaneRef : undefined}
              style={{
                width: '100%',
                minHeight: paneHeight || undefined,
                height: paneHeight || undefined,
                overflow: 'auto',
                boxSizing: 'border-box',
              }}
            >
              <DimPanel dim={dim} value={v} onChange={onChange} />
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default TagRuleConditionsEditor;
