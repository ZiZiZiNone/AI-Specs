import { computed, reactive, ref } from 'vue';
import type { TicketDetail, TicketFormValues } from '@/types/Ticket.types.ts';
import type { ValidationErrors } from '@/types/Validation.types.ts';
import {
  createEmptyFormValues,
  resolveDependentFields,
  resolveFirstErrorField,
  toFormValues,
  toSubmitPayload,
  validateField,
  validateForm,
} from '@/logic/ticketValidation.logic.ts';
import { createTicket, updateTicket } from '@/services/ticket.service.ts';

/**
 * 表单状态与校验时机编排。规则本身在 Logic，
 * 此处只决定"何时调用哪条校验"以及提交流程。
 */

export interface SubmitOutcome {
  isSuccess: boolean;
  /** 提交失败时需要聚焦的字段；校验失败才有值。 */
  focusField: keyof TicketFormValues | null;
  message: string;
}

export function useTicketForm() {
  const values = reactive<TicketFormValues>(createEmptyFormValues());
  const errors = reactive<ValidationErrors<TicketFormValues>>({});
  const touched = reactive<Partial<Record<keyof TicketFormValues, boolean>>>({});
  const isSubmitting = ref(false);
  const isSubmitted = ref(false);
  const formError = ref('');

  const isEditing = computed(() => Boolean(values.id));
  const isDirty = ref(false);

  function reset(detail: TicketDetail | null): void {
    Object.assign(values, detail ? toFormValues(detail) : createEmptyFormValues());
    for (const key of Object.keys(errors)) {
      delete errors[key as keyof TicketFormValues];
    }
    for (const key of Object.keys(touched)) {
      delete touched[key as keyof TicketFormValues];
    }
    isSubmitted.value = false;
    isDirty.value = false;
    formError.value = '';
  }

  function applyFieldError(field: keyof TicketFormValues): void {
    const error = validateField(values, field);
    if (error) errors[field] = error;
    else delete errors[field];
  }

  /** onChange：仅在已显示错误或已提交过时实时更新，首次输入不报错。 */
  function handleChange(field: keyof TicketFormValues): void {
    isDirty.value = true;
    if (touched[field] || isSubmitted.value) applyFieldError(field);

    for (const dependent of resolveDependentFields(field)) {
      if (touched[dependent] || isSubmitted.value) applyFieldError(dependent);
      else delete errors[dependent];
    }
  }

  /** onBlur：首次显示错误的时机。未输入且未提交过则不提示。 */
  function handleBlur(field: keyof TicketFormValues): void {
    touched[field] = true;
    applyFieldError(field);
  }

  function setFieldError(field: keyof TicketFormValues, message: string): void {
    errors[field] = message;
    touched[field] = true;
  }

  async function submit(): Promise<SubmitOutcome> {
    isSubmitted.value = true;
    formError.value = '';

    const nextErrors = validateForm(values);
    for (const key of Object.keys(errors)) {
      delete errors[key as keyof TicketFormValues];
    }
    Object.assign(errors, nextErrors);

    const focusField = resolveFirstErrorField(nextErrors);
    if (focusField) {
      return { isSuccess: false, focusField, message: '请修正表单中的错误后再提交' };
    }

    isSubmitting.value = true;
    const payload = toSubmitPayload(values);
    const result = values.id
      ? await updateTicket(values.id, payload)
      : await createTicket(payload);
    isSubmitting.value = false;

    if (!result.success) {
      // 编号冲突是字段级问题，定位到字段比顶部提示更有用。
      if (result.error.code === 'CODE_TAKEN') {
        setFieldError('code', result.error.message);
        return { isSuccess: false, focusField: 'code', message: result.error.message };
      }
      formError.value = result.error.message;
      return { isSuccess: false, focusField: null, message: result.error.message };
    }

    return { isSuccess: true, focusField: null, message: '操作成功' };
  }

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSubmitted,
    isEditing,
    isDirty,
    formError,
    reset,
    handleChange,
    handleBlur,
    setFieldError,
    submit,
  };
}
