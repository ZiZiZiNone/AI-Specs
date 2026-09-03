<script setup lang="ts">
import type { TicketLog } from '@/types/Ticket.types';
import type { UIState } from '@/types/UIState.types';
import DataLoader from '../feedback/DataLoader.vue';

/**
 * 处理记录时间线。区块级五态独立于详情主体，
 * 记录加载失败不影响基本信息（patterns/detail-page.md）。
 */
interface Props {
  logs: TicketLog[];
  state: UIState;
  errorMessage?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

withDefaults(defineProps<Props>(), {
  errorMessage: '',
  hasMore: false,
  isLoadingMore: false,
});

const emit = defineEmits<{
  retry: [];
  loadMore: [];
}>();

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>

<template>
  <section class="flex flex-col gap-4 rounded-lg bg-white p-6">
    <h3 class="text-sm font-medium text-[var(--color-text-2)]">处理记录</h3>

    <DataLoader
      :state="state"
      :error-message="errorMessage"
      :skeleton-rows="3"
      empty-title="暂无操作记录"
      empty-description="该工单还没有产生任何处理动作"
      @retry="emit('retry')"
    >
      <a-timeline>
        <a-timeline-item v-for="log in logs" :key="log.id">
          <div class="flex flex-col gap-1">
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-medium text-[var(--color-text-1)]">
                {{ log.action }}
              </span>
              <span class="text-xs text-[var(--color-text-3)]">{{ log.operatorName }}</span>
            </div>
            <span class="text-xs text-[var(--color-text-3)]">
              {{ formatDateTime(log.createdAt) }}
            </span>
            <p class="text-xs text-[var(--color-text-2)]">{{ log.remark }}</p>
          </div>
        </a-timeline-item>
      </a-timeline>

      <div v-if="hasMore" class="flex justify-center pt-2">
        <a-button type="text" :loading="isLoadingMore" @click="emit('loadMore')">
          {{ isLoadingMore ? '加载中…' : '加载更多' }}
        </a-button>
      </div>
    </DataLoader>
  </section>
</template>
