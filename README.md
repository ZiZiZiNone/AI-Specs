# Frontend AI Operating System v3.0 Final

## 路径基准

本文件所在目录即**规范库根**，记作 `<SPEC_ROOT>`。本库所有文档中形如 `rules/xxx.md`、
`protocol/xxx.md`、`frameworks/xxx/` 的裸路径，**一律相对 `<SPEC_ROOT>` 解析，不是业务项目根**。
在外部业务项目中应用本规范时，读取任何规范文件都要拼成 `<SPEC_ROOT>/rules/xxx.md`；
业务项目自己的 `README.md`／`AGENTS.md` 与本库同名文件是两回事，不要混用。

接入外部项目的方式见 `<SPEC_ROOT>/INTEGRATION.md`。

核心思想：
 1 让不同AI实现相同结构化开发
 2 利用能力优秀的AI实现“标准答案”，其他AI根据标准答案实现。（模拟实现蒸馏AI开发方式）

统一AI开发行为与工程规范。通用规范与框架无关；框架专属规范按 frameworks/ 子目录组织。

核心哲学：页面薄、组件自治、Logic外置、高内聚、低耦合、局部状态优先。

## 模块导航
- **rules/**：核心规则（框架无关）
  - constitution.md：宪法（禁止猜测、用户决策权、规范优先、已覆盖直接执行、引用可验伪、授权面）
  - core-principles.md：四大核心原则（页面薄层、组件解耦、逻辑解耦、单向数据流）
  - architecture.md：架构分层（Page/Component/Hook/Logic/Service）
  - store.md：状态管理（状态归属决策树）
  - naming.md：命名规范
  - typescript.md：TypeScript 规范
  - api.md：接口访问规范
  - reusability.md：复用抽象时机
  - business-rule.md：业务规则位置
  - ui-rule.md：UI 组件规范
  - comment.md：注释规范
  - test.md：测试规范（含 mock/假数据约定）
  - refactor.md：重构规范
  - performance.md：性能优化规范
  - error-handling.md：错误处理规范
  - ui-states.md：UI 状态管理（loading/error/empty/success）
  - form-validation.md：表单验证规范
  - async-operations.md：异步操作规范
  - style.md：样式规范（设计 token 单一来源、工具类框架共存）

- **frameworks/**：框架专属规范（进入项目先判定框架，再进入对应子目录）
  - vue3/：README（读取顺序）、reactivity.md、state.md、composable.md、component.md、router.md、testing.md、ui/arco/
  - react/：hook.md、state.md、ui/
  - miniprogram/：README

- **protocol/**：开发协议
  - task-analysis.md：任务类型判定
  - task-boundary.md：任务边界（授权面三档、消费者判据四问、四类越界）
  - requirement-completeness.md：需求完整性检查
  - implementation-order.md：实现顺序（Pattern→State→Logic→Service→UI）
  - decision-trees.md：决策流程图（状态归属/Hook vs Logic/Hook 拆分/组件拆分等）
  - final-gate.md：最终闸门验收（含无法验证时的声明要求）

- **patterns/**：页面与组件标准模式（列表/表单/详情/权限/表格/上传）

- **anti-patterns/**：反模式与对策（胖页面/全局化/万能工具库/隐藏副作用/巨型组件）

- **checklists/**：交付自检
  - self-check.md：简化版自检清单
  - detailed-check.md：详细自检清单（〇任务边界 + 一至十五共 16 章，全面覆盖）

- **tasks/**：任务流程与输出模板（Feature/Bugfix/Refactor/Review；Review 含评分标准）

- **examples/golden/**：示例与风格指南
  - list-page.md：列表页（URL 状态、竞态、刷新保留数据、乐观更新）
  - form-validation.md：表单三段校验、异步唯一性、动态可见性
  - service-layer.md：统一请求出口、错误归一、幂等重试
  - anti-examples.md：负向示例集（12 条，含违反条目与正确做法）

- **test/**：按本规范落地的验证产物，golden 示例的素材来源
  - vue/：Vue 3 + Arco + Tailwind 工单管理（正向素材，构建未验证）
  - react/：早期未按规范落地的产物（负向素材，不可构建）

## 工作流
1. **判定框架**：读取项目代码与依赖（如 package.json）判定框架，按需进入 frameworks/<框架>/ 读取框架规范（涉及组件库再进入 ui/<组件库>/ 二级目录）；无对应目录时仅遵循通用规范，不套用其他框架规则
2. **分析任务**：按 protocol/task-analysis 判定任务类型，走 tasks/ 对应流程；同时确定授权面（只读/定向写/开放写，见 protocol/task-boundary）
3. **查询模式与决策**：查 patterns 找标准模式；遇决策点查 protocol/decision-trees（状态归属/Hook vs Logic/组件拆分/复用抽象等）
4. **实现代码**：遵守 rules/core-principles（四大核心原则）与具体 rules、框架规范实现；拿不准写法时对照 examples/golden
5. **验收检查**：过 checklists/detailed-check 全面自检与 protocol/final-gate 验收，按 tasks/ 内输出模板产出。**构建/类型检查/测试必须实际执行**；执行不了则按 final-gate 显式声明未验证项，不得以"代码已写完"当作完成

## 加载策略
**必读**：
- rules/constitution.md（宪法）
- rules/core-principles.md（四大核心原则）
- protocol/task-boundary.md（任务边界：授权面与消费者判据；决定"该不该做"，先于"怎么做"）

**按需读取**：
- 框架规范：只读判定出的 frameworks/<框架>/ 子目录
- 决策辅助：遇到决策点时读取 protocol/decision-trees
- 具体规则：根据当前任务涉及的领域读取对应 rules/
- 标准模式：匹配到对应页面类型时读取 patterns/
- 参考写法：需要具体形态时读取 examples/golden/ 对应文件
- 自检清单：实现完成后读取 checklists/detailed-check

**不要全量通读**：按需加载即可。

## 演化
发现缺口→提问→用户决策→更新规范。
