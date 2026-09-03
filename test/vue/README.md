# 规范测试：工单管理系统（Vue 3 + Tailwind + Arco）

本目录是对 Frontend AI Operating System v3.0 规范的实际执行测试。任务类型按
`protocol/task-analysis.md` 判定为 **Feature**，流程走 `tasks/feature.md`。

## 需求

### 目标
实现工单管理模块：工单列表、新增/编辑工单弹窗、工单详情（含处理记录）。

### 验收标准
1. 列表支持搜索/筛选/排序/分页，筛选条件刷新后保持。
2. 新增与编辑走同一表单，三种校验时机 + 异步唯一性校验 + 文件校验齐全。
3. 详情页基本信息与处理记录并发加载，处理记录失败不影响基本信息。
4. 所有数据加载场景五态齐全（idle/loading/success/error/empty）。
5. 危险操作（关闭工单、删除）二次确认；优先级调整走乐观更新并可回滚。
6. 按钮级权限由 Store 权限经 Logic 判定，无权限不渲染。
7. `npm install && npm run dev` 可直接运行（内置 mock，不依赖真实后端）。
8. Logic 与 Service 关键分支有测试断言，`npm run test` 通过。

### 范围 / 边界
- 范围内：上述三个视图及其 Logic/Service/Hook/Store。
- 范围外（YAGNI，不实现）：登录页、真实后端、国际化、暗色主题、工单流转审批链。
- mock 数据为随机生成的假数据，仅用于跑通链路，不代表任何真实业务数值。

### 接口契约
所有接口经 `src/services` 访问，统一返回 `Result<T>`。

| 方法 | 用途 |
|---|---|
| `GET /api/tickets` | 列表：page/pageSize/keyword/status/priority/assigneeId/sortBy/sortOrder |
| `GET /api/tickets/:id` | 详情 |
| `POST /api/tickets` | 新增 |
| `PUT /api/tickets/:id` | 编辑 |
| `DELETE /api/tickets/:id` | 删除 |
| `PATCH /api/tickets/:id/status` | 关闭/重开 |
| `PATCH /api/tickets/:id/priority` | 优先级调整（乐观更新目标） |
| `GET /api/tickets/:id/logs` | 处理记录分页 |
| `POST /api/tickets/check-code` | 工单编号唯一性校验 |
| `GET /api/users?keyword=` | 处理人异步搜索 |
| `POST /api/upload` | 附件上传 |
| `GET /api/session` | 当前用户与权限 |

## 设计

### Pattern
- 列表页 → `patterns/list-page.md`（Search→Logic→Service→Table）+ `patterns/table.md`
- 表单弹窗 → `patterns/form-page.md` + `rules/form-validation.md` + `patterns/upload.md`
- 详情页 → `patterns/detail-page.md`
- 权限 → `patterns/permission.md`

### State（按 `rules/store.md` 状态归属决策）
| 状态 | 归属 | 依据 |
|---|---|---|
| 搜索词/筛选/排序/分页 | **URL 参数** | `rules/store.md`：「**需要刷新后保持** → **URL 参数（持久化状态）**」 |
| 弹窗开关、表单字段值、上传进度 | 组件内 / 页面局部 | `rules/store.md`：「只在单个组件内使用 → 组件内局部状态」 |
| 列表数据、详情数据、提交中 | Hook（页面级） | `rules/ui-states.md` Logic 层状态 |
| 当前用户与权限 | Pinia Store | `rules/store.md`：「跨页面/跨模块或多处需要响应式共享 → 进入 Store」 |

### Logic（框架无关，可单测）
- `ticketQuery.logic.ts` — 查询参数规范化、URL 序列化/反序列化、分页计算
- `ticketValidation.logic.ts` — 字段规则定义与校验执行（含依赖校验、可见性）
- `ticketStatus.logic.ts` — 状态流转合法性、可执行动作判定
- `ticketPermission.logic.ts` — 权限判定
- `attachment.logic.ts` — 文件类型/大小校验
- `uiState.logic.ts` — 五态判定（success vs empty）

### Service
`httpClient.ts` 统一超时（10s）、指数退避重试（≤3 次，仅可重试错误）、取消、错误归一为 `StandardError`；各 service 只做业务语义方法与数据转换；`mockServer.ts` 提供内存假后端。

### Hook（UI 侧状态与副作用）
`useTicketQuery` / `useTicketList` / `useTicketDetail` / `useTicketLogs` /
`useTicketForm` / `useTicketActions` / `useAsyncSearch` / `useAsyncUnique`

## 实现

文件清单见目录结构；分层严格对应 `rules/architecture.md` 目录映射。

## 检查

见 `CONFORMANCE.md`（自检结果）与 `SPEC-GAPS.md`（执行中发现的规范缺口）。
