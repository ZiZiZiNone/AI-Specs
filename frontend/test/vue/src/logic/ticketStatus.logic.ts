import type { TicketStatus } from '@/types/Ticket.types.ts';

/**
 * 工单状态流转规则。集中在 Logic，避免"关闭后还能再关闭"这类
 * 判断散落到按钮的 disabled 表达式里。
 */

const ALLOWED_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  open: ['processing', 'closed'],
  processing: ['closed'],
  closed: ['open'],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** 关闭/重开按钮的目标状态；null 表示当前状态无此动作。 */
export function resolveToggleTarget(status: TicketStatus): TicketStatus | null {
  if (status === 'closed') return 'open';
  return 'closed';
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: '待处理',
  processing: '处理中',
  closed: '已关闭',
};

/** Arco Tag 的色值。放 Logic 是因为列表与详情两处共用同一映射。 */
export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'orange',
  processing: 'arcoblue',
  closed: 'gray',
};
