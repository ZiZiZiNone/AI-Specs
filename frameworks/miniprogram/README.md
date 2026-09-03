# 微信小程序

微信原生 + TS 框架专属规范。判定项目为小程序后按需读取，不必全量通读。

## 技术路线（已定 2026-09-03）

- 微信原生（WXML / WXSS / TS），不经 uni-app / Taro 转译。
- TS 基线：`miniprogram-api-typings` 提供 API 类型；业务代码 TS 严格模式。
- 复用机制：B 方案——逻辑复用走 `logic/` 纯函数，**不得用 behaviors 承载业务逻辑**。
  behaviors 仅允许用于合并 lifetimes / observers 等框架钩子场景，且须在原处写明理由。

## Hook 层映射

`rules/architecture.md` 规定 Hook 为 UI 侧的状态/副作用复用单元，
但小程序无 Hook 机制。本目录中 Hook 层由 `logic/` 纯函数承担：

- 状态留在 Page / Component 的 `data`，逻辑为框架无关纯函数（可单测，对应 `rules/architecture.md`「Logic 保持框架无关」）。
- 页面只负责调用逻辑函数并 `setData` 回写；业务判断一律在 logic 内，不在页面 methods 里。
- `protocol/decision-trees.md` 的 Hook 拆分判据在本目录映射为 logic 函数拆分判据，结论相同。

## 读取顺序

1. **state.md** — setData 语义（异步合并、路径更新）、data 归属到实现的映射、
   页面间传参与全局状态边界。
2. **logic.md** — B 方案：纯函数入参/返回值约定、setData 回写约定、清理与竞态。
   在 vue3 划分中对应 `composable.md` 的位置。
3. **component.md** — properties / observers / lifetimes、受控组件、可选性表达。
4. **router.md** — navigateTo / redirectTo / switchTab / reLaunch 分工、params 与 query、
   登录守卫、app.json 与分包。
5. **service.md** — wx.request 封装（baseURL、登录态、错误归一）、Service 层映射。
6. **testing.md** — 各层测什么、miniprogram-simulate / automator 用法、不测什么。
7. **ui/** — 按组件库分子目录，判定后读取（`tdesign-miniprogram` / `vant-weapp`）。

## 通用规范在别处

框架无关的原则不在本目录重复，遇到以下问题去对应文件：

- 分层职责与依赖方向 → rules/architecture.md
- 四大核心原则、Hook 层量化标准 → rules/core-principles.md
- 状态归属决策树 → rules/store.md
- Hook（logic 函数）拆分判据、props 计数规则 → protocol/decision-trees.md
- 异步、竞态、重试、超时 → rules/async-operations.md
- 错误归一与展示分级 → rules/error-handling.md
- 五态与乐观更新 → rules/ui-states.md
- 表单校验时机与规则归属 → rules/form-validation.md
- 样式与设计 token → rules/style.md
- 测试通用原则、mock 约定 → rules/test.md
- 参考写法 → examples/golden/

## 机制类结论的处理

本目录部分结论依赖小程序自身语义（如 setData 合并时机、Component lifetimes 顺序），
这类条款在原处写明成立理由，便于复核。
判定方式见 examples/golden/README.md「示例教什么、不教什么」。

## 代码风格多选约定

本目录填充代码风格时，若最优实现方式不唯一，须并列给出各候选的最规范写法
（含违反条目与取舍说明），由用户选择其一确定为唯一风格，不得自行取舍后只给一种。
