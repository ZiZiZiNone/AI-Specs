<template>
  <div class="flex flex-col gap-4 p-6">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-[var(--color-text-1)]">工单管理</h1>
        <p class="mt-1 text-xs text-[var(--color-text-3)]">共 {{ list.total.value }} 条工单</p>
      </div>
      <a-button v-if="canCreate" type="primary" @click="formModal.openCreate()">
        <template #icon><IconPlus /></template>
        新增工单
      </a-button>
    </header>

    <TicketSearchBar
      :query="query"
      :is-refreshing="list.isRefreshing.value"
      @change="changeFilter"
      @reset="changeFilter({ keyword: '', status: '', priority: '', assigneeId: '' })"
      @refresh="list.reload()"
    />

    <div class="rounded-lg bg-white">
      <DataLoader
        :state="list.state.value"
        :error-message="list.errorMessage.value"
        :skeleton-rows="6"
        empty-title="暂无工单数据"
        empty-description="调整筛选条件，或创建第一个工单"
        :empty-action-text="canCreate ? '新增工单' : ''"
        @retry="list.reload()"
        @empty-action="formModal.openCreate()"
      >
        <TicketTable
          :rows="list.list.value"
          :loading="list.isRefreshing.value"
          :pending-id="rowOps.pendingId.value"
          :user="session.user"
          :sort-by="query.sortBy"
          :sort-order="query.sortOrder"
          @view="router.push(`/tickets/${$event}`)"
          @edit="formModal.openEdit($event)"
          @remove="rowOps.remove"
          @toggle-status="rowOps.toggleStatus"
          @change-priority="rowOps.changePriority"
          @sort-change="changeSort"
        />

        <div class="flex justify-end border-t border-[var(--color-border-1)] px-4 py-3">
          <a-pagination
            :current="query.page"
            :page-size="query.pageSize"
            :total="list.total.value"
            :page-size-options="[...PAGE_SIZE_OPTIONS]"
            show-total
            show-page-size
            @change="changePage($event, query.pageSize)"
            @page-size-change="changePage(1, $event)"
          />
        </div>
      </DataLoader>
    </div>

    <TicketFormModal
      :visible="formModal.isVisible.value"
      :form="formModal.viewModel.value"
      :load-state="formModal.loadState.value"
      :load-error-message="formModal.loadErrorMessage.value"
      @update:visible="formModal.isVisible.value = $event"
      @change="formModal.handleChange"
      @blur="formModal.handleBlur"
      @submit="handleSubmit"
      @retry-load="formModal.retryLoad()"
      @reject="Message.warning($event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import { PAGE_SIZE_OPTIONS } from '@/logic/ticketQuery.logic.ts';
import { hasPermission } from '@/logic/ticketPermission.logic.ts';
import { useSessionStore } from '@/store/session.store.ts';
import { useTicketQuery } from '@/hooks/useTicketQuery.ts';
import { useTicketList } from '@/hooks/useTicketList.ts';
import { useTicketRowOperations } from '@/hooks/useTicketRowOperations.ts';
import { useTicketFormModal } from '@/hooks/useTicketFormModal.ts';
import DataLoader from '@/components/feedback/DataLoader.vue';
import TicketSearchBar from '@/components/ticket/TicketSearchBar.vue';
import TicketTable from '@/components/ticket/TicketTable.vue';
import TicketFormModal from '@/components/ticket/TicketFormModal.vue';

/** 列表页：只做组装与事件转发，业务判定全部来自 Logic / Hook。 */

const router = useRouter();
const session = useSessionStore();
const { query, changeFilter, changePage, changeSort, goToPage } = useTicketQuery();
const list = useTicketList(query);
const formModal = useTicketFormModal(computed(() => session.user));
const rowOps = useTicketRowOperations({
  rows: list.list,
  query,
  total: list.total,
  reload: list.reload,
  goToPage,
});

const canCreate = computed(() => hasPermission(session.user, 'ticket:create'));

async function handleSubmit(): Promise<void> {
  if (await formModal.submit()) await list.reload();
}
</script>
