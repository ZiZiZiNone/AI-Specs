# Vue 3

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

Vue 3 框架专属规范。判定项目为 Vue 3 后按需读取，不必全量通读。

## 读取顺序

1. **reactivity.md** — ref / reactive / shallowRef / computed 选型，watch 边界。
   写任何状态前先看这个。
2. **state.md** — 归属结论到 Vue 实现的映射；URL 状态、Pinia store 边界。
3. **composable.md** — 组合式函数入参、返回值、清理、竞态。
4. **component.md** — props/emit、插槽、受控业务组件、可选性表达。
5. **router.md** — 路由定义、params/query 分工、守卫、权限三处一致。
6. **testing.md** — 各层测什么、用什么方式、不测什么。
7. **ui/** — 按组件库分子目录，判定后读取（现有 `arco/`）。

## 通用规范在别处

框架无关的原则不在本目录重复，遇到以下问题去对应文件：

- 分层职责与依赖方向 → frontend/rules/architecture.md
- 四大核心原则、Hook 层量化标准 → frontend/rules/core-principles.md
- 状态归属决策树 → frontend/rules/store.md
- Hook 拆分判据、props 计数规则 → frontend/protocol/decision-trees.md
- 异步、竞态、重试、超时 → frontend/rules/async-operations.md
- 错误归一与展示分级 → frontend/rules/error-handling.md
- 五态与乐观更新 → frontend/rules/ui-states.md
- 表单校验时机与规则归属 → frontend/rules/form-validation.md
- 样式与设计 token → frontend/rules/style.md
- 测试通用原则、mock 约定 → common/rules/test.md
- 参考写法 → frontend/examples/golden/

## 机制类结论的处理

本目录部分结论依赖 Vue 自身语义（如 `ComputedRef` 的只读性、reactive 代理身份），
这类条款在原处写明成立理由，便于复核。
判定方式见 frontend/examples/golden/README.md「示例教什么、不教什么」。

## 素材来源

本目录示例均为规范示范形态，完整自包含示例见 `frontend/examples/golden/`。
