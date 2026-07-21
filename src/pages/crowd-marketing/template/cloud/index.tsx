import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, Card, Col, Modal, Row, Tabs, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { listPagination, listSearchProps } from '@/utils/listSearch';

type CloudItem = {
  id: string;
  name: string;
  scene: string;
  type: string;
  receivedAt: string;
};

const CloudTemplatePage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [tab, setTab] = useState('cloud');
  const [cards, setCards] = useState<CloudItem[]>([]);

  useEffect(() => {
    if (tab === 'cloud') {
      request('/api/crowd-marketing/templates/cloud', {
        params: { current: 1, pageSize: 20, type: '云模板' },
      }).then((res) => setCards(res.data || []));
    }
  }, [tab]);

  const columns: ProColumns<CloudItem>[] = [
    { title: '模板名称/ID', dataIndex: 'keyword', hideInTable: true },
    {
      title: '模板类型',
      dataIndex: 'typeSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        全部: { text: '全部' },
        专属模板: { text: '专属模板' },
      },
      initialValue: '全部',
    },
    {
      title: '接收时间',
      dataIndex: 'receivedAtRange',
      hideInTable: true,
      valueType: 'dateRange',
    },
    { title: '模板ID', dataIndex: 'id', search: false, width: 100 },
    { title: '模板名称', dataIndex: 'name', search: false },
    { title: '模板类型', dataIndex: 'type', search: false, width: 110 },
    { title: '场景', dataIndex: 'scene', search: false, width: 100 },
    { title: '接收时间', dataIndex: 'receivedAt', search: false, width: 170 },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      search: false,
      render: () => [
        <a key="use" onClick={() => message.success('已使用模板（演示）')}>
          使用
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
      <ProCard className="panel-surface">
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: 'cloud',
              label: '云模板库',
              children: (
                <Row gutter={[16, 16]}>
                  {cards.map((item) => (
                    <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                      <Card
                        title={item.name}
                        extra={<Tag>{item.scene}</Tag>}
                        actions={[
                          <a key="more" onClick={() => message.info('更多操作（演示）')}>
                            更多
                          </a>,
                          <a key="use" onClick={() => message.success('已使用（演示）')}>
                            使用
                          </a>,
                        ]}
                      >
                        <div>模板ID：{item.id}</div>
                        <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
                          按场景类型浏览云模板卡片
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: 'exclusive',
              label: '专属模板',
              children: (
                <ProTable<CloudItem>
                  actionRef={actionRef}
                  rowKey="id"
                  columns={columns}
                  search={listSearchProps}
                  pagination={listPagination}
                  rowSelection={{}}
                  toolBarRender={() => [
                    <Button
                      key="batchDel"
                      onClick={() => message.success('已批量删除（演示）')}
                    >
                      批量删除
                    </Button>,
                  ]}
                  request={async (params) =>
                    request('/api/crowd-marketing/templates/cloud', {
                      params: {
                        ...params,
                        keyword: params.keyword,
                        type:
                          params.typeSearch && params.typeSearch !== '全部'
                            ? params.typeSearch
                            : '专属模板',
                      },
                    })
                  }
                />
              ),
            },
          ]}
        />
      </ProCard>
    </PageContainer>
  );
};

export default CloudTemplatePage;
