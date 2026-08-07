import { history } from '@umijs/max';
import { useEffect } from 'react';

/** 旧整页工坊入口：跳回列表并打开新建弹窗 */
const CrowdCreateRedirect: React.FC = () => {
  useEffect(() => {
    history.replace('/crowd?create=1');
  }, []);
  return null;
};

export default CrowdCreateRedirect;
