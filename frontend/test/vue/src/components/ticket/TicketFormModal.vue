<template>
  <a-modal
    :visible="visible"
    :title="title()"
    :width="640"
    :mask-closable="false"
    :esc-to-close="false"
    unmount-on-close
    @cancel="requestClose"
  >
    <a-alert v-if="form.formError" type="error" class="mb-4">{{ form.formError }}</a-alert>

    <DataLoader
      :state="loadState"
      :error-message="loadErrorMessage"
      :skeleton-rows="6"
      @retry="emit('retryLoad')"
    >
      <TicketForm
        :values="form.values"
        :errors="form.errors"
        :is-checking-code="form.isCheckingCode"
        :can-assign="form.canAssign"
        :initial-assignee="form.initialAssignee"
        @change="(field, value) => emit('change', field, value)"
        @blur="emit('blur', $event)"
        @reject="emit('reject', $event)"
      />
    </DataLoader>

    <template #footer>
      <div class="flex justify-end gap-2">
        <a-button :disabled="form.isSubmitting" @click="requestClose">取消</a-button>
        <a-button
          type="primary"
          :loading="form.isSubmitting"
          :disabled="loadState !== 'success'"
          @click="emit('submit')"
        >
          {{ form.isSubmitting ? '提交中…' : '提交' }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { Modal } from '@arco-design/web-vue';
import type { TicketFormValues } from '@/types/Ticket.types.ts';
import type { TicketFormViewModel } from '@/types/TicketForm.types.ts';
import type { UIState } from '@/types/UIState.types.ts';
import DataLoader from '@/components/feedback/DataLoader.vue';
import TicketForm from '@/components/ticket/TicketForm.vue';

/**
 * 表单弹窗。只负责弹窗外壳与关闭前确认，
 * 数据加载与提交由页面的 Hook 完成（core-principles P2）。
 */
interface Props {
  visible: boolean;
  form: TicketFormViewModel;
  /** 编辑时需要先拉详情回填，故弹窗内容也有五态。 */
  loadState: UIState;
  loadErrorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), { loadErrorMessage: '' });

const emit = defineEmits<{
  'update:visible': [value: boolean];
  change: [field: keyof TicketFormValues, value: unknown];
  blur: [field: keyof TicketFormValues];
  submit: [];
  retryLoad: [];
  reject: [message: string];
}>();

const title = () => (props.form.values.id ? '编辑工单' : '新增工单');

/** 有未保存输入时关闭需二次确认，避免误关丢失填写内容。 */
function requestClose(): void {
  if (!props.form.isDirty) {
    emit('update:visible', false);
    return;
  }
  Modal.confirm({
    title: '放弃未保存的修改？',
    content: '关闭后已填写的内容将不会保留。',
    okText: '放弃修改',
    cancelText: '继续编辑',
    okButtonProps: { status: 'danger' },
    onOk: () => emit('update:visible', false),
  });
}
</script>
