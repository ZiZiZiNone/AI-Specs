# 表格

定位：只管"纯展示型数据表格"这一种组件：收数据与列配置做渲染，排序/分页/选择/行操作一律回调上报。

本文件是 frontend/patterns/list-page.md 与 frontend/patterns/detail-page.md 中 Table 职责的唯一定义处，两页不再重复定义。

## 结构落点

表格是 frontend/rules/architecture.md 中的 Component："可复用 UI 单元，只负责展示与交互，不直接访问接口。"与其协作的各层：

- Page/Component（调用方）：组装表格，提供 rows、列配置与回调；"路由页面，负责组装组件与编排页面级状态，不承载业务逻辑。"
- Hook：持有列表数据与 UI 状态，消费表格上报的回调后触发加载或操作；"挂 UI 侧（供 Page/Component 使用），内部调用 Logic 完成业务；框架具体形态 Vue 3 见 frontend/frameworks/vue3/composable.md、小程序见 frontend/frameworks/miniprogram/logic.md。"
- Logic："业务规则、状态流转、副作用编排，可复用、可测试。"排序规则、行操作许可、可批量条件落在这里。
- Service："唯一访问后端接口的入口，负责请求与数据转换。"表格永远不直连它。

方向约束引自 frontend/rules/architecture.md："依赖只能向下：Page/Component→Hook→Logic→Service；禁止反向依赖。"同时"允许跨层直连（如 Page/Component 直接调 Logic，Hook 直接调 Service），同层组合（组件嵌套、Hook 组合）不受限，禁止任何向上/反向依赖。"表格作为同层可嵌套（如单元格内嵌基础控件），但不得反向调用上层。

与 frontend/patterns/list-page.md 的分工一致：列表页的 Table 只负责渲染数据与事件回调，取数与状态归取数 Hook。

调用边界引自 frontend/protocol/decision-trees.md："界线在于：**Hook 里不写业务判断**。谁能删、什么状态可改、删完去哪一页，这些一律下沉 Logic；Hook 只负责调用顺序、UI 状态与错误分流。"表格上报的回调正是由 Hook 接住、交 Logic 判定后再回写的对象。

## 状态归属

按 frontend/protocol/decision-trees.md 状态归属与组件自持状态决策划分：

- 表格在黑名单内：组件自持状态决策的黑名单含"Table / DataGrid"，即表格不允许自持业务状态。
- 行数据、分页、排序、选中：由父级（Hook 或页面）经 props 传入，表格为全受控。
- 唯一可自持的是纯 UI 交互细节（如列宽拖拽中的临时值），且不得影响数据语义。
- 排序/分页/选择变化只上报事件，是否生效、如何回页由 Logic 判定（如改筛选回第一页类规则）。

对照同一决策的白名单（Input / Textarea、Select / Autocomplete、Checkbox / Radio / Switch 等基础表单控件允许自持 UI 交互状态），表格属业务展示组件，不在自持之列。模块间通信只走明确接口，frontend/rules/architecture.md："高内聚低耦合：同一职责不分散到多处；模块间只通过明确接口（props / Service / Store）通信，不依赖内部实现。"

props 规模按 frontend/protocol/decision-trees.md 组件拆分决策执行："问：props 是否超过 8 个？"超限即审视职责拆分；聚合对象计 1 个须满足同文件三条件，禁止为规避上限拼盘。

## 五态与错误

表格自身不持有五态，五态由父级容器（如 DataLoader）统一承担：

- loading：首次加载由容器渲染骨架；frontend/rules/ui-states.md："首次加载：使用 Skeleton 替代 loading 图标"。frontend/rules/ui-states.md："分页：表格底部 loading"，即翻页时表格保留旧行，仅底部显示小型 loading。
- empty：空集由容器渲染空态（说明加引导动作），表格不渲染"无数据"字样占位。空态文案按 frontend/rules/ui-states.md 执行："列表为空："暂无数据"或"还没有XXX""；"搜索无结果："未找到相关内容，试试其他关键词""。区分"本来没有"与"筛出来没有"：前者引导创建，后者引导清空筛选。
- error：首次失败由容器渲染错误占位加重试；翻页或行操作失败走 Toast 并保留表格旧数据。
- 整体态与操作反馈分离：行内操作失败只经操作反馈呈现，表格内容不得因一次失败整片消失。容器按 frontend/rules/ui-states.md 封装要求执行："仅 success 态渲染子组件"。

## 规则

- 表格接收数据与列配置，只做渲染；单元格渲染函数保持简单，复杂逻辑提取。
- 排序/分页/选择/行操作通过回调上报，由 Hook 与 Logic 处理，表格内不做业务判断。
- 不把数据请求写进表格组件；表格内无 import Service、无 fetch/axios。
- 不把权限判断写进表格组件；行上按钮的可见与禁用由 Logic 判据结果驱动。
- 表格不读路由、不读 Store、不持有分页/排序/选中等业务状态。
- 列配置变化只影响渲染，不触发取数；取数触发权在父级 Hook。
- 跨行汇总等派生计算落在 Logic，表格只消费经 props 传入的结果值。
- 操作列按钮的 loading/disabled 由父级传入，表格不自行推导行是否可操作。
- 乐观更新的行内变更由父级先取快照再写入，失败按快照回滚，不在表格内反推。

## 正例指针

- frontend/examples/golden/list-page.md「6. 页面只做组装」表格只收 rows 渲染：只渲染与回调，行能力由同一份判据结果驱动。
- frontend/examples/golden/list-page.md「6. 页面只做组装」同一份判据形态：resolveTicketRowAbility 一份判定，多处消费。
- frontend/examples/golden/list-page.md「6. 页面只做组装」容器形态：表格经 DataLoader 容器承载五态，页面不写 v-if 链。
- frontend/examples/golden/list-page.md「6. 页面只做组装」独立关注点形态：行操作编排的独立关注点。
- frontend/examples/golden/list-page.md「6. 页面只做组装」容器形态：五态统一容器。
- frontend/examples/golden/list-page.md「6. 页面只做组装」空态形态：空态说明加引导动作。
- frontend/examples/golden/list-page.md「6. 页面只做组装」交互测试形态：表格交互测试。
- frontend/examples/golden/list-page.md：DataLoader 容器承载五态、表格只收 rows 渲染（见页面组装部分）。

## 反例指针

- frontend/examples/golden/anti-examples.md「2. 展示型组件自己加载数据」：组件内部发请求，与接口绑定且页面无法感知错误态。
- frontend/examples/golden/anti-examples.md「1. 页面直接调用 Service」：含表格页在内的页面越层直连 Service。
- frontend/examples/golden/anti-examples.md「11. Logic 层空转」：行操作许可等规则散落组件而非下沉 Logic。
- frontend/examples/golden/anti-examples.md「6. 受控组件自持一份状态」：表格若另存 rows 副本展示，与父级数据源形成双写入点。

## 自检指针

- frontend/checklists/detailed-check.md「一、核心原则检查」：P2 组件解耦、P4 单向数据流。
- frontend/checklists/detailed-check.md「二、架构层次检查」：Component 层（职责单一、props 上限、行数上限、不直访接口）。
- frontend/checklists/detailed-check.md「三、状态管理检查」：受控组件无 props 副本、单一来源。
- frontend/checklists/detailed-check.md「十一、测试检查」：关键组件交互测试、命名描述行为。
