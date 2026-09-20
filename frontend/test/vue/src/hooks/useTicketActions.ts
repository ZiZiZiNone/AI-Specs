import { ref, type Ref } from 'vue';
import type { Ticket, TicketPriority, TicketStatus } from '@/types/Ticket.types.ts';
import {
  deleteTicket,
  updateTicketPriority,
  updateTicketStatus,
} from '@/services/ticket.service.ts';

/**
 * 行内操作：删除、状态切换、优先级乐观更新。
 * 二次确认的 UI 由调用方（页面）用 Arco Modal 完成，这里只负责执行与回滚。
 */

export interface ActionOutcome {
  isSuccess: boolean;
  message: string;
}

export function useTicketActions(rows: Ref<Ticket[]>) {
  const pendingId = ref('');

  async function remove(id: string): Promise<ActionOutcome> {
    pendingId.value = id;
    const result = await deleteTicket(id);
    pendingId.value = '';

    return result.success
      ? { isSuccess: true, message: '工单已删除' }
      : { isSuccess: false, message: result.error.message };
  }

  async function changeStatus(
    id: string,
    status: TicketStatus,
  ): Promise<ActionOutcome> {
    pendingId.value = id;
    const result = await updateTicketStatus(id, status);
    pendingId.value = '';

    return result.success
      ? { isSuccess: true, message: status === 'closed' ? '工单已关闭' : '工单已重开' }
      : { isSuccess: false, message: result.error.message };
  }

  /**
   * 乐观更新：先改本地行，失败再回滚到快照值。
   * 快照必须在写入前取，不能在失败时反推，否则并发操作会回滚成错误值。
   */
  async function changePriority(
    id: string,
    priority: TicketPriority,
  ): Promise<ActionOutcome> {
    const index = rows.value.findIndex((row) => row.id === id);
    if (index < 0) return { isSuccess: false, message: '工单已不在当前列表中' };

    const snapshot = rows.value[index].priority;
    const optimistic = [...rows.value];
    optimistic[index] = { ...optimistic[index], priority };
    rows.value = optimistic;

    const result = await updateTicketPriority(id, priority);
    if (result.success) return { isSuccess: true, message: '优先级已更新' };

    const rolledBack = [...rows.value];
    const currentIndex = rolledBack.findIndex((row) => row.id === id);
    if (currentIndex >= 0) {
      rolledBack[currentIndex] = { ...rolledBack[currentIndex], priority: snapshot };
      rows.value = rolledBack;
    }
    return { isSuccess: false, message: result.error.message };
  }

  return { pendingId, remove, changeStatus, changePriority };
}
