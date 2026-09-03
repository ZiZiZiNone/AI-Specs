<script setup lang="ts">
import type { UIState } from '@/types/UIState.types';
import EmptyPlaceholder from './EmptyPlaceholder.vue';
import ErrorPlaceholder from './ErrorPlaceholder.vue';

/**
 * 五态容器（rules/ui-states.md 的 DataLoader）。
 * 仅 success 渲染默认插槽，避免各页面重复写 v-if 链。
 */
interface Props {
  state: UIState;
  errorMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionText?: string;
  /** 错误态是否提供返回入口，用于详情页"工单不存在"场景。 */
  errorBackText?: string;
  /** 首屏用骨架屏而非 spinner，结构更贴近真实内容。 */
  skeletonRows?: number;
}

withDefaults(defineProps<Props>(), {
  errorMessage: '',
  emptyTitle: '暂无数据',
  emptyDescription: '',
  emptyActionText: '',
  errorBackText: '',
  skeletonRows: 4,
});

const emit = defineEmits<{
  retry: [];
  emptyAction: [];
  errorBack: [];
}>();
</script>

<template>
  <div>
    <div v-if="state === 'idle' || state === 'loading'" class="px-2 py-4">
      <slot name="loading">
        <a-skeleton animation>
          <a-skeleton-line :rows="skeletonRows" :line-height="28" :line-spacing="16" />
        </a-skeleton>
      </slot>
    </div>

    <ErrorPlaceholder
      v-else-if="state === 'error'"
      :message="errorMessage || '数据加载失败，请稍后重试'"
      :back-text="errorBackText"
      @retry="emit('retry')"
      @back="emit('errorBack')"
    />

    <EmptyPlaceholder
      v-else-if="state === 'empty'"
      :title="emptyTitle"
      :description="emptyDescription"
      :action-text="emptyActionText"
      @action="emit('emptyAction')"
    />

    <slot v-else />
  </div>
</template>
