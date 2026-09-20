import type { TicketFormValues } from '@/types/Ticket.types.ts';

/**
 * 提交失败后聚焦第一个错误字段（rules/form-validation.md）。
 * 依赖 DOM 查询，所以放在 UI 侧的 Hook，Logic 只负责算出是哪个字段。
 */
export function focusFirstErrorField(field: keyof TicketFormValues): void {
  const host = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!host) return;

  const focusable = host.querySelector<HTMLElement>(
    'input, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const target = focusable ?? host;

  target.focus();
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
