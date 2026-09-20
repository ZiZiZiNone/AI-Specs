<template>
  <div class="flex flex-col gap-2">
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="ACCEPTED_ATTACHMENT_TYPES.join(',')"
      @change="handleFileChange"
    />

    <div class="flex items-center gap-3">
      <a-button
        :loading="isUploading"
        :disabled="disabled || modelValue.length >= MAX_ATTACHMENT_COUNT"
        @click="inputRef?.click()"
      >
        <template #icon><IconUpload /></template>
        {{ isUploading ? '上传中…' : '选择附件' }}
      </a-button>
      <span class="text-xs text-[var(--color-text-3)]">
        jpg / png / pdf，单个不超过 2MB，最多 {{ MAX_ATTACHMENT_COUNT }} 个
      </span>
    </div>

    <ul v-if="modelValue.length" class="flex flex-col gap-1">
      <li
        v-for="item in modelValue"
        :key="item.id"
        class="flex items-center justify-between rounded border border-[var(--color-border-2)] px-3 py-2"
      >
        <span class="truncate text-sm text-[var(--color-text-1)]">{{ item.name }}</span>
        <span class="ml-3 flex shrink-0 items-center gap-3">
          <span class="text-xs text-[var(--color-text-3)]">{{ formatSize(item.size) }}</span>
          <a-button
            type="text"
            size="mini"
            status="danger"
            :disabled="disabled"
            @click="handleRemove(item.id)"
          >
            <template #icon><IconDelete /></template>
          </a-button>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconDelete, IconUpload } from '@arco-design/web-vue/es/icon';
import type { TicketAttachment } from '@/types/Ticket.types.ts';
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_COUNT,
  checkAttachment,
  removeAttachment,
} from '@/logic/attachment.logic.ts';
import { uploadAttachment } from '@/services/upload.service.ts';

/**
 * 附件上传。校验规则来自 attachment.logic，本组件只触发校验与展示结果。
 * 上传是组件自身交互功能，允许直连 upload service。
 */
interface Props {
  modelValue: TicketAttachment[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), { disabled: false });

const emit = defineEmits<{
  'update:modelValue': [value: TicketAttachment[]];
  reject: [message: string];
}>();

const isUploading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // 立即清空 input，否则连续选同一文件不会再触发 change。
  input.value = '';
  if (!file) return;

  const check = checkAttachment(
    { name: file.name, size: file.size, type: file.type },
    props.modelValue,
  );
  if (!check.isValid) {
    emit('reject', check.message ?? '附件不符合要求');
    return;
  }

  isUploading.value = true;
  const result = await uploadAttachment(file);
  isUploading.value = false;

  if (!result.success) {
    emit('reject', result.error.message);
    return;
  }
  emit('update:modelValue', [...props.modelValue, result.data]);
}

function handleRemove(id: string): void {
  emit('update:modelValue', removeAttachment(props.modelValue, id));
}
</script>
