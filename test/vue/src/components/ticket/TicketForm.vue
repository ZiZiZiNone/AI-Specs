<script setup lang="ts">
import { computed } from 'vue';
import type { TicketAssignee, TicketFormValues } from '@/types/Ticket.types';
import type { ValidationErrors } from '@/types/Validation.types';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TICKET_FIELD_LABELS,
} from '@/logic/ticketValidation.logic';
import { PRIORITY_OPTIONS } from '@/logic/ticketPriority.logic';
import AssigneeSelect from './AssigneeSelect.vue';
import AttachmentUpload from './AttachmentUpload.vue';

/**
 * 工单表单。受控组件：值与错误由父级（Hook）持有，
 * 本组件只渲染字段、分发 change/blur 事件。
 *
 * 保留在单文件而不再拆分：字段虽多但职责单一（一张表单），
 * 拆成子组件会让 values/errors/change/blur 四组 props 层层透传，
 * 反而更复杂（core-principles P1 超标处理第 3 条）。
 */
interface Props {
  values: TicketFormValues;
  errors: ValidationErrors<TicketFormValues>;
  isCheckingCode?: boolean;
  canAssign?: boolean;
  initialAssignee?: TicketAssignee | null;
}

const props = withDefaults(defineProps<Props>(), {
  isCheckingCode: false,
  canAssign: true,
  initialAssignee: null,
});

const emit = defineEmits<{
  change: [field: keyof TicketFormValues, value: unknown];
  blur: [field: keyof TicketFormValues];
  reject: [message: string];
}>();

const titleCount = computed(() => props.values.title.trim().length);
const descriptionCount = computed(() => props.values.description.trim().length);

function update(field: keyof TicketFormValues, value: unknown): void {
  emit('change', field, value);
}
</script>

<template>
  <a-form :model="values" layout="vertical">
    <a-form-item
      field="code"
      :label="TICKET_FIELD_LABELS.code"
      required
      :validate-status="errors.code ? 'error' : undefined"
      :help="errors.code"
    >
      <a-input
        :model-value="values.code"
        placeholder="TK-000123"
        data-field="code"
        @update:model-value="update('code', $event)"
        @blur="emit('blur', 'code')"
      >
        <template v-if="isCheckingCode" #suffix>
          <span class="text-xs text-[var(--color-text-3)]">校验中…</span>
        </template>
      </a-input>
    </a-form-item>

    <a-form-item
      field="title"
      :label="TICKET_FIELD_LABELS.title"
      required
      :validate-status="errors.title ? 'error' : undefined"
      :help="errors.title"
      :extra="`${titleCount}/${TITLE_MAX_LENGTH}`"
    >
      <a-input
        :model-value="values.title"
        placeholder="一句话描述问题"
        data-field="title"
        @update:model-value="update('title', $event)"
        @blur="emit('blur', 'title')"
      />
    </a-form-item>

    <div class="grid grid-cols-2 gap-4">
      <a-form-item field="priority" :label="TICKET_FIELD_LABELS.priority" required>
        <a-select
          :model-value="values.priority"
          :options="[...PRIORITY_OPTIONS]"
          data-field="priority"
          @update:model-value="update('priority', $event)"
        />
      </a-form-item>

      <a-form-item
        field="assigneeId"
        :label="TICKET_FIELD_LABELS.assigneeId"
        required
        :validate-status="errors.assigneeId ? 'error' : undefined"
        :help="errors.assigneeId"
      >
        <AssigneeSelect
          :model-value="values.assigneeId"
          :disabled="!canAssign"
          :has-error="Boolean(errors.assigneeId)"
          :initial-option="initialAssignee"
          data-field="assigneeId"
          @update:model-value="update('assigneeId', $event)"
          @blur="emit('blur', 'assigneeId')"
        />
      </a-form-item>
    </div>

    <a-form-item
      field="contactPhone"
      :label="TICKET_FIELD_LABELS.contactPhone"
      required
      :validate-status="errors.contactPhone ? 'error' : undefined"
      :help="errors.contactPhone"
    >
      <a-input
        :model-value="values.contactPhone"
        placeholder="11 位手机号"
        data-field="contactPhone"
        @update:model-value="update('contactPhone', $event)"
        @blur="emit('blur', 'contactPhone')"
      />
    </a-form-item>

    <a-form-item
      field="description"
      :label="TICKET_FIELD_LABELS.description"
      required
      :validate-status="errors.description ? 'error' : undefined"
      :help="errors.description"
      :extra="`${descriptionCount}/${DESCRIPTION_MAX_LENGTH}`"
    >
      <a-textarea
        :model-value="values.description"
        :auto-size="{ minRows: 3, maxRows: 6 }"
        placeholder="复现步骤、期望结果与实际结果"
        data-field="description"
        @update:model-value="update('description', $event)"
        @blur="emit('blur', 'description')"
      />
    </a-form-item>

    <a-form-item :label="TICKET_FIELD_LABELS.needsFollowUp">
      <a-switch
        :model-value="values.needsFollowUp"
        @update:model-value="update('needsFollowUp', $event)"
      />
    </a-form-item>

    <a-form-item
      v-if="values.needsFollowUp"
      field="followUpAt"
      :label="TICKET_FIELD_LABELS.followUpAt"
      required
      :validate-status="errors.followUpAt ? 'error' : undefined"
      :help="errors.followUpAt"
    >
      <a-date-picker
        :model-value="values.followUpAt ?? undefined"
        show-time
        class="!w-full"
        data-field="followUpAt"
        @update:model-value="update('followUpAt', $event ? String($event) : null)"
        @blur="emit('blur', 'followUpAt')"
      />
    </a-form-item>

    <a-form-item
      field="attachments"
      :label="TICKET_FIELD_LABELS.attachments"
      :validate-status="errors.attachments ? 'error' : undefined"
      :help="errors.attachments"
    >
      <AttachmentUpload
        :model-value="values.attachments"
        data-field="attachments"
        @update:model-value="update('attachments', $event)"
        @reject="emit('reject', $event)"
      />
    </a-form-item>
  </a-form>
</template>
