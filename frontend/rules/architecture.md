# 架构

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析，首段为 `common/`、`frontend/` 或 `backend/`。见 `<SPEC_ROOT>/README.md`「路径基准」。本文 `src/*` 指业务项目根下源码，与规范库路径含义不同。

依赖只能向下：Page/Component→Hook→Logic→Service；禁止反向依赖。

## 分层职责
- Page：路由页面，负责组装组件与编排页面级状态，不承载业务逻辑。
- Component：可复用 UI 单元，只负责展示与交互，不直接访问接口。
- Hook：UI 侧的状态/副作用复用单元，挂 UI 侧（供 Page/Component 使用），内部调用 Logic 完成业务；Vue 3 形态见 `frontend/frameworks/vue3/composable.md`，小程序侧由 Logic 承担见 `frontend/frameworks/miniprogram/logic.md`。
- Logic：业务规则、状态流转、副作用编排，可复用、可测试。
- Service：唯一访问后端接口的入口，负责请求与数据转换。

## 目录映射（业务项目根相对路径）
- `src/pages/`：路由页面（Page）。
- `src/components/`：可复用组件（Component）。
- `src/hooks/`：UI 侧 Hook。
- `src/logic/`：业务 Logic。
- `src/services/`：接口 Service。
- `src/store/`：全局 Store。
- 文件命名：组件文件与组件同名（PascalCase），hook/logic/service 文件用 camelCase。

## 规则
- 依赖只能向下：Page/Component→Hook→Logic→Service。仅允许两类跨层直连：Page/Component 直接调 Logic，Hook 直接调 Service；Page/Component 直接调 Service 一律禁止。同层组合（组件嵌套、Hook 组合）不受限，禁止任何向上/反向依赖。
- 禁止 Service 依赖 Logic、Logic 依赖 UI 组件与 Hook、Component 直接调接口。
- Hook 可调用 Logic 与 Service；但业务判断一律下沉 Logic，Hook 只负责调用顺序、UI 状态与错误分流。
- Logic 保持框架无关（不 import Hook/UI），保证可单测。
- Store 的 action 可调用 Service 加载自身拥有的状态，不加载页面业务数据（见 `frontend/rules/store.md`「规则」）。
- 跨层复用走 Logic/Service，不通过 props 层层透传业务逻辑。
- 高内聚低耦合：同一职责不分散到多处；模块间只通过明确接口（props / Service / Store）通信，不依赖内部实现。

## 不要制造纯转发层
「Service 是唯一接口入口」约束的是**请求代码写在哪**，不是**谁能调用它**。
为了凑满 Page→Hook→Logic→Service 的链条而写一个只做转发、不含任何判定的
Logic 函数，属于无意义包装：它增加一层跳转却不承载规则，
后续维护者还需逐层追踪才能找到真正的取数点。

判据：该 Logic 函数删掉后，是否有任何业务规则随之丢失？
若没有，就不该存在。
