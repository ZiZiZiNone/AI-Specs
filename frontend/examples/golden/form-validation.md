# 示例：表单校验

来源：本示例自包含，不依赖外部工程；代码即规范结论的完整载体。
示范：`frontend/rules/form-validation.md`「验证规则定义在 Logic 文件中」「非必填字段留空时必须跳过后续规则」「用户停止输入 500ms 后才发起请求」「格式尚未合法时不发起请求」、 `frontend/patterns/form-page.md`「校验规则定义在 Logic，UI 只做触发与展示错误。」、 FE-103 `frontend/rules/core-principles.md`「FE-103 逻辑完全解耦原则」「完全解耦合的函数/工厂/方法/逻辑，在独立的逻辑文件（全局或局部），只需要接受固定结构数据（或不需要）就能完成功能。」

## 1. 规则定义在 Logic

**解决的问题**：规则留在 Logic 才能同时服务新增/编辑等多个入口，
并可脱离组件单测。

来源：`logic/ticketValidation.logic.ts`

```typescript
export const ticketValidationRules: ValidationRules<TicketFormValues> = {
  code: [
    { required: true, message: '请输入工单编号' },
    { pattern: CODE_PATTERN, message: '工单编号格式为 TK- 加 6 位数字，如 TK-000123' },
  ],
  title: [
    { required: true, message: '请输入标题' },
    { min: 4, max: TITLE_MAX_LENGTH, message: `标题长度为 4-${TITLE_MAX_LENGTH} 个字符` },
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话' },
    { pattern: PHONE_PATTERN, message: '请输入正确的手机号' },
  ],
};
```

规则执行时，**非必填字段留空须跳过后续规则**，否则空值会撞上格式校验：

```typescript
function checkRule(value: unknown, rule: ValidationRule<never>): string | null {
  if (rule.required && isEmptyValue(value)) return rule.message;

  // 非必填字段留空时跳过后续规则
  if (isEmptyValue(value)) return null;

  if (rule.pattern && !rule.pattern.test(String(value))) return rule.message;

  const length = measureLength(value);
  if (length !== null) {
    if (rule.min !== undefined && length < rule.min) return rule.message;
    if (rule.max !== undefined && length > rule.max) return rule.message;
  }

  if (rule.validator && !rule.validator(value as never)) return rule.message;
  return null;
}
```

---

## 2. 三段校验时机

**解决的问题**：首次输入即报错会让用户在填写过程中被红字追着走。
时机编排在 Hook，规则调用在 Logic。

来源：`hooks/useTicketForm.ts`

```typescript
/** onChange：仅在已显示错误或已提交过时实时更新，首次输入不报错。 */
function handleChange(field: keyof TicketFormValues): void {
  isDirty.value = true;
  if (touched[field] || isSubmitted.value) applyFieldError(field);

  // 被依赖字段变化时联动重算
  for (const dependent of resolveDependentFields(field)) {
    if (touched[dependent] || isSubmitted.value) applyFieldError(dependent);
    else delete errors[dependent];
  }
}

/** onBlur：首次显示错误的时机。 */
function handleBlur(field: keyof TicketFormValues): void {
  touched[field] = true;
  applyFieldError(field);
}

/** onSubmit：全量兜底，并定位首个错误字段。 */
async function submit(): Promise<SubmitOutcome> {
  isSubmitted.value = true;
  const nextErrors = validateForm(values);
  Object.assign(errors, nextErrors);

  const focusField = resolveFirstErrorField(nextErrors);
  if (focusField) {
    return { isSuccess: false, focusField, message: '请修正表单中的错误后再提交' };
  }
  // …提交
}
```

---

## 3. 聚焦顺序不依赖对象键序

**解决的问题**：`Object.keys` 的顺序不该成为 UI 行为的依据。
显式维护视觉顺序表。

来源：`logic/ticketValidation.logic.ts`

```typescript
/** 字段顺序 = 表单视觉顺序，提交失败时按此顺序聚焦第一个错误字段。 */
export const TICKET_FIELD_ORDER: readonly (keyof TicketFormValues)[] = [
  'code', 'title', 'priority', 'assigneeId',
  'contactPhone', 'description', 'followUpAt', 'attachments',
];

export function resolveFirstErrorField(
  errors: ValidationErrors<TicketFormValues>,
): keyof TicketFormValues | null {
  return TICKET_FIELD_ORDER.find((field) => Boolean(errors[field])) ?? null;
}
```

配套断言：

```typescript
it('should_pick_first_error_by_visual_order_not_object_key_order', () => {
  const errors = validateForm({ ...validValues(), code: '', title: '', contactPhone: '' });
  expect(resolveFirstErrorField(errors)).toBe('code');
});
```

---

## 4. 动态可见性与隐藏字段

**解决的问题**：隐藏字段不参与校验，且其残留值不得提交给后端。

来源：`logic/ticketValidation.logic.ts`

```typescript
/** needsFollowUp 关闭时 followUpAt 隐藏，隐藏字段不参与校验。 */
export function resolveVisibleFields(
  values: TicketFormValues,
): readonly (keyof TicketFormValues)[] {
  return TICKET_FIELD_ORDER.filter((field) => {
    if (field === 'followUpAt') return values.needsFollowUp;
    return true;
  });
}

/** 提交载荷剔除隐藏字段残留，避免把上次填的回访时间带给后端。 */
export function toSubmitPayload(values: TicketFormValues): Omit<TicketFormValues, 'id'> {
  return {
    code: values.code.trim(),
    title: values.title.trim(),
    // …
    needsFollowUp: values.needsFollowUp,
    followUpAt: values.needsFollowUp ? values.followUpAt : null,
  };
}
```

---

## 5. 异步唯一性校验

**解决的问题**：每次按键都打接口会造成请求风暴；
格式还不合法就校验唯一性是无意义请求。

来源：`hooks/useTicketFormModal.ts`

```typescript
// 防抖 500ms（frontend/rules/form-validation.md 异步验证）
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

function handleChange(field: keyof TicketFormValues, value: unknown): void {
  (form.values as Record<string, unknown>)[field] = value;
  form.handleChange(field);

  // 仅在格式已合法时才发起唯一性请求
  if (field === 'code' && !validateField(form.values, 'code')) {
    codeCheck.trigger(String(value));
  } else if (field === 'code') {
    codeCheck.cancel();
  }
}
```

新输入立即废弃上一次的定时器与在途请求（`hooks/useAsyncSearch.ts`）：

```typescript
function trigger(keyword: string): void {
  if (timer !== null) clearTimeout(timer);
  controller?.abort();

  isSearching.value = true;
  timer = setTimeout(async () => {
    const current = new AbortController();
    controller = current;
    const data = await search(keyword, current.signal);
    if (current.signal.aborted) return;
    result.value = data;
    isSearching.value = false;
  }, delayMs);
}
```

---

## 6. 提交失败：字段级 vs 表单级

**解决的问题**：编号冲突是字段级问题，定位到字段比顶部提示更有用。

来源：`hooks/useTicketForm.ts`

```typescript
if (!result.success) {
  if (result.error.code === 'CODE_TAKEN') {
    setFieldError('code', result.error.message);
    return { isSuccess: false, focusField: 'code', message: result.error.message };
  }
  formError.value = result.error.message;   // 其余归表单级
  return { isSuccess: false, focusField: null, message: result.error.message };
}
```

---

## 7. 附件校验

**解决的问题**：数量超限时应先报数量，而不是先报格式——
用户此时该做的是移除已有附件，而非换文件。

来源：`logic/attachment.logic.ts`

```typescript
export function checkAttachment(
  file: AttachmentCandidate,
  existing: readonly TicketAttachment[],
): AttachmentCheckResult {
  if (existing.length >= MAX_ATTACHMENT_COUNT) {
    return { isValid: false, reason: 'count',
      message: `最多上传 ${MAX_ATTACHMENT_COUNT} 个附件，请先移除已有附件` };
  }
  if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
    return { isValid: false, reason: 'type', message: '仅支持 jpg、png、pdf 格式的附件' };
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return { isValid: false, reason: 'size',
      message: `附件大小超过 ${formatMegabytes(MAX_ATTACHMENT_SIZE)}，请选择更小的文件` };
  }
  return { isValid: true };
}
```

边界断言（恰好等于上限应通过）：

```typescript
it('should_accept_file_exactly_at_size_limit', () => {
  const result = checkAttachment({ name: 'a.png', size: MAX_ATTACHMENT_SIZE, type: 'image/png' }, []);
  expect(result.isValid).toBe(true);
});
```
