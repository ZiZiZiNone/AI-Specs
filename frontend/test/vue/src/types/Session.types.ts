/** 权限码。与后端约定的字符串常量，前端只做体验层控制。 */
export type PermissionCode =
  | 'ticket:create'
  | 'ticket:edit'
  | 'ticket:delete'
  | 'ticket:close'
  | 'ticket:assign';

export interface SessionUser {
  id: string;
  name: string;
  permissions: PermissionCode[];
}
