<template>
  <div class="flex flex-col gap-4 p-6">
    <header class="flex items-center justify-between">
      <a-button type="text" @click="router.push('/tickets')">
        <template #icon><IconArrowLeft /></template>
        返回列表
      </a-button>
      <a-button
        v-if="canEdit"
        type="primary"
        @click="formModal.openEdit(ticketId)"
      >
        <template #icon><IconEdit /></template>
        编辑
      </a-button>
    </header>

    <DataLoader
      :state="detail.state.value"
      :error-message="detail.errorMessage.value"
      :skeleton-rows="8"
      error-back-text="返回列表"
      empty-title="工单不存在"
      empty-description="该工单可能已被删除"
      @retry="detail.reload()"
      @error-back="router.push('/tickets')"
    >
      <TicketDetailPanel v-if="detail.detail.value" :detail="detail.detail.value" />
    </DataLoader>

    <TicketLogTimeline
      :logs="logs.logs.value"
      :state="logs.state.value"
      :error-message="logs.errorMessage.value"
      :has-more="logs.hasMore.value"
      :is-loading-more="logs.isLoadingMore.value"
      @retry="logs.reload()"
      @load-more="logs.loadMore()"
    />

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
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IconArrowLeft, IconEdit } from '@arco-design/web-vue/es/icon';
import { resolveTicketRowAbility } from '@/logic/ticketPermission.logic.ts';
import { useSessionStore } from '@/store/session.store.ts';
import { useTicketDetail } from '@/hooks/useTicketDetail.ts';
import { useTicketLogs } from '@/hooks/useTicketLogs.ts';
import { useTicketFormModal } from '@/hooks/useTicketFormModal.ts';
import DataLoader from '@/components/feedback/DataLoader.vue';
import TicketDetailPanel from '@/components/ticket/TicketDetailPanel.vue';
import TicketLogTimeline from '@/components/ticket/TicketLogTimeline.vue';
import TicketFormModal from '@/components/ticket/TicketFormModal.vue';

/** 详情页：详情与处理记录并发加载，两个区块状态互不影响。 */

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const ticketId = computed(() => String(route.params.id ?? ''));

const detail = useTicketDetail(ticketId);
const logs = useTicketLogs(ticketId);
const formModal = useTicketFormModal(computed(() => session.user));

const canEdit = computed(() =>
  detail.detail.value
    ? resolveTicketRowAbility(session.user, detail.detail.value).canEdit
    : false,
);

async function handleSubmit(): Promise<void> {
  if (!(await formModal.submit())) return;
  await Promise.all([detail.reload(), logs.reload()]);
}
</script>
