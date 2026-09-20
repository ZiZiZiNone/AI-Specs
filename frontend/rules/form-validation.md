# 表单验证

验证规则在 Logic，UI 只触发和展示。

## 验证时机

### onChange 验证（实时验证）
**适用场景**：
- 格式类验证（手机号、邮箱、身份证）
- 长度限制（用户名、密码）
- 特殊字符限制

**时机**：
- 用户输入后立即验证
- 显示实时反馈（字符计数、格式提示）

**注意**：
- 不在首次输入时显示错误（等待 onBlur）
- 已显示错误后，onChange 实时更新错误状态

---

### onBlur 验证（失焦验证）
**适用场景**：
- 必填项检查
- 复杂格式验证
- 唯一性检查（需要调接口）

**时机**：
- 用户离开字段时触发
- 首次显示错误提示

**注意**：
- 用户未输入就失焦，不显示错误（除非已提交过）
- 异步验证显示 loading 状态

---

### onSubmit 验证（提交验证）
**适用场景**：
- 所有字段的完整验证
- 跨字段关联验证
- 最终兜底验证

**时机**：
- 用户点击提交按钮时
- 阻止不合法表单提交

**注意**：
- 即使前面验证通过，提交时也要重新验证
- 聚焦到第一个错误字段
- 显示所有错误信息

---

## 验证规则定义

### 规则位置
**强制要求**：
- 验证规则定义在 Logic 文件中
- 禁止在组件内写验证逻辑
- 禁止在事件处理函数内写验证判断

### 标准结构

规则表按字段泛型化，`validator` 拿到该字段的精确类型。
**禁止 `validator?: (value: any) => boolean`**——这会让规则写错字段类型时不被发现
（对应 frontend/rules/typescript.md 禁止 any；负向实例见 frontend/examples/golden/anti-examples.md 第 7 节）。

```typescript
// ✅ Logic 中定义验证规则，类型随字段收窄
export interface ValidationRule<V> {
  required?: boolean;
  pattern?: RegExp;
  min?: number;          // 字符串按长度，数字按数值，数组按元素个数
  max?: number;
  validator?: (value: V) => boolean;
  message: string;
}

export type ValidationRules<T> = { [K in keyof T]?: ValidationRule<T[K]>[] };
export type ValidationErrors<T> = { [K in keyof T]?: string };
```

**示例**
来源：`frontend/test/vue/src/logic/ticketValidation.logic.ts`（完整版见 frontend/examples/golden/form-validation.md 第 1 节）

```typescript
// ✅ 验证规则示例：同一份规则同时服务新增与编辑入口
export const ticketValidationRules: ValidationRules<TicketFormValues> = {
  code: [
    { required: true, message: '请输入工单编号' },
    { pattern: CODE_PATTERN, message: '工单编号格式为 TK- 加 6 位数字，如 TK-000123' },
  ],
  title: [
    { required: true, message: '请输入标题' },
    { min: 4, max: TITLE_MAX_LENGTH, message: `标题长度为 4-${TITLE_MAX_LENGTH} 个字符` },
  ],
};
```

**规则执行顺序有一条硬约束**：非必填字段留空时必须跳过后续规则，
否则空值会撞上格式校验，产出"请输入正确的手机号"这类误报。

```typescript
// ✅
if (rule.required && isEmptyValue(value)) return rule.message;
if (isEmptyValue(value)) return null;   // 非必填留空，后续规则不适用
if (rule.pattern && !rule.pattern.test(String(value))) return rule.message;
```

---

## 验证错误展示

### 字段级错误
**展示位置**：
- 输入框下方，紧邻输入框
- 红色文字，14px 字号
- 左对齐

**展示时机**：
- onBlur 后首次显示
- onChange 实时更新（已显示错误后）
- onSubmit 后显示所有错误

**交互要求**：
- 输入框边框变红
- 显示错误图标（可选）
- 错误消失时平滑过渡

**示例**
来源：`frontend/test/vue/src/components/ticket/TicketForm.vue`（组件库内建校验的取舍见 frontend/frameworks/vue3/ui/arco/README.md）

```vue
<!-- ✅ 字段级错误展示：错误文案由 Hook 传入，组件只负责呈现 -->
<a-form-item
  field="code"
  label="工单编号"
  :validate-status="errors.code ? 'error' : undefined"
  :help="errors.code"
>
  <a-input
    :model-value="values.code"
    @update:model-value="(v: string) => emit('change', 'code', v)"
    @blur="emit('blur', 'code')"
  />
</a-form-item>
```

要点：`validate-status` + `help` 由外部错误对象驱动，
组件内不持有 `errors`，也不调用组件库的 `validate()`。

---

### 表单级错误
**展示位置**：
- 表单顶部
- 提交按钮上方

**适用场景**：
- 后端返回的、无法归属到单一字段的错误
- 跨字段验证错误
- 重复提交/并发冲突错误

**示例**：
- "开始时间不能晚于结束时间"
- "该订单已被处理，请刷新后重试"

**归属判定**（重要）：后端错误若能对应到某个具体字段，应转为字段级并聚焦该字段，
比顶部提示更有助于用户修正。仅在无法归属时才升为表单级。

```
问：这个错误由哪个输入引起？
  ├─ 单一字段（编号重复、邮箱已注册）→ 字段级 + 聚焦该字段
  ├─ 多字段关系（时间区间、总额与明细不符）→ 表单级
  └─ 与输入无关（并发冲突、无权限、服务不可用）→ 表单级
```

**示例**
来源：`frontend/test/vue/src/hooks/useTicketForm.ts`（见 frontend/examples/golden/form-validation.md 第 6 节）

```typescript
// ✅ 按归属分流：编号冲突落到字段，其余归表单级
if (!result.success) {
  if (result.error.code === 'CODE_TAKEN') {
    setFieldError('code', result.error.message);
    return { isSuccess: false, focusField: 'code', message: result.error.message };
  }
  formError.value = result.error.message;
  return { isSuccess: false, focusField: null, message: result.error.message };
}
```

```vue
<!-- ✅ 表单级错误展示：顶部一条，提交按钮上方 -->
<a-alert v-if="formError" type="error" class="mb-4">{{ formError }}</a-alert>
```

---

## 常用验证规则

### 必填验证
```typescript
// 规则定义
{ required: true, message: '请输入XXX' }

// 判定标准
- 字符串：非空且 trim 后长度 > 0
- 数字：!== null && !== undefined
- 数组：length > 0
- 布尔：必须明确 true/false（不能 undefined）
```

### 格式验证
**手机号**：
```typescript
{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
```

**邮箱**：
```typescript
{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱地址' }
```

**身份证**：
```typescript
{ pattern: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号' }
```

**URL**：
```typescript
{ pattern: /^https?:\/\/.+/, message: '请输入正确的网址' }
```

### 长度验证
```typescript
{ min: 6, max: 20, message: '长度为6-20个字符' }

// 判定标准
- 字符串：按字符数（不是字节数）
- 数组：按元素个数
```

### 范围验证
```typescript
{ min: 0, max: 100, message: '请输入0-100之间的数字' }

// 适用于数字类型
```

### 自定义验证
```typescript
{
  validator: (value) => {
    // 自定义逻辑
    return true/false;
  },
  message: '自定义错误信息'
}
```

---

## 特殊场景处理

### 异步验证
**适用场景**：
- 用户名唯一性检查
- 邀请码有效性检查
- 动态验证规则（需要调接口）

**处理流程**：
1. 显示验证中状态（loading 图标）
2. 调用验证接口
3. 根据结果显示成功/失败

**防抖要求**：
- 用户停止输入 500ms 后才发起请求
- 输入期间取消上一次请求
- **格式尚未合法时不发起请求**：格式错误的值查唯一性是无意义请求

**示例**
来源：`frontend/test/vue/src/hooks/useTicketFormModal.ts` + `useAsyncSearch.ts`
（完整版见 frontend/examples/golden/form-validation.md 第 5 节）

```typescript
// ✅ 异步验证：防抖 + 前置格式门槛 + 取消在途请求
const codeCheck = useAsyncSearch<boolean>(
  async (code, signal) => {
    const result = await checkTicketCode(code, editingId.value, { signal });
    if (!result.success) return null;                 // 校验接口失败不阻塞用户填写
    if (result.data.isTaken) {
      form.setFieldError('code', '该工单编号已存在，请更换后重试');
      return true;
    }
    return false;
  },
  { delayMs: 500 },
);

function handleChange(field: keyof TicketFormValues, value: unknown): void {
  form.values[field] = value;
  form.handleChange(field);

  // 仅在本地格式校验已通过时才查唯一性
  if (field === 'code') {
    if (!validateField(form.values, 'code')) codeCheck.trigger(String(value));
    else codeCheck.cancel();
  }
}
```

**校验接口本身失败时不得阻塞提交**：把网络故障算成"编号已占用"会让用户无路可走。
此时应放行本地校验，由后端在提交时做最终裁决。

---

### 依赖验证
**适用场景**：
- 确认密码（依赖密码字段）
- 结束时间（依赖开始时间）
- 省市区联动

**处理流程**：
1. 依赖关系声明在 Logic（不散落在事件处理里）
2. 被依赖字段变化时，触发依赖字段重新验证
3. 依赖字段**尚未 touched 且未提交过**时，只清除旧错误、不新增错误

**示例**
来源：`frontend/test/vue/src/logic/ticketValidation.logic.ts` + `hooks/useTicketForm.ts`

```typescript
// ✅ 依赖关系是业务规则，声明在 Logic，而非写在事件处理里
export function resolveDependentFields(
  changed: keyof TicketFormValues,
): readonly (keyof TicketFormValues)[] {
  return changed === 'needsFollowUp' ? ['followUpAt'] : [];
}
```

依赖关系增多时改为常量映射表，避免 if/else 链：

```typescript
// ✅ 多依赖时的形态
const FIELD_DEPENDENTS: Partial<
  Record<keyof TicketFormValues, readonly (keyof TicketFormValues)[]>
> = {
  needsFollowUp: ['followUpAt'],
};
```

```typescript
// ✅ Hook 编排联动：不给用户还没碰过的字段扣分
for (const dependent of resolveDependentFields(field)) {
  if (touched[dependent] || isSubmitted.value) applyFieldError(dependent);
  else delete errors[dependent];
}
```

---

### 动态表单验证
**适用场景**：
- 根据用户选择显示/隐藏字段
- 不同角色不同验证规则

**处理流程**：
1. 根据条件动态生成验证规则
2. 隐藏字段不参与验证
3. 提交时只验证可见字段
4. **隐藏字段的残留值不得进入提交载荷**

**示例**
来源：`frontend/test/vue/src/logic/ticketValidation.logic.ts`（见 frontend/examples/golden/form-validation.md 第 4 节）

```typescript
// ✅ 可见性判定在 Logic，页面与提交共用同一份判据
export function resolveVisibleFields(
  values: TicketFormValues,
): readonly (keyof TicketFormValues)[] {
  return TICKET_FIELD_ORDER.filter((field) => {
    if (field === 'followUpAt') return values.needsFollowUp;
    return true;
  });
}

export function validateForm(values: TicketFormValues): ValidationErrors<TicketFormValues> {
  const visible = resolveVisibleFields(values);
  const errors: ValidationErrors<TicketFormValues> = {};
  for (const field of visible) {
    const message = validateField(values, field);
    if (message) errors[field] = message;
  }
  return errors;
}
```

```typescript
// ✅ 提交载荷剔除隐藏字段残留，避免把上次填的回访时间带给后端
export function toSubmitPayload(values: TicketFormValues): Omit<TicketFormValues, 'id'> {
  return {
    ...values,
    followUpAt: values.needsFollowUp ? values.followUpAt : null,
  };
}
```

```typescript
// ❌ 只在渲染层做 v-if 隐藏，校验与提交仍带着旧值
// 用户勾掉"需要回访"后仍因 followUpAt 校验失败而无法提交，且旧值被提交
```

---

### 数组/列表验证
**适用场景**：
- 动态添加的表单项
- 批量编辑

**处理要求**：
- 每项独立验证
- 显示具体哪一项有错误
- 支持添加/删除后重新验证
- 集合级约束（数量上限、整体不可为空）与单项约束分开报，且**集合级优先**

**示例**
来源：`frontend/test/vue/src/logic/attachment.logic.ts`（见 frontend/examples/golden/form-validation.md 第 7 节）

```typescript
// ✅ 数组验证：先判集合级（数量），再判单项（类型/大小）
export function checkAttachment(
  file: AttachmentCandidate,
  existing: readonly TicketAttachment[],
): AttachmentCheckResult {
  // 数量超限时先报数量：此时用户该做的是移除已有附件，而非换文件
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

边界须显式断言（恰好等于上限应通过，避免 `>` / `>=` 写错）：

```typescript
it('should_accept_file_exactly_at_size_limit', () => {
  const result = checkAttachment({ name: 'a.png', size: MAX_ATTACHMENT_SIZE, type: 'image/png' }, []);
  expect(result.isValid).toBe(true);
});
```

---

## 验证反馈优化

### 首次提交前
- 不显示任何错误（除非用户已离开字段）
- 提供输入提示（placeholder/helper text）
- 格式要求说明（如"6-20个字符"）

### 首次提交后
- 显示所有错误
- 自动聚焦第一个错误字段
- 滚动到错误位置

### 修正错误时
- 实时清除已修正的错误
- 保持其他错误显示
- 给予正向反馈（如绿色对勾）

---

## 提交处理

### 提交前
```typescript
1. 禁用提交按钮
2. 显示 loading 状态
3. 执行完整验证
4. 验证失败：恢复按钮 + 显示错误
5. 验证通过：继续提交
```

### 提交中
```typescript
1. 保持按钮禁用
2. 显示"提交中..."
3. 禁止重复点击
4. 提供取消按钮（可选）
```

### 提交后
**成功**：
- 跳转到目标页面或
- 关闭弹窗/抽屉或
- 显示"保存成功"提示（1秒后消失）
- 不静默成功，必须有反馈

**失败**：
- 恢复按钮可用
- 保留用户输入
- 显示错误信息（表单级或字段级）
- 详见 frontend/rules/error-handling.md

---

## 用户体验细节

### 保留用户输入
- 提交失败后不清空表单
- 页面刷新前提示保存
- 支持草稿保存（可选）

### 输入便利性
- Tab 键切换字段
- 回车提交（单行输入框）
- 数字输入框支持上下箭头
- 日期选择器快捷选择

### 错误定位
- 提交失败后自动聚焦第一个错误
- 滚动到错误位置（如表单很长）
- 高亮错误字段

**聚焦顺序不得依赖对象键序**：`Object.keys(errors)[0]` 的顺序由赋值顺序决定，
与表单视觉顺序无关，会出现"跳到中间字段"的现象。显式维护顺序表：

```typescript
// ✅ 字段顺序 = 表单视觉顺序
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

聚焦动作属于 DOM 操作，由 UI 侧的小工具承担（`frontend/test/vue/src/hooks/focusFirstErrorField.ts`），
Logic 只回答"聚焦哪个字段"。

---

## 检查清单

- [ ] 验证规则定义在 Logic，不在组件内
- [ ] 规则表按字段泛型化，validator 无 any
- [ ] 非必填字段留空时跳过后续规则（不产生格式误报）
- [ ] 必填字段有明确标识（*）
- [ ] 首次输入不显示错误（等待 onBlur 或 submit）
- [ ] 提交时重新验证所有字段
- [ ] 验证失败聚焦到第一个错误字段
- [ ] 聚焦顺序来自显式顺序表，不依赖 Object.keys
- [ ] 异步验证有 loading 状态
- [ ] 异步验证有防抖处理（500ms）
- [ ] 异步验证在本地格式合法后才发起
- [ ] 校验接口自身失败时不阻塞提交
- [ ] 提交中禁用按钮并显示 loading
- [ ] 提交失败保留用户输入
- [ ] 后端错误能归属到字段时按字段级展示并聚焦
- [ ] 错误信息清晰友好，不是技术术语
- [ ] 依赖字段变化时触发关联字段重新验证
- [ ] 依赖字段未 touched 时只清错误不新增错误
- [ ] 隐藏字段不参与验证
- [ ] 隐藏字段残留值不进入提交载荷
- [ ] 集合级约束（数量上限）先于单项约束报出
- [ ] 边界值（恰好等于上限）有断言覆盖
