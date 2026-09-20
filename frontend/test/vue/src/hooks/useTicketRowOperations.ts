import { Message } from '@arco-design/web-vue';
import type { Ref } from 'vue';
import type { Ticket, TicketListQuery, TicketPriority } from '@/types/Ticket.types.ts';
import { resolvePageAfterRemoval } from '@/logic/ticketQuery.logic.ts';
import { resolveToggleTarget } from '@/logic/ticketStatus.logic.ts';
import { useTicketActions } from '@/hooks/useTicketActions.ts';
import { useTicketConfirm } from '@/hooks/useTicketConfirm.ts';

/**
 * 行操作编排：确认 → 执行 → 反馈 → 刷新/翻页。
 * 集中在 Hook 让页面只保留组装（core-principles P1：页面内函数不超过 3 个）。
 */
export interface RowOperationDeps {
  rows: Ref<Ticket[]>;
  query: Readonly<Ref<TicketListQuery>>;
  total: Ref<number>;
  reload: () => Promise<void>;
  goToPage: (page: number) => void;
}

export function useTicketRowOperations(deps: RowOperationDeps) {
  const actions = useTicketActions(deps.rows);
  const confirm = useTicketConfirm();

  async function remove(row: Ticket): Promise<void> {
    if (!(await confirm.confirmRemove(row))) return;
    if (!confirm.report(await actions.remove(row.id))) return;

    // 删掉末页最后一条时页码要回退，否则会停在空页。
    const nextPage = resolvePageAfterRemoval(deps.query.value, deps.total.value);
    if (nextPage !== deps.query.value.page) deps.goToPage(nextPage);
    else await deps.reload();
  }

  async function toggleStatus(row: Ticket): Promise<void> {
    const target = resolveToggleTarget(row.status);
    if (!target) return;
    if (!(await confirm.confirmToggleStatus(row))) return;
    if (confirm.report(await actions.changeStatus(row.id, target))) await deps.reload();
  }

  /** 乐观更新已改本地行，成功不再整表刷新，避免闪烁。 */
  async function changePriority(row: Ticket, priority: TicketPriority): Promise<void> {
    if (!(await confirm.confirmPriorityChange(row, priority))) return;
    const outcome = await actions.changePriority(row.id, priority);
    if (outcome.isSuccess) Message.success(outcome.message);
    else Message.error(outcome.message);
  }

  return { pendingId: actions.pendingId, remove, toggleStatus, changePriority };
}
