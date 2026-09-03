import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import type { TicketLog } from '@/types/Ticket.types';
import type { UIState } from '@/types/UIState.types';
import { fetchTicketLogs } from '@/services/ticket.service';
import { resolveListState } from '@/logic/uiState.logic';
import { useRequestGuard } from './useRequestGuard';

const LOG_PAGE_SIZE = 10;

/**
 * 处理记录：追加式分页。与详情并发加载，
 * 失败只影响本区块，不影响基本信息展示。
 */
export function useTicketLogs(ticketId: Readonly<Ref<string>>) {
  const logs = shallowRef<TicketLog[]>([]);
  const total = ref(0);
  const page = ref(1);
  const state = ref<UIState>('idle');
  const errorMessage = ref('');
  const isLoadingMore = ref(false);
  const guard = useRequestGuard();

  const hasMore = computed(() => logs.value.length < total.value);

  async function fetchPage(targetPage: number): Promise<void> {
    const isAppend = targetPage > 1;
    if (isAppend) isLoadingMore.value = true;
    else state.value = 'loading';

    const { signal, isStale } = guard.start();
    const result = await fetchTicketLogs(ticketId.value, targetPage, LOG_PAGE_SIZE, {
      signal,
    });

    if (isStale()) return;
    isLoadingMore.value = false;

    if (!result.success) {
      if (result.error.code === 'CANCELED') return;
      errorMessage.value = result.error.message;
      // 追加失败保留已加载记录，只提示；首次失败才转错误态。
      if (!isAppend) state.value = 'error';
      return;
    }

    logs.value = isAppend ? [...logs.value, ...result.data.list] : result.data.list;
    total.value = result.data.total;
    page.value = targetPage;
    state.value = resolveListState(logs.value);
    errorMessage.value = '';
  }

  function loadMore(): void {
    if (!hasMore.value || isLoadingMore.value) return;
    void fetchPage(page.value + 1);
  }

  watch(
    ticketId,
    () => {
      guard.abortAll();
      logs.value = [];
      total.value = 0;
      page.value = 1;
      void fetchPage(1);
    },
    { immediate: true },
  );

  return {
    logs,
    total,
    state,
    errorMessage,
    isLoadingMore,
    hasMore,
    loadMore,
    reload: () => fetchPage(1),
  };
}
