import { computed, ref, watch, type Ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import type { TicketAssignee, TicketFormValues } from '@/types/Ticket.types.ts';
import type { TicketFormViewModel } from '@/types/TicketForm.types.ts';
import type { UIState } from '@/types/UIState.types.ts';
import type { SessionUser } from '@/types/Session.types.ts';
import { canAssign as resolveCanAssign } from '@/logic/ticketPermission.logic.ts';
import { validateField } from '@/logic/ticketValidation.logic.ts';
import { checkTicketCode, fetchTicketDetail } from '@/services/ticket.service.ts';
import { useTicketForm } from '@/hooks/useTicketForm.ts';
import { useAsyncSearch } from '@/hooks/useAsyncSearch.ts';
import { focusFirstErrorField } from '@/hooks/focusFirstErrorField.ts';

/**
 * 表单弹窗的完整编排：打开/关闭、编辑回填、编号异步唯一性校验、提交。
 * 页面只调用 openCreate/openEdit 与消费 viewModel，保持薄层（core-principles P1）。
 */
export function useTicketFormModal(user: Readonly<Ref<SessionUser | null>>) {
  const form = useTicketForm();
  const isVisible = ref(false);
  const loadState = ref<UIState>('success');
  const loadErrorMessage = ref('');
  const initialAssignee = ref<TicketAssignee | null>(null);
  const editingId = ref('');

  /** 编号唯一性：防抖 500ms（rules/form-validation.md 异步验证）。 */
  const codeCheck = useAsyncSearch<boolean>(
    async (code, signal) => {
      const result = await checkTicketCode(code, editingId.value, { signal });
      if (!result.success) return null;
      if (result.data.isTaken) {
        form.setFieldError('code', '该工单编号已存在，请更换后重试');
        return true;
      }
      return false;
    },
    { delayMs: 500 },
  );

  async function loadForEdit(id: string): Promise<void> {
    loadState.value = 'loading';
    const result = await fetchTicketDetail(id);

    if (!result.success) {
      loadState.value = 'error';
      loadErrorMessage.value = result.error.message;
      return;
    }

    form.reset(result.data);
    initialAssignee.value = result.data.assignee;
    loadState.value = 'success';
    loadErrorMessage.value = '';
  }

  function openCreate(): void {
    editingId.value = '';
    initialAssignee.value = null;
    form.reset(null);
    loadState.value = 'success';
    loadErrorMessage.value = '';
    isVisible.value = true;
  }

  function openEdit(id: string): void {
    editingId.value = id;
    initialAssignee.value = null;
    form.reset(null);
    isVisible.value = true;
    void loadForEdit(id);
  }

  function handleChange(field: keyof TicketFormValues, value: unknown): void {
    // reactive 对象按字段写入，避免整体替换导致 Arco 受控组件失焦。
    (form.values as Record<string, unknown>)[field] = value;
    form.handleChange(field);

    // 仅在格式已合法时才发起唯一性请求，避免为明显错误的编号打接口。
    if (field === 'code' && !validateField(form.values, 'code')) {
      codeCheck.trigger(String(value));
    } else if (field === 'code') {
      codeCheck.cancel();
    }
  }

  watch(isVisible, (visible) => {
    if (!visible) codeCheck.cancel();
  });

  /**
   * 视图模型用 computed 组装：values / errors 直接透传同一个 reactive 引用，
   * 不再包一层 reactive，避免嵌套代理导致写入与读取走不同代理身份。
   */
  const viewModel = computed<TicketFormViewModel>(() => ({
    values: form.values,
    errors: form.errors,
    isSubmitting: form.isSubmitting.value,
    isCheckingCode: codeCheck.isSearching.value,
    isDirty: form.isDirty.value,
    formError: form.formError.value,
    canAssign: resolveCanAssign(user.value, form.values.status),
    initialAssignee: initialAssignee.value,
  }));

  /**
   * 提交并处理反馈。成功与否都在此收口，
   * 页面只需要知道"是否要刷新列表"。
   */
  async function submit(): Promise<boolean> {
    const outcome = await form.submit();

    if (!outcome.isSuccess) {
      if (outcome.focusField) focusFirstErrorField(outcome.focusField);
      else Message.error(outcome.message);
      return false;
    }

    Message.success(outcome.message);
    isVisible.value = false;
    return true;
  }

  return {
    isVisible,
    loadState,
    loadErrorMessage,
    viewModel,
    openCreate,
    openEdit,
    handleChange,
    handleBlur: form.handleBlur,
    submit,
    retryLoad: () => loadForEdit(editingId.value),
    close: () => {
      isVisible.value = false;
    },
  };
}
