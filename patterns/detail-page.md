# 详情页

定位：只管"由路由 id/参数定位单条记录并分区块展示"的详情页，链路为 Page→Hook→Logic→Service，区块组件只展示。

## 结构落点

分层定义引自 rules/architecture.md：

- Page："路由页面，负责组装组件与编排页面级状态，不承载业务逻辑。"
- Component："可复用 UI 单元，只负责展示与交互，不直接访问接口。"
- Hook："挂 UI 侧（供 Page/Component 使用），内部调用 Logic 完成业务；框架具体形态见 frameworks/<框架>/。"
- Logic："业务规则、状态流转、副作用编排，可复用、可测试。"
- Service："唯一访问后端接口的入口，负责请求与数据转换。"

本页分工：

- Page：从路由取 id/参数，调用详情 Hook，组装信息区块与操作区组件。
- Hook（详情 Hook）：直连 Service 拉取详情并管理五态；"Hook 可调用 Logic 与 Service；但业务判断一律下沉 Logic，Hook 只负责调用顺序、UI 状态与错误分流。"
- Logic：详情态判定（有数据/空/不存在）、操作许可判定（能否编辑/删除）、字段可见性等可单测规则。
- Service：fetchDetail(id) 及统一错误归一；"try-catch 收敛在唯一请求出口（如 httpClient），业务 Service 方法不重复包裹"（rules/error-handling.md）。
- Component（信息区块、操作区、时间线）：只展示与回调，不发请求、不读路由。

防纯转发：Logic 是否保留，用 rules/architecture.md 的判据："判据：该 Logic 函数删掉后，是否有任何业务规则随之丢失？"只做转发的取数函数不该存在。

## 状态归属

按 protocol/decision-trees.md 状态归属决策划分：

- 记录 id/参数：来自路由（URL），是详情页的唯一入口标识，页面不另存副本。
- 详情数据与五态：页面级、需信息区块/操作区/错误占位多处共享，放在详情 Hook 内。
- 当前用户/权限等跨页面状态：进入 Store，经 Logic 消费（见 patterns/permission.md）。
- 操作区弹窗（编辑/删除确认）的开关：触发点附近的局部状态；跨区块共享时才上移到页面。

行操作编排（确认→执行→反馈→跳转/刷新）按关注点放入独立 Hook，不与详情加载 Hook 混合；混合即触 protocol/decision-trees.md Hook 拆分决策的拆分条件。

## 五态与错误

整体态与操作反馈是两个维度（rules/ui-states.md），与 patterns/list-page.md 的刷新语一致：

- 首次加载走 idle → loading → success / error；禁止跳过 loading。
- 无数据时的失败整体转 error 并渲染错误占位加重试；rules/ui-states.md："详情不存在 → error，显示"内容不存在或已删除""。
- 已有数据时的刷新失败："整体态保持 `success`，错误只经 `errorMessage` / Toast 呈现。"；"已有内容不得因一次失败而消失。"
- 行内操作（编辑/删除/优先级调整）失败走操作反馈（Toast 或字段级错误），不清空详情内容。
- 请求取消（CANCELED）是预期行为，不进入 error 态。
- 快速切换 id 时用竞态双保险：signal 实际下传加序号判定，过期结果作废。

## 规则

- 详情数据集中在详情 Hook 加载，页面与区块组件内不散落请求。
- id 只从路由读取一处，不在组件内复制为第二份状态。
- 加载中、失败（含不存在）、空数据三态齐全，无空白页。
- 操作（编辑/删除）走对应行操作流程，不直接改详情状态；失败按快照回滚。
- 区块组件只收 props 并上报回调；是否可操作由 Logic 判据决定，见 patterns/permission.md 的可见与禁用区分。
- 刷新失败保留旧数据；**`success` 与非空 `errorMessage` 并存是合法状态**。
- 删除成功后按规则决定去向（返回列表或下一条），该去向判定落在 Logic。

## 正例指针

- test/vue/src/pages/TicketDetailPage.vue：页面只做组装，id 取自路由。
- test/vue/src/hooks/useTicketDetail.ts：详情加载与五态管理，含不存在判定与 reload。
- test/vue/src/logic/uiState.logic.ts：resolveDetailState 判定 success/empty。
- test/vue/src/components/ticket/TicketDetailPanel.vue：信息区块只展示与回调。
- test/vue/src/components/ticket/TicketLogTimeline.vue：记录时间线展示组件。
- test/vue/src/hooks/useTicketLogs.ts：详情关联记录的独立加载关注点。
- test/vue/src/components/feedback/DataLoader.vue：五态统一容器。
- test/vue/src/components/feedback/ErrorPlaceholder.vue：页面级错误占位，含重试与返回。
- test/vue/src/logic/ticketPermission.logic.ts：行级操作许可判定，供详情操作区消费。

## 反例指针

- examples/golden/anti-examples.md「1. 页面直接调用 Service」：删除与反馈编排落在页面，换入口就要复制一遍。
- examples/golden/anti-examples.md「2. 展示型组件自己加载数据」：弹窗/区块组件内部发请求取详情，与接口绑定且页面无法感知错误态。
- examples/golden/anti-examples.md「11. Logic 层空转」：谁能删、什么状态可改等规则散落页面与组件。
- examples/golden/anti-examples.md「3. 竞态保护形似而无实效」：signal 未下传、引用比较判新旧。

## 自检指针

- checklists/detailed-check.md「一、核心原则检查」：P1 页面薄层、P2 组件解耦、P4 单向数据流。
- checklists/detailed-check.md「二、架构层次检查」：Page/Hook/Logic/Service 各层条目。
- checklists/detailed-check.md「三、状态管理检查」：状态归属、单一来源、无 props 副本。
- checklists/detailed-check.md「十一、测试检查」：Logic 单测、边界与错误路径覆盖。
