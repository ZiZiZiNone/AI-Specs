# 表单页

定位：新增 / 编辑 / 弹窗表单等"收集输入—校验—提交"场景的落点规范。
只定分层与时机，不定字段细节；字段规则归属见 rules/form-validation.md。

## 结构落点

Form → Logic → Service，收敛出口为 Service 的提交方法。

- Form（受控）：收集输入、触发校验、展示错误。业务组件一律受控，
  值由 props 传入、变更经 emit 上报，判定见 frameworks/vue3/component.md
  「业务组件一律受控」与 frameworks/miniprogram/component.md 同名约定。
- Logic（单一写入点）：字段规则校验、提交前转换、提交状态管理。
  校验规则定义在 Logic，UI 只做触发与展示错误。
- Service：提交请求与错误归一，返回 Result；try-catch 收敛在统一请求出口。

表单值只有一份来源（父级 / Hook 持有），组件内不另存副本，
避免 frameworks/vue3/component.md 所述与真实来源脱节。
小程序侧同构：值由 properties 传入、变更经事件上报，
载荷为领域数据或标识，见 frameworks/miniprogram/component.md
「值由 properties 传入，变更经事件上报，组件自身不持有业务状态」。

## 状态与时机

校验三段时机（编排在 Hook，规则调用在 Logic）：

- onChange：「用户输入后立即验证」，但「不在首次输入时显示错误」，
  仅在已显示错误或已提交过时实时更新错误状态。
- onBlur：「用户离开字段时触发」，为首次显示错误的时机；
  「用户未输入就失焦，不显示错误（除非已提交过）」。
- onSubmit：「用户点击提交按钮时」全量兜底，「即使前面验证通过，
  提交时也要重新验证」，失败则聚焦第一个错误字段。

提交状态（见 rules/ui-states.md「禁用相关操作按钮」「显示加载指示器」）：

- 提交中：禁用提交按钮并显示 loading，禁止重复点击。
- 提交失败：恢复按钮可用，保留用户输入，不清空表单。
- 提交成功：「不静默成功，必须有反馈」，按流程跳转 / 刷新 / 提示。

## 规则

- 校验在 Logic：规则表按字段泛型化，禁止在组件内写验证逻辑，
  禁止在事件处理函数内写验证判断。
- 隐藏字段不参验不进载荷：「隐藏字段不参与验证」，
  「隐藏字段的残留值不得进入提交载荷」；可见性判据放 Logic，
  渲染与提交共用同一份判据。
- 依赖联动：依赖关系声明在 Logic；被依赖字段变化时触发依赖字段
  重新验证，依赖字段尚未 touched 且未提交过时只清除旧错误、不新增错误。
- 错误归属：「后端错误若能对应到某个具体字段，应转为字段级并聚焦该字段，
  仅在无法归属时才升为表单级」。
- 聚焦顺序来自显式顺序表，不依赖 Object.keys；聚焦动作由 UI 侧承担，
  Logic 只回答聚焦哪个字段。
- 异步唯一性校验：防抖 500ms，「格式尚未合法时不发起请求」，
  输入期间取消上一次请求；校验接口自身失败时不阻塞提交。

## 正例指针

- 规则与载荷：test/vue/src/logic/ticketValidation.logic.ts
- 时机编排与提交分流：test/vue/src/hooks/useTicketForm.ts
- 弹窗与异步校验编排：test/vue/src/hooks/useTicketFormModal.ts
- 错误展示形态：test/vue/src/components/ticket/TicketForm.vue
- 聚焦动作归属：test/vue/src/hooks/focusFirstErrorField.ts
- 结构与判据详见 examples/golden/form-validation.md
  「非必填字段留空时跳过后续规则」与「隐藏字段不参与校验」两处写法。

## 反例指针

- examples/golden/anti-examples.md「6. 受控组件自持一份状态」
- examples/golden/anti-examples.md「7. 校验层放弃类型」
- examples/golden/anti-examples.md「11. Logic 层空转」
- examples/golden/anti-examples.md「2. 展示型组件自己加载数据」

## 自检指针

对照 checklists/detailed-check.md 中与下列原文短句对应的条目：

- 「验证规则定义在 Logic，不在组件内」
- 「提交中禁用按钮」「失败后保留用户输入」
- 「聚焦顺序来自显式顺序表，不依赖 Object.keys」
- 「隐藏字段残留值不进入提交载荷」
- 「校验接口自身失败时不阻塞提交」
