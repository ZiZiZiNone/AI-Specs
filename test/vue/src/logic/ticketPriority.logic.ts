import type { TicketPriority } from '@/types/Ticket.types.ts';

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const PRIORITY_WEIGHTS: Record<TicketPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export const PRIORITY_OPTIONS: readonly { value: TicketPriority; label: string }[] = (
  ['urgent', 'high', 'medium', 'low'] as const
).map((value) => ({ value, label: PRIORITY_LABELS[value] }));

export function comparePriority(a: TicketPriority, b: TicketPriority): number {
  return PRIORITY_WEIGHTS[a] - PRIORITY_WEIGHTS[b];
}

/**
 * 升到 urgent 需要额外确认：这是不可静默的影响面变化，
 * 会触发值班告警，所以在 Logic 里显式标记而不是靠 UI 记得加确认框。
 */
export function requiresPriorityConfirm(
  from: TicketPriority,
  to: TicketPriority,
): boolean {
  return to === 'urgent' && from !== 'urgent';
}
