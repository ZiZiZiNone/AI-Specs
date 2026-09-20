<template>
  <a-select
    :model-value="modelValue"
    :options="options.map((item) => ({ value: item.id, label: item.name }))"
    :loading="isSearching"
    :disabled="disabled"
    :error="hasError"
    allow-search
    allow-clear
    placeholder="搜索并选择处理人"
    :filter-option="false"
    @search="trigger"
    @blur="emit('blur')"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  >
    <template #empty>
      <div class="px-3 py-2 text-xs text-[var(--color-text-3)]">
        {{ isSearching ? '搜索中…' : '未找到匹配的处理人' }}
      </div>
    </template>
  </a-select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { TicketAssignee } from '@/types/Ticket.types.ts';
import { searchAssignees } from '@/services/assignee.service.ts';
import { useAsyncSearch } from '@/hooks/useAsyncSearch.ts';

/**
 * 处理人异步搜索下拉框。
 * 组件自身交互功能可直连 Service（core-principles P2 允许例外），
 * 但不加载页面业务数据，选中结果通过 update:modelValue 上报。
 */
interface Props {
  modelValue: string;
  disabled?: boolean;
  hasError?: boolean;
  /** 编辑回填时的已选项，避免下拉未搜索时显示空白。 */
  initialOption?: TicketAssignee | null;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  hasError: false,
  initialOption: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [];
}>();

const options = ref<TicketAssignee[]>([]);

const { isSearching, trigger } = useAsyncSearch<TicketAssignee[]>(
  async (keyword, signal) => {
    const result = await searchAssignees(keyword, { signal });
    if (!result.success) return null;
    options.value = result.data;
    return result.data;
  },
);

onMounted(() => {
  if (props.initialOption) options.value = [props.initialOption];
  trigger('');
});
</script>
