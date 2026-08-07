import React from 'react';
import {
  TagPickerModal,
  flattenGroups,
  toGroups,
  useTagCatalog,
  type TagGroup,
} from '@/components/Tagging';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: TagGroup[];
  onSave: (next: TagGroup[]) => void;
};

const EditCustomerTagsModal: React.FC<Props> = ({ open, onOpenChange, value, onSave }) => {
  const { getCatalog } = useTagCatalog();
  const catalog = getCatalog('customer');

  return (
    <TagPickerModal
      open={open}
      onOpenChange={onOpenChange}
      title="编辑全渠道客户标签"
      catalog={catalog}
      mode="replace"
      value={flattenGroups(value)}
      onSave={(items) => {
        onSave(toGroups(items, catalog));
      }}
    />
  );
};

export type { TagGroup };
export default EditCustomerTagsModal;
