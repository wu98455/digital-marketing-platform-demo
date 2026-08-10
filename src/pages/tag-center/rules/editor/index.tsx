import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { useEffect } from 'react';

/** 旧规则编辑页已并入「新建/编辑标签」整页 */
const RuleEditorPage: React.FC = () => {
  useEffect(() => {
    history.replace('/tag-center/list');
  }, []);
  return <PageContainer title={false} />;
};

export default RuleEditorPage;
