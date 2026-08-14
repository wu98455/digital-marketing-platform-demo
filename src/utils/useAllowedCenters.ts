import { useModel } from '@umijs/max';
import { useMemo } from 'react';
import { CENTER_OPTIONS, type MarketingCenter } from '@/utils/centers';
import { getCentersForUsername } from '@/utils/systemAdminStore';

/** 当前登录用户角色可用的分中心选项 */
export function useAllowedCenters() {
  const { initialState } = useModel('@@initialState');
  const username = initialState?.currentUser?.username as string | undefined;
  const centers = useMemo(
    () => getCentersForUsername(username) as MarketingCenter[],
    [username],
  );
  const options = useMemo(
    () => CENTER_OPTIONS.filter((o) => centers.includes(o.value)),
    [centers],
  );
  return { centers, options, username };
}
