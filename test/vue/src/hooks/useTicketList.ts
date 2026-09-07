import { ref, shallowRef, watch, type Ref } from 'vue';
import type { Ticket, TicketListQuery } from '@/types/Ticket.types.ts';
import type { UIState } from '@/types/UIState.types.ts';
import { fetchTicketList } from '@/services/ticket.service.ts';
import { resolveListState } from '@/logic/uiState.logic.ts';
import { useRequestGuard } from '@/hooks/useRequestGuard.ts';

/**
 * 列表数据加载。承担 loading/error/empty 组合与竞态保护，
 * 业务判定（五态、查询规范化）在 Logic。
 */
export function useTicketList(query: Readonly<Ref<TicketListQuery>>) {
  const list = shallowRef<Ticket[]>([]);
  const total = ref(0);
  const state = ref<UIState>('idle');
  const errorMessage = ref('');
  const isRefreshing = ref(false);
  const guard = useRequestGuard();

  async function load(): Promise<void> {
    // 已有数据时走"刷新"语义：保留旧数据，只显示顶部进度条。
    const hasData = state.value === 'success';
    if (hasData) isRefreshing.value = true;
    else state.value = 'loading';

    const { signal, isStale } = guard.start();
    const result = await fetchTicketList(query.value, { signal });

    if (isStale()) return;
    isRefreshing.value = false;

    if (!result.success) {
      if (result.error.code === 'CANCELED') return;
      // 刷新失败保留旧数据，仅提示；首次加载失败才整体转错误态。
      errorMessage.value = result.error.message;
      if (!hasData) state.value = 'error';
      return;
    }

    list.value = result.data.list;
    total.value = result.data.total;
    state.value = resolveListState(result.data.list);
    errorMessage.value = '';
  }

  watch(query, load, { immediate: true, deep: true });

  return { list, total, state, errorMessage, isRefreshing, reload: load };
}
