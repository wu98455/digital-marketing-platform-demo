import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { history, request } from '@umijs/max';
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useMemo, useState } from 'react';
import { colorForGroup, tagKey, useTagCatalog, type TagItem } from '@/components/Tagging';

const TagsLibraryPage: React.FC = () => {
  const { getCatalog, addGroup, addTag, renameTag, deleteTag } = useTagCatalog();
  const catalog = getCatalog('customer');
  const [keyword, setKeyword] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<TagItem | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const filtered = useMemo(() => {
    const k = keyword.trim();
    if (!k) return catalog;
    return catalog
      .map((g) => ({
        group: g.group,
        tags: g.tags.filter((t) => g.group.includes(k) || t.includes(k)),
      }))
      .filter((g) => g.tags.length > 0 || g.group.includes(k));
  }, [catalog, keyword]);

  const createCrowd = async (item: TagItem) => {
    const res = await request<{ success: boolean; data?: { name: string } }>(
      '/api/tag-center/tags/create-crowd',
      {
        method: 'POST',
        data: { group: item.group, tag: item.tag, name: `标签「${item.tag}」人群` },
      },
    );
    if (res?.success === false) {
      message.error('生成失败');
      return;
    }
    message.success(`已生成目标人群「${res.data?.name}」`);
    history.push('/crowd');
  };

  return (
    <PageContainer title={false}>
      <ProCard
        title="会员标签库"
        bordered
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="搜索分组/标签"
              style={{ width: 220 }}
              onSearch={setKeyword}
              onChange={(e) => {
                if (!e.target.value) setKeyword('');
              }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
              新建标签
            </Button>
          </Space>
        }
      >
        <Typography.Paragraph type="secondary">
          标签只用于给人打标；可从打标规则选用，也可生成目标人群供画布使用。
        </Typography.Paragraph>
        {!filtered.length ? (
          <Empty description="暂无标签" />
        ) : (
          filtered.map((g) => (
            <div key={g.group} style={{ marginBottom: 20 }}>
              <Typography.Text strong style={{ marginBottom: 8, display: 'block' }}>
                {g.group}
              </Typography.Text>
              <Space wrap size={[8, 8]}>
                {g.tags.map((tag) => {
                  const item = { group: g.group, tag };
                  return (
                    <Tag
                      key={tagKey(item)}
                      color={colorForGroup(g.group, catalog)}
                      style={{ paddingInline: 10, lineHeight: '28px' }}
                    >
                      {tag}
                      <EditOutlined
                        style={{ marginLeft: 8, cursor: 'pointer' }}
                        onClick={() => {
                          setEditItem(item);
                          editForm.setFieldsValue(item);
                        }}
                      />
                      <a style={{ marginLeft: 8 }} onClick={() => createCrowd(item)}>
                        生成人群
                      </a>
                      <DeleteOutlined
                        style={{ marginLeft: 8, cursor: 'pointer', color: '#ff4d4f' }}
                        onClick={() => {
                          Modal.confirm({
                            title: `删除标签「${tag}」？`,
                            onOk: () => {
                              deleteTag('customer', item);
                              message.success('已删除');
                            },
                          });
                        }}
                      />
                    </Tag>
                  );
                })}
              </Space>
            </div>
          ))
        )}
      </ProCard>

      <Modal
        title="新建标签"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          let group = values.group as string;
          if (values.newGroup?.trim()) {
            const err = addGroup('customer', values.newGroup.trim());
            if (err && err !== '分组已存在') {
              message.error(err);
              return;
            }
            group = values.newGroup.trim();
          }
          const err = addTag('customer', group, values.tag.trim());
          if (err) {
            message.error(err);
            return;
          }
          message.success('已添加');
          form.resetFields();
          setAddOpen(false);
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item label="已有分组" name="group">
            <Select
              allowClear
              options={catalog.map((g) => ({ label: g.group, value: g.group }))}
              placeholder="选择分组"
            />
          </Form.Item>
          <Form.Item label="或新建分组" name="newGroup">
            <Input placeholder="如：营销响应" />
          </Form.Item>
          <Form.Item label="标签名" name="tag" rules={[{ required: true }]}>
            <Input placeholder="如：高核销" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑标签"
        open={!!editItem}
        onCancel={() => setEditItem(null)}
        onOk={async () => {
          if (!editItem) return;
          const values = await editForm.validateFields();
          const err = renameTag('customer', editItem, {
            group: values.group,
            tag: values.tag.trim(),
          });
          if (err) {
            message.error(err);
            return;
          }
          message.success('已更新');
          setEditItem(null);
        }}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="分组" name="group" rules={[{ required: true }]}>
            <Select options={catalog.map((g) => ({ label: g.group, value: g.group }))} />
          </Form.Item>
          <Form.Item label="标签名" name="tag" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default TagsLibraryPage;
