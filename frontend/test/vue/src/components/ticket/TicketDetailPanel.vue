<template>
  <div class="flex flex-col gap-5 rounded-lg bg-white p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <span class="text-xs tracking-wide text-[var(--color-text-3)]">{{ detail.code }}</span>
        <h2 class="text-lg font-semibold text-[var(--color-text-1)]">{{ detail.title }}</h2>
      </div>
      <div class="flex shrink-0 gap-2">
        <a-tag :color="STATUS_COLORS[detail.status]">{{ STATUS_LABELS[detail.status] }}</a-tag>
        <a-tag :color="PRIORITY_COLORS[detail.priority]">
          {{ PRIORITY_LABELS[detail.priority] }}
        </a-tag>
      </div>
    </div>

    <a-descriptions :column="2" bordered size="medium">
      <a-descriptions-item label="处理人">
        {{ detail.assignee?.name ?? '未分派' }}
      </a-descriptions-item>
      <a-descriptions-item label="联系电话">{{ detail.contactPhone }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">
        {{ formatDateTime(detail.createdAt) }}
      </a-descriptions-item>
      <a-descriptions-item label="更新时间">
        {{ formatDateTime(detail.updatedAt) }}
      </a-descriptions-item>
      <a-descriptions-item label="需要回访">
        {{ detail.needsFollowUp ? '是' : '否' }}
      </a-descriptions-item>
      <a-descriptions-item label="回访时间">
        {{ formatDateTime(detail.followUpAt) }}
      </a-descriptions-item>
    </a-descriptions>

    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-medium text-[var(--color-text-2)]">问题描述</h3>
      <p class="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-1)]">
        {{ detail.description }}
      </p>
    </div>

    <div v-if="detail.attachments.length" class="flex flex-col gap-2">
      <h3 class="text-sm font-medium text-[var(--color-text-2)]">附件</h3>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="item in detail.attachments"
          :key="item.id"
          class="rounded border border-[var(--color-border-2)] px-3 py-1 text-xs text-[var(--color-text-2)]"
        >
          {{ item.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TicketDetail } from '@/types/Ticket.types.ts';
import { STATUS_COLORS, STATUS_LABELS } from '@/logic/ticketStatus.logic.ts';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/logic/ticketPriority.logic.ts';

interface Props {
  detail: TicketDetail;
}

defineProps<Props>();

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
</script>
