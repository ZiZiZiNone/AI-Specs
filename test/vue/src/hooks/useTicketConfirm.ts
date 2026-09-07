import { Message, Modal } from '@arco-design/web-vue';
import type { Ticket, TicketPriority } from '@/types/Ticket.types.ts';
import { STATUS_LABELS, resolveToggleTarget } from '@/logic/ticketStatus.logic.ts';
import { PRIORITY_LABELS, requiresPriorityConfirm } from '@/logic/ticketPriority.logic.ts';
import type { ActionOutcome } from '@/hooks/useTicketActions.ts';

/**
 * 危险操作的确认文案与反馈提示。
 * 抽出来是为了让页面只写"确认后做什么"，不在页面里堆 Modal 配置
 * （rules/ui-rule.md 危险操作交互规范）。
 */

function confirmDanger(options: {
  title: string;
  content: string;
  okText: string;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      title: options.title,
      content: options.content,
      okText: options.okText,
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}

function report(outcome: ActionOutcome): boolean {
  if (outcome.isSuccess) Message.success(outcome.message);
  else Message.error(outcome.message);
  return outcome.isSuccess;
}

export function useTicketConfirm() {
  async function confirmRemove(ticket: Ticket): Promise<boolean> {
    return confirmDanger({
      title: '确认删除工单',
      content: `删除后无法恢复，${ticket.code} 的处理记录将一并清除。`,
      okText: '确定删除',
    });
  }

  async function confirmToggleStatus(ticket: Ticket): Promise<boolean> {
    const target = resolveToggleTarget(ticket.status);
    if (!target) return false;

    return confirmDanger({
      title: target === 'closed' ? '确认关闭工单' : '确认重开工单',
      content:
        target === 'closed'
          ? `关闭后 ${ticket.code} 将不可编辑，需重开才能继续处理。`
          : `重开后 ${ticket.code} 状态将回到「${STATUS_LABELS.open}」。`,
      okText: target === 'closed' ? '确定关闭' : '确定重开',
    });
  }

  /** 升为紧急会触发值班告警，需额外确认；其余优先级变更直接执行。 */
  async function confirmPriorityChange(
    ticket: Ticket,
    priority: TicketPriority,
  ): Promise<boolean> {
    if (!requiresPriorityConfirm(ticket.priority, priority)) return true;

    return confirmDanger({
      title: '确认升为紧急',
      content: `${ticket.code} 升为「${PRIORITY_LABELS.urgent}」会立即通知值班人员。`,
      okText: '确定升级',
    });
  }

  return { confirmRemove, confirmToggleStatus, confirmPriorityChange, report };
}
