# 隐藏副作用

对齐关系：见 `rules/core-principles.md` P3 逻辑完全解耦原则与 P4 单向数据流原则，本文件讲副作用显式声明。

## 定义

调用方无感知即被改全局、发请求、写状态，就是隐藏副作用。

## 判定信号

### 可观测信号（引用 `rules/core-principles.md` 原文数字，保持全库一致）

- 全库统一阈值：页面 300 行 / 函数 3 个 / 状态 5 个；组件 300 行 / props 8 个；Hook 150 行 / 成员 10 个；“禁止以搬运换达标”。

- Logic“可调用 Service，但不直接调用 axios/fetch”，直调请求库即越层副作用。

- Logic“可单独测试（不需要挂载组件）”，结果依赖调用顺序、需特定时序才能复现即藏副作用。

- Hook“副作用有对应清理（取消请求/清定时器/解绑监听）”，无清理即半截副作用。

- 依赖“只能向下”，组件反向改父状态、Logic 反向调 Hook 即反向副作用。

### 症状（命中 2 条即进入对策）

- 结果依赖调用顺序，难复现、难测试，同输入不能得同输出。

- retryable、guard、取消器建了却无人消费、未下传，机制形似实无。

- 用注释解释绕过问题而非消除根因，注释一删 bug 即现形。

- 状态修改不走明确 action，调用链中悄悄写 Store 或改传入引用。

## 对策（拆到哪层，四选一写明）

- 请求副作用 → Service：唯一接口入口，try-catch 与超时收敛，接受外部 signal。

- 编排副作用 → Hook：调用顺序、loading/error 分流、取消与序号守卫收敛于 Hook。

- 业务判定 → Logic：返回结果与友好错误，不抛异常，不写死提示方式。

- 状态写入 → Store 明确 action：单一写入点，派生用 selector 实时算。

- 候选并列（交用户定）：A. Hook 直调 Service 判据在 Logic；B. 经 Logic 转发再调 Service。是否多一层无判定包装，选用由用户定。

## 正例指针

- `test/vue/src/hooks/useRequestGuard.ts`：signal 下传请求 + 单调序号双保险，取消不进 error 态。

- `test/vue/src/hooks/useTicketList.ts`：加载与错误分流在 Hook，判定下沉 Logic。

- `test/vue/src/logic/ticketQuery.logic.ts`：纯函数可单测，无框架依赖无 UI 状态。

## 反例指针（`examples/golden/anti-examples.md`，标题原文引用，不编新条号）

- “3. 竞态保护形似而无实效”：来源 `test/react/src/hooks/useUserList.ts:28-45`，signal 未下传且用引用比新旧。

- “5. retryable 计算了但没人用”：来源 `test/react/src/services/user.service.ts`，字段装饰化无消费者。

- “9. useEffect 依赖注释掩盖问题”：来源 `test/react/src/pages/UserListPage.tsx:44-46`，注释绕开漏依赖。

## 自检指针（`checklists/detailed-check.md`，用小节名）

- “隐藏副作用”：显式声明、请求走 Logic/Service、状态走明确 action 三项。

- “状态来源”：更新走明确入口，无隐藏修改。

- “竞态保护”：signal 已下传、序号守卫、不比对象引用三项。

- “注释”：写为什么不写是什么，无复述型注释与绕问题注释。

## 决策指针（`protocol/decision-trees.md`，指针短语）

- “Hook vs Logic 决策”：是否需框架能力定副作用归属，不需即纯 Logic。

- “API 调用决策”：Hook 可直调 Service 取数，但不写业务判断。
