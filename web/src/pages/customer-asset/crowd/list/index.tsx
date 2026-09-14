import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, request, useLocation } from '@umijs/max';
import { Alert, Button, Checkbox, Modal, Space, Tag, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import CenterTags from '@/components/CenterTags';
import type { CalcStatus } from '@/utils/asyncCalc';
import { CALC_STATUS_TEXT } from '@/utils/asyncCalc';
import { MARKETING_CENTERS } from '@/utils/centers';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type CrowdItem = {
  id: string;
  name: string;
  count: number;
  type: string;
  creator: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  catalog: string;
  canDelete?: boolean;
  canCopy?: boolean;
  centers?: string[];
  calcStatus?: CalcStatus;
  calcError?: string;
};

const CrowdList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [hasCalculating, setHasCalculating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search || '');
    if (q.get('create') === '1') {
      history.replace('/crowd/create');
    }
  }, [location.search]);

  useEffect(() => {
    if (!hasCalculating) return undefined;
    const timer = window.setInterval(() => {
      actionRef.current?.reload();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hasCalculating]);

  const recalculate = async (row: CrowdItem) => {
    const res = await request<{ success: boolean; errorMessage?: string }>(
      `/api/customer-asset/crowds/${row.id}/recalculate`,
      { method: 'POST' },
    );
    if (res?.success === false) {
      message.error(res.errorMessage || '提交失败');
      return;
    }
    message.success('已提交计算');
    actionRef.current?.reload();
  };

  const removeRow = (row: CrowdItem) => {
    Modal.confirm({
      title: '确认删除该人群？',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await request<{ success: boolean; errorMessage?: string }>(
          `/api/customer-asset/crowds/${row.id}`,
          { method: 'DELETE' },
        );
        if (res?.success === false) {
          message.error(res.errorMessage || '删除失败');
          return;
        }
        message.success('已删除');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<CrowdItem>[] = [
    {
      title: '人群名称/ID',
      dataIndex: 'keyword',
      hideInTable: true,
    },
    {
      title: '创建人',
      dataIndex: 'creatorSearch',
      hideInTable: true,
    },
    {
      title: '人群类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        静态人群: { text: '静态人群' },
        条件人群: { text: '条件人群' },
        临时人群: { text: '临时人群' },
      },
    },
    {
      title: '平台',
      dataIndex: 'centerSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: Object.fromEntries(MARKETING_CENTERS.map((c) => [c, { text: c }])),
    },
    {
      title: '计算状态',
      dataIndex: 'calcStatusSearch',
      hideInTable: true,
      valueType: 'select',
      initialValue: '不限',
      valueEnum: {
        不限: { text: '不限' },
        calculating: { text: CALC_STATUS_TEXT.calculating },
        success: { text: CALC_STATUS_TEXT.success },
        failed: { text: CALC_STATUS_TEXT.failed },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    {
      title: '人群ID',
      dataIndex: 'id',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '人群名称',
      dataIndex: 'name',
      search: false,
      width: 220,
      ellipsis: true,
      render: (_, row) =>
        row.calcStatus === 'calculating' ? (
          <span style={{ whiteSpace: 'nowrap' }}>
            {row.name}
            {row.type === '临时人群' ? (
              <Tag color="orange" style={{ marginLeft: 6 }}>
                临时
              </Tag>
            ) : null}
          </span>
        ) : (
          <a
            onClick={() => history.push(`/crowd/detail/${row.id}`)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {row.name}
            {row.type === '临时人群' ? (
              <Tag color="orange" style={{ marginLeft: 6 }}>
                临时
              </Tag>
            ) : null}
          </a>
        ),
    },
    {
      title: '人数',
      dataIndex: 'count',
      search: false,
      width: 90,
      ellipsis: true,
      render: (_, row) =>
        row.calcStatus === 'calculating' || row.calcStatus === 'failed' ? '—' : row.count,
    },
    {
      title: '平台',
      dataIndex: 'centers',
      search: false,
      width: 180,
      render: (_, row) => {
        const n = Number(String(row.id).replace(/\D/g, '') || 0);
        const fallback = [MARKETING_CENTERS[n % MARKETING_CENTERS.length]];
        return <CenterTags centers={row.centers?.length ? row.centers : fallback} />;
      },
    },
    {
      title: '人群类型',
      dataIndex: 'type',
      search: false,
      width: 100,
      ellipsis: true,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      search: false,
      width: 120,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      width: 170,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      search: false,
      width: 170,
      ellipsis: true,
    },
    {
      title: '操作',
      valueType: 'option',
      search: false,
      width: 280,
      fixed: 'right',
      render: (_, row) => {
        const status = row.calcStatus || 'success';
        if (status === 'calculating') {
          return (
            <Button type="link" size="small" loading disabled style={{ padding: 0 }}>
              计算中
            </Button>
          );
        }
        if (status === 'failed') {
          return (
            <Space size={8} direction="vertical">
              {row.calcError ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {row.calcError}
                </Typography.Text>
              ) : null}
              <Space size={8}>
                <Button type="primary" size="small" onClick={() => recalculate(row)}>
                  重新计算
                </Button>
                <Button danger size="small" onClick={() => removeRow(row)}>
                  删除
                </Button>
              </Space>
            </Space>
          );
        }
        return (
          <Space size={8}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => history.push(`/crowd/detail/${row.id}`)}
            >
              详情
            </Button>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => recalculate(row)}
            >
              更新人群
            </Button>
            <Button
              type="link"
              size="small"
              disabled={!row.canCopy}
              style={{ padding: 0 }}
              onClick={() => {
                history.push(
                  `/crowd/create?copyName=${encodeURIComponent(`${row.name}（副本）`)}`,
                );
              }}
            >
              复制
            </Button>
            <Button
              type="link"
              size="small"
              danger
              disabled={row.canDelete === false}
              style={{ padding: 0 }}
              onClick={() => removeRow(row)}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer title={false}>
      <Alert
        type="info"
        showIcon
        closable
        style={{ marginBottom: 16 }}
        message={
          <span>
            还没有合适的标签？
            <a onClick={() => history.push('/tag-center/list')} style={{ marginLeft: 4 }}>
              先去人群标签
            </a>
            ，再回来新建目标人群。
          </span>
        }
      />
      <ProTable<CrowdItem>
        headerTitle="目标人群"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={listSearchProps}
        pagination={listPagination}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={() => history.push('/crowd/create')}>
            新建目标人群
          </Button>,
          <Checkbox
            key="mine"
            checked={onlyMine}
            onChange={(e) => {
              setOnlyMine(e.target.checked);
              actionRef.current?.reload();
            }}
          >
            只显示我创建的
          </Checkbox>,
        ]}
        request={async (params) => {
          const range = params.createdAtRange as string[] | undefined;
          const res = await request<{ data: CrowdItem[]; total: number; success: boolean }>(
            '/api/customer-asset/crowds',
            {
              params: {
                ...params,
                keyword: params.keyword,
                creator: params.creatorSearch || params.creator,
                type: params.typeSearch || params.type,
                center: params.centerSearch,
                calcStatus:
                  params.calcStatusSearch && params.calcStatusSearch !== '不限'
                    ? params.calcStatusSearch
                    : undefined,
                createdAtRange: range?.length === 2 ? range.join(',') : undefined,
                onlyMine: onlyMine ? 'true' : undefined,
              },
            },
          );
          const data = res.data || [];
          setHasCalculating(data.some((x) => x.calcStatus === 'calculating'));
          return res;
        }}
      />
    </PageContainer>
  );
};

export default CrowdList;
