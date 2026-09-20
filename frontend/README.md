# frontend

前端专属规范（Vue 3 / 微信小程序）。与 `common/`、`backend/` 平级。

## 用法

- 通用规则（宪法、四条通用原则、命名抽象、测试、重构、性能、注释、任务边界）在 `common/`，
  **不在本目录重复**；本目录只放前端专属结论。
- 进入业务项目先判定框架（读代码与依赖，如 `package.json`），再按需读取 `frontend/frameworks/<框架>/`；
  涉及 UI 组件库时进入 `frontend/frameworks/<框架>/ui/<组件库>/` 二级目录。
  无对应目录时仅遵循 `common/` 通用规范，**不套用其他框架的规则**。

## 子目录

- `frontend/rules/`：前端专属核心规则
  - `core-principles.md`：P1–P4 四条原则的前端落地与量化标准
  - `architecture.md`：架构分层（Page / Component / Hook / Logic / Service）
  - `store.md`：状态管理（状态归属决策树）
  - `api.md`：接口访问规范（Service 唯一入口）
  - `error-handling.md`：错误处理规范
  - `async-operations.md`：异步操作规范（竞态、取消、重试）
  - `ui-rule.md`：UI 组件规范
  - `ui-states.md`：UI 状态管理（loading / error / empty / success）
  - `form-validation.md`：表单验证规范
  - `style.md`：样式规范（设计 token 单一来源）
  - `typescript.md`：TypeScript 规范
  - `import-path.md`：导入路径规范
- `frontend/protocol/`
  - `implementation-order.md`：实现顺序（Pattern→State→Logic→Service→UI）
  - `decision-trees.md`：决策流程图（状态归属 / Hook vs Logic / 组件拆分等）
- `frontend/patterns/`：页面与组件标准模式（列表 / 表单 / 详情 / 权限 / 表格 / 上传）
- `frontend/anti-patterns/`：反模式与对策（胖页面 / 全局化 / 万能工具库 / 隐藏副作用 / 巨型组件）
- `frontend/tasks/`：任务流程与输出模板（Feature / Bugfix / Refactor / Review，Review 含评分标准）
- `frontend/checklists/`：交付自检（`self-check.md` 简化版、`detailed-check.md` 详细版 16 章）
- `frontend/frameworks/`：框架专属规范
  - `vue3/`：README（读取顺序）、reactivity、state、composable、component、router、testing、`ui/arco/`
  - `miniprogram/`：README（读取顺序）、state、logic、component、router、service、testing、
    `ui/tdesign-miniprogram/`、`ui/vant-weapp/`
- `frontend/examples/golden/`：示例与风格指南
  （README、list-page、form-validation、service-layer、anti-examples）
- `frontend/test/`：按本规范落地的验证产物
  - `vue/`：Vue 3 + Arco + Tailwind 工单管理（正向素材；typecheck 零错误、vitest 49/49、
    build 与 dev 冒烟均已验证 2026-09-03，沙箱实跑，见 `frontend/test/vue/CONFORMANCE.md`）
  - `react/`：早期未按规范落地的产物（负向素材，不可构建）
  - `miniprogram/`：微信原生 + TS 分页 Logic 与受控筛选组件
    （正向素材，见 `frontend/test/miniprogram/README.md`）

## 工作流

1. **判定框架** → 读 `frontend/frameworks/<框架>/`
2. **分析任务** → `common/protocol/task-analysis.md` 定类型，`common/protocol/task-boundary.md` 定授权面
3. **查询模式与决策** → `frontend/patterns/`、`frontend/protocol/decision-trees.md`
4. **实现代码** → 遵守 `common/principles.md` 与 `frontend/rules/`、`frontend/frameworks/`
5. **验收检查** → `frontend/checklists/detailed-check.md` 与 `common/protocol/final-gate.md`，
   构建 / 类型检查 / 测试**必须实际执行**

## 说明

- React 框架规范已移除（2026-09-03）：本库前端侧当前只覆盖 Vue 3 与微信小程序。
  `frontend/test/react/` 作为 `frontend/examples/golden/anti-examples.md` 的反例证据保留，
  不在框架规范覆盖内。
- 框架目录内涉及 UI 组件库时进入其 `ui/<组件库>/` 二级目录；无对应目录时不套用其他库规范。
