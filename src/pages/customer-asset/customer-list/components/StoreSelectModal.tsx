import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Badge, Button, Input, Modal, Select, Tabs, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { listPagination } from '@/utils/listSearch';

export type StoreItem = {
  id: string;
  name: string;
  storeId: string;
  platform: string;
  type: string;
  area: string;
  attr: string;
};

type Props = {
  open: boolean;
  value: { id: string; name: string }[];
  onOk: (rows: { id: string; name: string }[]) => void;
  onCancel: () => void;
};

const StoreSelectModal: React.FC<Props> = ({ open, value, onOk, onCancel }) => {
  const [allStores, setAllStores] = useState<StoreItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, StoreItem>>({});
  const [tab, setTab] = useState('all');
  const [platform, setPlatform] = useState<string>();
  const [storeType, setStoreType] = useState<string>();
  const [keyword, setKeyword] = useState<string>();
  const [area, setArea] = useState<string>();

  useEffect(() => {
    if (!open) return;
    request<{ data: StoreItem[] }>('/api/customer-asset/stores').then((res) => {
      setAllStores(res.data || []);
    });
    const keys = value.map((v) => v.id);
    setSelectedKeys(keys);
    const map: Record<string, StoreItem> = {};
    value.forEach((v) => {
      map[v.id] = { id: v.id, name: v.name } as StoreItem;
    });
    setSelectedMap(map);
    setTab('all');
  }, [open, value]);

  const filtered = useMemo(() => {
    return allStores.filter((s) => {
      if (platform && platform !== '全部平台' && s.platform !== platform) return false;
      if (storeType && storeType !== '全部' && s.type !== storeType) return false;
      if (keyword && !s.name.includes(keyword)) return false;
      if (area && area !== '全部' && s.area !== area && !(area === '--' && (!s.area || s.area === '--')))
        return false;
      return true;
    });
  }, [allStores, platform, storeType, keyword, area]);

  const selectedList = useMemo(
    () =>
      selectedKeys
        .map((k) => selectedMap[String(k)] || allStores.find((s) => s.id === k))
        .filter(Boolean) as StoreItem[],
    [selectedKeys, selectedMap, allStores],
  );

  const columns: ProColumns<StoreItem>[] = [
    { title: '店铺/微信名称', dataIndex: 'name', ellipsis: true },
    { title: '店铺/微信ID/AppID', dataIndex: 'storeId', search: false },
    { title: '平台', dataIndex: 'platform', search: false },
    { title: '店铺/微信类型', dataIndex: 'type', search: false },
    {
      title: '线下店铺区域',
      dataIndex: 'area',
      search: false,
      render: (v) => v || '--',
    },
    {
      title: '店铺属性',
      dataIndex: 'attr',
      search: false,
      render: (v) => v || '--',
    },
  ];

  return (
    <Modal
      title="选择店铺"
      open={open}
      width={960}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => {
        if (selectedList.length === 0) {
          message.warning('未选择店铺将清空店铺筛选');
        }
        onOk(selectedList.map((s) => ({ id: s.id, name: s.name })));
      }}
      okText="确定"
      cancelText="取消"
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'all', label: '全部店铺' },
          {
            key: 'selected',
            label: (
              <span>
                已选店铺 <Badge count={selectedKeys.length} style={{ marginLeft: 4 }} />
              </span>
            ),
          },
        ]}
      />
      <ProTable<StoreItem>
        rowKey="id"
        size="small"
        search={false}
        options={false}
        pagination={{
          ...listPagination,
          showTotal: (t) => `共 ${t} 条`,
        }}
        toolBarRender={() => [
          <div
            key="filter"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto auto',
              gap: 8,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Select
              placeholder="平台"
              value={platform || '全部平台'}
              onChange={setPlatform}
              options={[
                '全部平台',
                '测试平台',
                '国企优品',
                '重庆文旅集团大会员',
                '惠游重庆',
              ].map((p) => ({ label: p, value: p }))}
            />
            <Select
              placeholder="店铺/微信类型"
              value={storeType || '全部'}
              onChange={setStoreType}
              options={['全部', '普通单店'].map((p) => ({ label: p, value: p }))}
            />
            <Input
              placeholder="店铺/微信名称"
              value={keyword || ''}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
            <Select
              placeholder="线下店铺区域"
              value={area || '全部'}
              onChange={setArea}
              options={[
                '全部',
                '重庆市渝中区',
                '重庆市江北区',
                '重庆市渝北区',
                '重庆市南岸区',
                '--',
              ].map((p) => ({ label: p === '--' ? '空/--' : p, value: p }))}
            />
            <Button type="primary">查询</Button>
            <Button
              onClick={() => {
                setPlatform(undefined);
                setStoreType(undefined);
                setKeyword(undefined);
                setArea(undefined);
              }}
            >
              重置
            </Button>
            {tab === 'selected' && (
              <Button
                onClick={() => {
                  setSelectedKeys([]);
                  setSelectedMap({});
                }}
              >
                移除全部
              </Button>
            )}
          </div>,
        ]}
        columns={
          tab === 'selected'
            ? [
                ...columns,
                {
                  title: '操作',
                  valueType: 'option',
                  render: (_, row) => [
                    <Button
                      key="rm"
                      type="link"
                      danger
                      onClick={() => {
                        setSelectedKeys((ks) => ks.filter((k) => k !== row.id));
                        setSelectedMap((m) => {
                          const next = { ...m };
                          delete next[row.id];
                          return next;
                        });
                      }}
                    >
                      移除
                    </Button>,
                  ],
                },
              ]
            : columns
        }
        dataSource={tab === 'selected' ? selectedList : filtered}
        rowSelection={
          tab === 'all'
            ? {
                selectedRowKeys: selectedKeys,
                onChange: (keys, rows) => {
                  setSelectedKeys(keys);
                  setSelectedMap((prev) => {
                    const next = { ...prev };
                    rows.forEach((r) => {
                      if (r) next[r.id] = r;
                    });
                    keys.forEach((k) => {
                      if (!next[String(k)]) {
                        const found = allStores.find((s) => s.id === k);
                        if (found) next[String(k)] = found;
                      }
                    });
                    Object.keys(next).forEach((id) => {
                      if (!keys.includes(id)) delete next[id];
                    });
                    return next;
                  });
                },
              }
            : undefined
        }
        tableAlertRender={false}
        footer={() => `已选店铺 ${selectedKeys.length} 个`}
      />
    </Modal>
  );
};

export default StoreSelectModal;
