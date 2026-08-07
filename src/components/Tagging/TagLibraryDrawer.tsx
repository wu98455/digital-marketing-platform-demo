import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Drawer,
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
import type { CatalogKind } from './TagCatalogContext';
import { useTagCatalog } from './TagCatalogContext';
import type { TagItem } from './types';
import { colorForGroup, tagKey } from './types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: CatalogKind;
  title?: string;
  /** 统计某标签被多少条源数据使用 */
  countUsage: (item: TagItem) => number;
  /** 改名确认后同步业务数据上的贴纸 */
  onRenameApply?: (from: TagItem, to: TagItem) => void;
  /** 删除确认后从业务数据撕标 */
  onDeleteApply?: (item: TagItem) => void;
};

const KIND_LABEL: Record<CatalogKind, string> = {
  customer: '客户',
  store: '店铺',
  product: '商品',
  campaign: '专题活动',
};

const TagLibraryDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  kind,
  title,
  countUsage,
  onRenameApply,
  onDeleteApply,
}) => {
  const { getCatalog, addGroup, addTag, renameTag, deleteTag } = useTagCatalog();
  const catalog = getCatalog(kind);
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

  const groupOptions = catalog.map((g) => ({ label: g.group, value: g.group }));

  const handleAdd = async () => {
    const values = await form.validateFields();
    let group = values.group as string;
    if (values.newGroup?.trim()) {
      const err = addGroup(kind, values.newGroup.trim());
      if (err && err !== '分组已存在') {
        message.error(err);
        return;
      }
      group = values.newGroup.trim();
    }
    const err = addTag(kind, group, values.tag);
    if (err) {
      message.error(err);
      return;
    }
    message.success('已新增标签');
    setAddOpen(false);
    form.resetFields();
  };

  const confirmEdit = async () => {
    if (!editItem) return;
    const values = await editForm.validateFields();
    const to: TagItem = { group: values.group, tag: values.tag.trim() };
    const usage = countUsage(editItem);
    const apply = () => {
      const err = renameTag(kind, editItem, to);
      if (err) {
        message.error(err);
        return;
      }
      onRenameApply?.(editItem, to);
      message.success('已更新标签');
      setEditItem(null);
    };
    if (usage > 0) {
      Modal.confirm({
        title: '标签已被使用',
        content: `标签「${editItem.tag}」已被 ${usage} 条${KIND_LABEL[kind]}数据使用。改名后这些数据上的展示将同步为新名称，是否继续？`,
        okText: '继续修改',
        okButtonProps: { danger: true },
        onOk: apply,
      });
    } else {
      apply();
    }
  };

  const confirmDelete = (item: TagItem) => {
    const usage = countUsage(item);
    const apply = () => {
      deleteTag(kind, item);
      onDeleteApply?.(item);
      message.success('已删除标签');
    };
    if (usage > 0) {
      Modal.confirm({
        title: '标签已被使用',
        content: `标签「${item.tag}」已被 ${usage} 条${KIND_LABEL[kind]}数据使用。删除后将从这些数据上移除该标签，是否继续？`,
        okText: '继续删除',
        okButtonProps: { danger: true },
        onOk: apply,
      });
    } else {
      Modal.confirm({
        title: '确认删除该标签？',
        content: `将从${KIND_LABEL[kind]}标签库删除「${item.tag}」。`,
        okText: '删除',
        okButtonProps: { danger: true },
        onOk: apply,
      });
    }
  };

  return (
    <>
      <Drawer
        title={title || `管理标签库 · ${KIND_LABEL[kind]}`}
        open={open}
        onClose={() => onOpenChange(false)}
        width={480}
        destroyOnHidden
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
            新增标签
          </Button>
        }
      >
        <Input.Search
          allowClear
          placeholder="搜索分组 / 标签"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {filtered.length === 0 ? (
          <Empty description="暂无标签" />
        ) : (
          filtered.map((g) => (
            <div key={g.group} style={{ marginBottom: 20 }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                {g.group}
              </Typography.Text>
              <Space wrap size={[8, 8]}>
                {g.tags.length === 0 ? (
                  <Typography.Text type="secondary">本组暂无标签</Typography.Text>
                ) : (
                  g.tags.map((tag) => {
                    const item = { group: g.group, tag };
                    const usage = countUsage(item);
                    return (
                      <Tag
                        key={tagKey(item)}
                        color={colorForGroup(g.group, catalog)}
                        style={{ paddingInlineEnd: 4 }}
                      >
                        <span style={{ marginRight: 6 }}>{tag}</span>
                        {usage > 0 ? (
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 11, marginRight: 4, color: 'inherit', opacity: 0.85 }}
                          >
                            {usage}
                          </Typography.Text>
                        ) : null}
                        <EditOutlined
                          style={{ cursor: 'pointer', marginRight: 4 }}
                          onClick={() => {
                            setEditItem(item);
                            editForm.setFieldsValue({ group: item.group, tag: item.tag });
                          }}
                        />
                        <DeleteOutlined
                          style={{ cursor: 'pointer' }}
                          onClick={() => confirmDelete(item)}
                        />
                      </Tag>
                    );
                  })
                )}
              </Space>
            </div>
          ))
        )}
        <Typography.Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
          数字表示当前会话中已使用该标签的数据条数。编辑/删除占用中的标签会弹窗警示。
        </Typography.Paragraph>
      </Drawer>

      <Modal
        title="新增标签"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={handleAdd}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="group" label="所属分组" rules={[{ required: true, message: '请选择分组' }]}>
            <Select options={groupOptions} placeholder="选择分组" />
          </Form.Item>
          <Form.Item name="newGroup" label="或新建分组">
            <Input placeholder="填写后将使用新分组" />
          </Form.Item>
          <Form.Item name="tag" label="标签名称" rules={[{ required: true, message: '请输入标签名' }]}>
            <Input placeholder="例如：高价值" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑标签"
        open={!!editItem}
        onCancel={() => setEditItem(null)}
        onOk={confirmEdit}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item name="group" label="所属分组" rules={[{ required: true }]}>
            <Select
              options={groupOptions}
              placeholder="选择分组"
              dropdownRender={(menu) => (
                <>
                  {menu}
                </>
              )}
            />
          </Form.Item>
          <Form.Item name="tag" label="标签名称" rules={[{ required: true, message: '请输入标签名' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TagLibraryDrawer;
