# 自检结果（checklists/detailed-check.md）

对 `test/vue` 逐项自检。仅记录结论与未过项，不复制清单原文。

## 通过项摘要

**一、核心原则**
P1：页面 115 / 90 行，页面内函数各 1 个（`handleSubmit`），状态变量 ≤5，无业务判断、无数据转换、无接口调用。
P2：全部组件 props 有 TS 类型；无组件 import Store；仅 `AssigneeSelect`、`AttachmentUpload` import Service，属 P2「组件自身交互功能」白名单（异步搜索、文件上传）。
P3：`src/logic/**` 无 UI / 框架 import，可脱离组件单测（Logic/Service 共 6 个 spec 为纯函数调用；composable/组件 2 个 spec 走 setup 宿主与挂载）。
P4：数据 props 下行、事件 emit 上行；Logic 不引用 Hook/UI；依赖方向 Page/Component→Hook→Logic→Service 单向。

**二、架构层次**
文件行数上限：TicketForm 191、TicketTable 166、httpClient 153，均未超 300。
props 数量上限：TicketTable 6、TicketFormModal 4（表单状态聚合为 `TicketFormViewModel`，见下方偏离说明）。

**三、状态管理**
筛选/分页/排序存 URL（`useTicketQuery` 以 URL 为唯一来源，未另存 ref）；会话与权限进 Pinia；弹窗开关、表单值留局部。派生值（`hasMore`、`canCreate`、`canEdit`、`viewModel`）全部 computed。卸载清理由 `useRequestGuard`（`onScopeDispose`）与 `useAsyncSearch`（清 timer + abort）承担。

**四、UI 五态**
列表、详情、处理记录、编辑回填四处均走 `DataLoader`，五态齐全；刷新失败保留旧数据仅提示，首次失败才转 error；翻页空页不退回 empty（`resolvePagedState`）。

**五、错误处理**
`httpClient` 单点 try-catch，统一返回 `Result<T>`；`errorMapper` 归一为 `StandardError`，文案无技术术语（有断言：`should_produce_user_readable_message_without_technical_terms`）；超时 10s。

**六、表单验证**
规则集中在 `ticketValidation.logic.ts`；onChange 仅在 touched/已提交后报错、onBlur 首次报错、onSubmit 全量兜底；异步唯一性防抖 500ms 且输入即 abort 上一次；提交中禁用按钮、失败保留输入并聚焦首个错误字段。

**七、异步操作**
全 async/await；详情与处理记录由两个独立 Hook 并行发起；竞态用 AbortController + token 双保险；GET 指数退避重试 ≤3 次，POST/PUT/DELETE 不自动重试（非幂等）。

**八/九、命名与类型**
动词开头函数、is/has/can 布尔前缀、常量大写蛇形；文件命名符合 `xxx.logic.ts` / `xxx.service.ts` / `useXxx.ts` / PascalCase 组件。全仓无 `any`。

**十一、测试**
8 个 spec 文件：Logic 五个模块 + Service 两个模块 + `useRequestGuard` 清理竞态 + `TicketTable` 交互上报；命名统一 `should_xxx_when_xxx`，含边界（附件恰好等于 2MB、翻页空页、空白字符串必填）与错误路径（403 不重试、超时、取消、编号冲突）。

**十二、反模式**
无 `utils/index.ts`；无组件自持业务状态；Store 仅存会话。

---

## 未过项与偏离

### 1. 构建验证（已闭环 2026-09-03，沙箱实跑）
- `npm run typecheck`：0 错误。修了三处阻塞：`@arco-design/web-vue` 2.57.0 发布包缺类型文件（`es/index.d.ts` 不存在，2.58.0 已补回，遂升级）、缺 `@types/node`（`vite.config.ts` 用 `node:url`）、`AssigneeSelect.vue` 把字符串 `"false"` 传给布尔 prop（改 `:filter-option="false"`）。
- `npm run test`：8 文件 49 用例全绿。新增 `useRequestGuard.spec.ts`（3 个）与 `TicketTable.spec.ts`（2 个）；后者挂载须注册真实 Arco 插件，否则插槽不渲染。
- `npm run build`：成功，dist 产出（仅 chunk 体积警告，无害）。
- `npm run dev`：冒烟通过，首页 HTTP 200（标题"工单管理"）。
- 此前状态：沙箱曾因宿主未启用虚拟化无法启动；用户本机曾实跑 vitest 44/44（含 §5 修复）。

### 2. 类型可空性偏离清单第九条
清单要求「可空类型用 `Type | null`（不用 `undefined`）」。组件可选 props（如 `errorMessage?: string`）沿用 Vue 的 `?:` + `withDefaults` 惯例，实际类型含 `undefined`。
理由：Vue 的 props 默认值机制以 `undefined` 为「未传入」信号，强制改 `| null` 会让每个调用点显式传 `null`，与框架惯例冲突。领域数据字段（`assignee`、`followUpAt`）已严格使用 `| null`。此偏离仅限组件 props 层。

### 3. props 聚合为视图模型对象（已闭环 2026-09-04，复验）
`TicketFormModal` 若平铺表单状态需 8 个以上 props，触及清单「props 不超过 8 个」上限。改为聚合 `TicketFormViewModel` 单对象传入。复验结论：`protocol/decision-trees.md` 已有「props 计数规则」（聚合对象计为 1 个须满足全部三条），且该节正例即为 `TicketFormViewModel` 同构形态。本例三条均满足：接口在 `test/vue/src/types/TicketForm.types.ts` 具名定义，字段同属一张表单的状态，调用点以 `:form="formModal.viewModel.value"` 整体传入。按现行规范计 1 个 prop，原偏离关闭。

### 4. 页面函数计数依赖 Hook 提取
两个页面各只剩 1 个函数，是把行操作编排、确认弹窗、聚焦逻辑分别抽到 `useTicketRowOperations`、`useTicketConfirm`、`focusFirstErrorField` 的结果。这些 Hook 内部函数数量不受规范约束——指标满足了，复杂度只是转移了位置。

### 5. 超时用例失败与修复（已闭环 2026-09-03）
`should_return_timeout_error_when_request_exceeds_limit` 曾失败（期望 TIMEOUT，实际成功）：`sendMockRequest` 只在入口延迟段接 signal，handler 自身耗时裸跑，10ms 超时中断无人响应，违反 mockTransport 头注释承诺的"含超时/取消语义"。修复限 `src/services/mock/mockTransport.ts` 一处：handler 执行与 abort 信号竞速，中断按 AbortError 拒绝；spec 未动（期望正确）。重跑后 44/44 全绿。
