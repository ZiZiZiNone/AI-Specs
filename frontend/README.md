# frontend

前端专属规范（Vue 3 / 微信小程序）。与 `common/`、`backend/` 平级。

## 用法

- 通用规则（宪法、四条通用原则、命名抽象、测试、重构、性能、注释、任务边界）在 `common/`，
  **不在本目录重复**；本目录只放前端专属结论。
- 进入业务项目先判定框架（读代码与依赖，如 `package.json`），再按需读取 Vue 3 的 `frontend/frameworks/vue3/` 或小程序的 `frontend/frameworks/miniprogram/`；
  涉及 UI 组件库时进入 Vue 3 的 `frontend/frameworks/vue3/ui/<组件库>/` 或小程序的 `frontend/frameworks/miniprogram/ui/<组件库>/` 二级目录。
  无对应目录时仅遵循 `common/` 通用规范，**不套用其他框架的规则**。

## 子目录

- `frontend/rules/`：前端专属核心规则（目录入口见 `frontend/rules/architecture.md`「规则」；各文件为 architecture、store、api、error-handling、async-operations、ui-rule、ui-states、form-validation、style、typescript、import-path，另有 `core-principles.md` 为 FE-101 至 FE-104 落地）
- `frontend/protocol/`：实现顺序、决策树（目录入口见 `frontend/protocol/implementation-order.md`「实现顺序」与 `frontend/protocol/decision-trees.md`「状态归属决策」）
- `frontend/patterns/`：页面与组件标准模式（列表 / 表单 / 详情 / 权限 / 表格 / 上传；目录入口见 `frontend/patterns/list-page.md`「规则」）
- `frontend/anti-patterns/`：反模式与对策（胖页面 / 全局化 / 万能工具库 / 隐藏副作用 / 巨型组件；目录入口见 `frontend/anti-patterns/fat-page.md`「对策（拆到哪层，四选一写明）」）
- `frontend/tasks/`：任务流程与输出模板（Feature / Bugfix / Refactor / Review；目录入口见 `frontend/tasks/feature.md`「输出模板」）
- `frontend/checklists/`：交付自检（`self-check.md` 简化版、`detailed-check.md` 详细版；目录入口见 `frontend/checklists/detailed-check.md`「适用性判定」）
- `frontend/frameworks/`：框架专属规范
  - `vue3/`：README（读取顺序）、reactivity、state、composable、component、router、testing、`ui/arco/`
  - `miniprogram/`：README（读取顺序）、state、logic、component、router、service、testing、
    `ui/tdesign-miniprogram/`、`ui/vant-weapp/`
- `frontend/examples/golden/`：示例与风格指南
  （README、list-page、form-validation、service-layer、anti-examples）；示例见 `frontend/examples/golden/` 自包含示例

## 工作流

1. **判定框架** → 读 Vue 3 的 `frontend/frameworks/vue3/` 或小程序的 `frontend/frameworks/miniprogram/`
2. **分析任务** → `common/protocol/task-analysis.md` 定类型，`common/protocol/task-boundary.md` 定授权面
3. **查询模式与决策** → `frontend/patterns/`、`frontend/protocol/decision-trees.md`
4. **实现代码** → 遵守 `common/principles.md` 与 `frontend/rules/`、`frontend/frameworks/`
5. **验收检查** → `frontend/checklists/detailed-check.md` 与 `common/protocol/final-gate.md`，
   构建 / 类型检查 / 测试**必须实际执行**

## 说明

- React 框架规范已移除（2026-09-03）：本库前端侧当前只覆盖 Vue 3 与微信小程序。
- 框架目录内涉及 UI 组件库时进入其 `ui/<组件库>/` 二级目录；无对应目录时不套用其他库规范。
