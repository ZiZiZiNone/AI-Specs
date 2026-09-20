# 列表页

定位：只管"带筛选 + 分页/排序的查询列表页"这一种页面，链路固定为 Search→Logic→Service→Table。

## 结构落点

分层定义引自 frontend/rules/architecture.md：

- Page："路由页面，负责组装组件与编排页面级状态，不承载业务逻辑。"
- Component："可复用 UI 单元，只负责展示与交互，不直接访问接口。"
- Hook："挂 UI 侧（供 Page/Component 使用），内部调用 Logic 完成业务；框架具体形态见 frontend/frameworks/<框架>/。"
- Logic："业务规则、状态流转、副作用编排，可复用、可测试。"
- Service："唯一访问后端接口的入口，负责请求与数据转换。"

本页分工：

- Search（Component）：受控筛选表单，只接收 query、以上报通知变更，不另存筛选副本。
- Hook（取数 Hook）：直连 Service 取数并管理 UI 状态；"Hook 可调用 Logic 与 Service；但业务判断一律下沉 Logic，Hook 只负责调用顺序、UI 状态与错误分流。"
- Logic：查询参数解析/序列化、改筛选回页规则、删除后页码修正、列表态判定。
- Service：fetchList(params) 及统一错误归一；"try-catch 收敛在唯一请求出口（如 httpClient），业务 Service 方法不重复包裹"（frontend/rules/error-handling.md）。
- Table：只渲染数据与事件回调，职责以 frontend/patterns/table.md 为准，本页不再重复定义。

防纯转发：Logic 是否保留，用 frontend/rules/architecture.md 的判据："判据：该 Logic 函数删掉后，是否有任何业务规则随之丢失？"若没有，就不该存在。

## 状态归属

按 frontend/protocol/decision-trees.md 状态归属决策划分：

- 筛选/分页/排序：属"列表筛选条件（需保留）"，归属"Store 或 URL 参数"，"刷新后保持"。本库统一取 URL 为唯一来源，不另存 ref 副本。
- 列表数据与五态：页面级、需 Table/分页/空态容器多处共享，放在取数 Hook 内。
- 当前用户/权限等跨页面状态：进入 Store，经 Logic 消费（见 frontend/patterns/permission.md）。
- 搜索框"输入中"的草稿值可短暂本地持有，防抖后上报；frontend/rules/ui-states.md："输入防抖：300ms 后触发"。

## 五态与错误

整体态与操作反馈是两个维度（frontend/rules/ui-states.md）：

- 首次加载走 idle → loading → success / empty / error；禁止跳过 loading。
- 已有数据时的刷新/翻页失败："整体态保持 `success`，错误只经 `errorMessage` / Toast 呈现。"；"已有内容不得因一次失败而消失。"
- 空集区分三条（frontend/rules/ui-states.md）："列表第一页为空 → empty"；"列表翻页为空 → 保持 success，Toast 提示"没有更多数据""；"搜索无结果 → empty，显示"未找到相关内容""。
- 分级展示（frontend/rules/error-handling.md）："首次加载失败：显示错误占位 + 重试按钮"；"翻页失败：Toast 提示 + 保留当前页数据"；"刷新失败：Toast 提示 + 保留旧数据"。
- 请求取消（CANCELED）是预期行为，不进入 error 态。
- 竞态用双保险：AbortController 的 signal 实际下传到请求，同时用单调序号忽略过期结果。

## 规则

- 筛选/分页/排序以 URL 为唯一来源，组件内不另存副本，避免双写入点。
- 改筛选或改 pageSize 必回第一页；删除末页最后一条后按规则回退页码。
- 页面只做组装，直接定义的函数不超过 3 个（frontend/rules/core-principles.md P1）；编排下沉到各 Hook。
- 取数 Hook 内不写业务判断；页码修正、行操作许可等一律下沉 Logic。
- Table 不请求数据、不做权限判断、不持有五态（见 frontend/patterns/table.md）。
- 刷新失败保留旧数据；**`success` 与非空 `errorMessage` 并存是合法状态**。
- 搜索输入防抖 300ms；加载中保留上次结果，仅显示顶部 loading 条。
- 序列化与解析必须成对实现且互逆，并有往返一致断言覆盖。

## 正例指针

- frontend/examples/golden/list-page.md：URL 唯一来源、回页规则、刷新保留旧数据、竞态双保险、快照回滚、页面只做组装。
- frontend/test/vue/src/pages/TicketListPage.vue：页面只做组装，状态全部来自 Hook。
- frontend/test/vue/src/hooks/useTicketQuery.ts：筛选条件由 URL 实时解析得出，不另存 ref。
- frontend/test/vue/src/logic/ticketQuery.logic.ts：applyFilterChange、applyPageChange、resolvePageAfterRemoval 三个判定。
- frontend/test/vue/src/logic/ticketQuery.logic.spec.ts：序列化与解析互逆断言。
- frontend/test/vue/src/hooks/useTicketList.ts：已有数据时走刷新语义，首次失败才整体转错误态。
- frontend/test/vue/src/hooks/useRequestGuard.ts：Abort 中断加序号判定的双保险封装。
- frontend/test/vue/src/logic/uiState.logic.ts：resolveListState 判定 success/empty。
- frontend/test/vue/src/components/feedback/DataLoader.vue：五态统一容器，页面不写 v-if 链。

## 反例指针

- frontend/examples/golden/anti-examples.md「1. 页面直接调用 Service」：删除编排落在页面，换入口就要复制一遍。
- frontend/examples/golden/anti-examples.md「10. 页面承担 13 个函数」：页面堆叠函数，违反薄页面要求。
- frontend/examples/golden/anti-examples.md「11. Logic 层空转」：业务规则散落页面与组件，Logic 只做拼装。
- frontend/examples/golden/anti-examples.md「6. 受控组件自持一份状态」：筛选组件另存 state，与 URL 形成双写入点。
- frontend/examples/golden/anti-examples.md「3. 竞态保护形似而无实效」：signal 未下传、引用比较判新旧。

## 自检指针

- frontend/checklists/detailed-check.md「一、核心原则检查」：P1 页面薄层、P2 组件解耦、P4 单向数据流。
- frontend/checklists/detailed-check.md「二、架构层次检查」：Page/Hook/Logic/Service 各层条目。
- frontend/checklists/detailed-check.md「三、状态管理检查」：状态归属、单一来源、无 props 副本。
- frontend/checklists/detailed-check.md「十一、测试检查」：Logic 单测、互逆断言、边界与错误路径。
