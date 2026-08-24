import type { Request, Response } from 'express';
import { systemAdminHandlers } from '../src/utils/systemAdminHandlers';
import { findUserByUsername, getRoleById } from '../src/utils/systemAdminStore';

function ok(res: Response, data: any) {
  res.json({ success: true, data });
}

function fail(res: Response, errorMessage: string) {
  res.json({ success: false, errorMessage });
}

function send(res: Response, result: any) {
  if (result && result.success === false) {
    fail(res, result.errorMessage || '操作失败');
    return;
  }
  if (result && Object.prototype.hasOwnProperty.call(result, 'data')) {
    res.json(result);
    return;
  }
  if (result && result.success === true && !('data' in result) && !('total' in result)) {
    res.json(result);
    return;
  }
  res.json(result);
}

export default {
  'GET /api/system/users': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.listUsers({ params: req.query as any }));
  },
  'POST /api/system/users': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.createUser({ data: req.body }));
  },
  'PUT /api/system/users/:id': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.updateUser({ pathParams: req.params, data: req.body }));
  },
  'POST /api/system/users/:id/reset-password': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.resetPassword({ pathParams: req.params, data: req.body }));
  },
  'GET /api/system/users/:username/approver-options': (req: Request, res: Response) => {
    send(
      res,
      systemAdminHandlers.approverOptions({
        pathParams: { username: String(req.params.username || '') },
      }),
    );
  },

  'GET /api/system/roles': (_req: Request, res: Response) => {
    send(res, systemAdminHandlers.listRoles());
  },
  'POST /api/system/roles': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.createRole({ data: req.body }));
  },
  'PUT /api/system/roles/:id': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.updateRole({ pathParams: req.params, data: req.body }));
  },
  'DELETE /api/system/roles/:id': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.deleteRole({ pathParams: req.params, data: req.body }));
  },

  'GET /api/system/menus': (_req: Request, res: Response) => {
    send(res, systemAdminHandlers.getMenus());
  },
  'POST /api/system/menus': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.createMenu({ data: req.body }));
  },
  'PUT /api/system/menus/:key': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.updateMenu({ pathParams: req.params, data: req.body }));
  },
  'DELETE /api/system/menus/:key': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.deleteMenu({ pathParams: req.params, data: req.body }));
  },
  'POST /api/system/menus/reset': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.resetMenus({ data: req.body }));
  },

  'GET /api/system/audit-logs': (req: Request, res: Response) => {
    send(res, systemAdminHandlers.listAudit({ params: req.query as any }));
  },

  'GET /api/system/access-profile': (req: Request, res: Response) => {
    const username = String(req.query.username || '');
    const user = findUserByUsername(username);
    if (!user) {
      fail(res, '用户不存在');
      return;
    }
    ok(res, { user, role: getRoleById(user.roleId) });
  },
};
