import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { TicketListQuery, TicketSortField, SortOrder } from '@/types/Ticket.types';
import {
  applyFilterChange,
  applyPageChange,
  applySortChange,
  parseQueryFromParams,
  serializeQueryToParams,
} from '@/logic/ticketQuery.logic';

/**
 * 查询条件与 URL 的双向绑定。URL 是唯一数据源，
 * 不另存一份 ref，避免两处状态不一致（rules/store.md：能算的不存）。
 */
export function useTicketQuery() {
  const route = useRoute();
  const router = useRouter();

  const query = computed<TicketListQuery>(() =>
    parseQueryFromParams(route.query as Record<string, string | undefined>),
  );

  function push(next: TicketListQuery): void {
    router.replace({ query: serializeQueryToParams(next) });
  }

  return {
    query,
    changeFilter: (patch: Partial<Omit<TicketListQuery, 'page'>>) =>
      push(applyFilterChange(query.value, patch)),
    changePage: (page: number, pageSize: number) =>
      push(applyPageChange(query.value, page, pageSize)),
    changeSort: (sortBy: TicketSortField, sortOrder: SortOrder) =>
      push(applySortChange(query.value, sortBy, sortOrder)),
    goToPage: (page: number) => push({ ...query.value, page }),
  };
}
