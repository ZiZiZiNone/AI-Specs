/**
 * 表单校验与提交控制纯逻辑：全量替换错误表、裁剪隐藏字段、按触碰状态触发失焦校验与防重入锁。
 */

export function validateTicketForm(values) {
  const errors = {};
  if (!values.title || !values.title.trim()) {
    errors.title = '请输入工单标题';
  }
  if (values.needCallback && (!values.contactPhone || !/^1\d{10}$/.test(values.contactPhone.trim()))) {
    errors.contactPhone = '请输入 11 位有效手机号';
  }
  return errors;
}

export function toSubmitPayload(values) {
  const payload = {
    title: values.title.trim(),
    description: (values.description ?? '').trim(),
    needCallback: Boolean(values.needCallback),
    attachments: Array.isArray(values.attachments) ? [...values.attachments] : [],
  };
  if (payload.needCallback) {
    payload.contactPhone = (values.contactPhone ?? '').trim();
  }
  return payload;
}

export function createTicketFormController(initialValues, submitFn) {
  const state = {
    values: { ...initialValues }, errors: {}, dirtyFields: new Set(), hasSubmitted: false, isSubmitting: false,
  };

  function setField(field, value) {
    state.values[field] = value;
    state.dirtyFields.add(field);
    if (field === 'needCallback' && !value) delete state.errors.contactPhone;
  }

  function handleBlur(field) {
    if (!state.dirtyFields.has(field) && !state.hasSubmitted) return;
    const next = validateTicketForm(state.values);
    if (next[field]) state.errors[field] = next[field];
    else delete state.errors[field];
  }

  async function submit() {
    if (state.isSubmitting) return { ok: false, skipped: true };
    state.hasSubmitted = true;
    state.errors = validateTicketForm(state.values);
    if (Object.keys(state.errors).length > 0) return { ok: false, errors: { ...state.errors } };
    state.isSubmitting = true;
    try {
      const payload = toSubmitPayload(state.values);
      return { ok: true, payload, result: await submitFn(payload) };
    } finally {
      state.isSubmitting = false;
    }
  }

  return { state, setField, handleBlur, submit };
}
