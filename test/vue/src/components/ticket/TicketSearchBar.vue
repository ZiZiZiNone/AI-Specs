<template>
  <div class="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4">
    <a-input
      :model-value="query.keyword"
      allow-clear
      placeholder="搜索工单编号或标题"
      class="!w-64"
      @update:model-value="emit('change', { keyword: String($event ?? '') })"
    >
      <template #prefix><IconSearch /></template>
    </a-input>

    <a-select
      :model-value="query.status"
      :options="statusOptions"
      allow-clear
      placeholder="全部状态"
      class="!w-36"
      @update:model-value="emit('change', { status: ($event ?? '') as TicketListQuery['status'] })"
    />

    <a-select
      :model-value="query.priority"
      :options="[...PRIORITY_OPTIONS]"
      allow-clear
      placeholder="全部优先级"
      class="!w-36"
      @update:model-value="
        emit('change', { priority: ($event ?? '') as TicketListQuery['priority'] })
      "
    />

    <div class="w-52">
      <AssigneeSelect
        :model-value="query.assigneeId"
        @update:model-value="emit('change', { assigneeId: $event })"
      />
    </div>

    <div class="ml-auto flex items-center gap-2">
      <a-button v-if="canReset" type="text" @click="emit('reset')">重置筛选</a-button>
      <a-button :loading="isRefreshing" @click="emit('refresh')">
        <template #icon><IconRefresh /></template>
        刷新
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon';
import type { TicketListQuery } from '@/types/Ticket.types.ts';
import { STATUS_LABELS } from '@/logic/ticketStatus.logic.ts';
import { PRIORITY_OPTIONS } from '@/logic/ticketPriority.logic.ts';
import { hasActiveFilter } from '@/logic/ticketQuery.logic.ts';
import AssigneeSelect from '@/components/ticket/AssigneeSelect.vue';

/**
 * 筛选栏。完全受控：值由 props 传入，变更通过 change 上报，
 * 自身不持有筛选状态（真实来源是 URL）。
 */
interface Props {
  query: TicketListQuery;
  isRefreshing?: boolean;
}

const props = withDefaults(defineProps<Props>(), { isRefreshing: false });

const emit = defineEmits<{
  change: [patch: Partial<Omit<TicketListQuery, 'page'>>];
  reset: [];
  refresh: [];
}>();

const statusOptions = computed(() =>
  (Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  })),
);

const canReset = computed(() => hasActiveFilter(props.query));
</script>
