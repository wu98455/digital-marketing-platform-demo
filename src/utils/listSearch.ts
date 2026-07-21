/** 列表页 ProTable 查询区：一排 4 个；默认展示 2 行（8 项），超出可展开 */
export const listSearchProps = {
  labelWidth: 110 as const,
  /** 24 栅格 span=6 → 每排 4 个 */
  span: 6,
  /** 默认显示 2 行 × 4 个 = 8 项 */
  defaultColsNumber: 8,
  defaultCollapsed: true,
};

/**
 * 列表分页统一配置（大尺寸 + 跳至 + 可改每页条数）
 * 新页面 ProTable / Table 请直接：pagination={listPagination}
 * 弹窗等需改每页条数时：pagination={{ ...listPagination, pageSize: 10 }}
 */
export const listPagination = {
  defaultPageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  /** Ant Design：不传或 default 即为大尺寸（非 small） */
  size: 'default' as const,
};

/** @deprecated 与 listSearchProps 相同，保留兼容 */
export const listSearchPropsFew = listSearchProps;
