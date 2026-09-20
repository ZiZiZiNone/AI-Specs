import type { PermissionCode, SessionUser } from '@/types/Session.types.ts';
import type { Ticket, TicketStatus } from '@/types/Ticket.types.ts';

/**
 * 权限判定。权限数据来自 Store，判定逻辑集中在此处，
 * 组件只消费布尔结果（patterns/permission.md）。
 */

export function hasPermission(
  user: SessionUser | null,
  code: PermissionCode,
): boolean {
  return user?.permissions.includes(code) ?? false;
}

export function hasEveryPermission(
  user: SessionUser | null,
  codes: readonly PermissionCode[],
): boolean {
  return codes.every((code) => hasPermission(user, code));
}

export interface TicketRowAbility {
  canEdit: boolean;
  canDelete: boolean;
  canClose: boolean;
  canReopen: boolean;
  canChangePriority: boolean;
}

/**
 * 行级可执行动作 = 权限 ∩ 状态允许。
 * 两个维度必须一起判，只看权限会让已关闭工单出现"关闭"按钮。
 */
export function resolveTicketRowAbility(
  user: SessionUser | null,
  ticket: Pick<Ticket, 'status'>,
): TicketRowAbility {
  const isClosed = ticket.status === 'closed';
  return {
    canEdit: hasPermission(user, 'ticket:edit') && !isClosed,
    canDelete: hasPermission(user, 'ticket:delete'),
    canClose: hasPermission(user, 'ticket:close') && !isClosed,
    canReopen: hasPermission(user, 'ticket:close') && isClosed,
    canChangePriority: hasPermission(user, 'ticket:edit') && !isClosed,
  };
}

/** 表单里"处理人"字段是否可编辑，取决于独立的分派权限。 */
export function canAssign(user: SessionUser | null, status: TicketStatus): boolean {
  return hasPermission(user, 'ticket:assign') && status !== 'closed';
}
