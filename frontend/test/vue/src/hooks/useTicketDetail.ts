import { computed, ref, shallowRef, watch, type Ref } from 'vue';
import type { TicketDetail } from '@/types/Ticket.types.ts';
import type { UIState } from '@/types/UIState.types.ts';
import { fetchTicketDetail } from '@/services/ticket.service.ts';
import { resolveDetailState } from '@/logic/uiState.logic.ts';
import { useRequestGuard } from '@/hooks/useRequestGuard.ts';

/** 详情加载。id 变化时取消旧请求，避免快速切换后回填错误工单。 */
export function useTicketDetail(id: Readonly<Ref<string>>) {
  const detail = shallowRef<TicketDetail | null>(null);
  const state = ref<UIState>('idle');
  const errorMessage = ref('');
  const guard = useRequestGuard();

  const isNotFound = computed(
    () => state.value === 'error' && errorMessage.value.includes('不存在'),
  );

  async function load(): Promise<void> {
    state.value = 'loading';
    const { signal, isStale } = guard.start();
    const result = await fetchTicketDetail(id.value, { signal });

    if (isStale()) return;

    if (!result.success) {
      if (result.error.code === 'CANCELED') return;
      state.value = 'error';
      errorMessage.value = result.error.message;
      return;
    }

    detail.value = result.data;
    state.value = resolveDetailState(result.data);
    errorMessage.value = '';
  }

  watch(
    id,
    () => {
      guard.abortAll();
      void load();
    },
    { immediate: true },
  );

  return { detail, state, errorMessage, isNotFound, reload: load };
}
