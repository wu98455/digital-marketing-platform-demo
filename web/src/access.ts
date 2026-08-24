import {
  findUserByUsername,
  getRoleById,
  type MenuAccessKey,
  type OpPermission,
} from './utils/systemAdminStore';

/**
 * @see https://umijs.org/docs/max/access#access
 */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  if (!currentUser) {
    return {
      canAdmin: false,
      canWelcome: false,
      canTagCenter: false,
      canCrowd: false,
      canMarketing: false,
      canMarketingActivity: false,
      canActivityTemplate: false,
      canNodeRecord: false,
      canSystem: false,
      canSystemUsers: false,
      canSystemRoles: false,
      canSystemMenus: false,
      canSystemAudit: false,
      canSystemOrg: false,
      canTagWrite: false,
      canCrowdWrite: false,
      canActivityWrite: false,
      canActivityApprove: false,
      canActivityExecute: false,
      canSystemManage: false,
    };
  }

  const username = currentUser.username || '';
  const user = username ? findUserByUsername(username) : undefined;
  const role = user
    ? getRoleById(user.roleId)
    : currentUser.access === 'admin'
      ? getRoleById('admin')
      : undefined;
  const menus = new Set<MenuAccessKey>(
    role?.menus ||
      (currentUser.access === 'admin'
        ? ([
            'welcome',
            'tag-center',
            'crowd',
            'crowd-marketing',
            'marketing-activity',
            'activity-template',
            'node-record',
            'system',
            'system-users',
            'system-roles',
            'system-menus',
            'system-audit',
            'system-org',
          ] as MenuAccessKey[])
        : ['welcome']),
  );
  const ops = new Set<OpPermission>(
    role?.operations ||
      (currentUser.access === 'admin'
        ? ([
            'tag.write',
            'crowd.write',
            'activity.write',
            'activity.approve',
            'activity.execute',
            'system.manage',
          ] as OpPermission[])
        : []),
  );

  const hasMenu = (key: MenuAccessKey) => menus.has(key);
  const hasOp = (key: OpPermission) => ops.has(key);

  return {
    canAdmin: user?.roleId === 'admin' || currentUser.access === 'admin',
    canWelcome: hasMenu('welcome'),
    canTagCenter: hasMenu('tag-center'),
    canCrowd: hasMenu('crowd'),
    canMarketing: hasMenu('crowd-marketing'),
    canMarketingActivity: hasMenu('marketing-activity') || hasMenu('crowd-marketing'),
    canActivityTemplate: hasMenu('activity-template') || hasMenu('crowd-marketing'),
    canNodeRecord: hasMenu('node-record') || hasMenu('crowd-marketing'),
    canSystem: hasMenu('system'),
    canSystemUsers: hasMenu('system-users') || hasMenu('system'),
    canSystemRoles: hasMenu('system-roles') || hasMenu('system'),
    canSystemMenus: hasMenu('system-menus') || hasMenu('system'),
    canSystemAudit: hasMenu('system-audit') || hasMenu('system'),
    canSystemOrg: hasMenu('system-org') || hasMenu('system'),
    canTagWrite: hasOp('tag.write'),
    canCrowdWrite: hasOp('crowd.write'),
    canActivityWrite: hasOp('activity.write'),
    canActivityApprove: hasOp('activity.approve'),
    canActivityExecute: hasOp('activity.execute'),
    canSystemManage: hasOp('system.manage'),
  };
}
