# 规范缺口报告

> **时点快照（2026-09-01 落地当时），第三节所述缺口已于同日补全，现已失效。**
> 本报告保留为改进过程的记录，**不代表当前规范状态**。
> 已补：`frameworks/vue3/`（reactivity / composable / component / `ui/arco/`）、`rules/style.md`、
> `examples/golden/` 四个示例、Hook 层量化标准。落实明细见第五节。
> 按 C5：引用本报告任何结论前须复验当前文件；与当前文件冲突时以当前文件为准。
> 失效条件：规范补全后作废——**已触发**。

一次完整 Feature 落地（Vue 3 + Tailwind + Arco，工单管理三视图）后，对本工作区
规范的实测反馈。按「是否可遵守 / 结构是否变好 / 是否完整」三问组织，每条附本次
遇到的具体证据与建议。结论先行（**均为 2026-09-01 补全前的状态**）：

- 可遵守性：高。分层与状态归属的强约束确实产生了可测、可读的结构。
- 结构收益：明确为正。但部分收益是「指标合规」而非「复杂度下降」。
- 完整性：有真实缺口。Vue 侧规范近乎空白，样式体系完全缺失，示例全是占位。（**已补全**）

---

## 一、能否较好遵守

**能，且约束是有效的。** 最有价值的三条：

1. **状态归属决策树第 3 条（需要刷新后保持 → URL 参数）**。这条把「筛选条件放哪」从
   一个见仁见智的选择变成了确定答案。`useTicketQuery` 因此不再持有任何 ref，URL 成为
   唯一来源，天然消除了两份状态不同步的经典 bug。这是全套规范里性价比最高的一条。

2. **P2 组件调用 Service 的边界（禁止业务数据 / 允许自身交互）**。判定原则「这个调用
   是为了完成组件自身交互，还是加载页面业务数据」在实践中一次就能判对：`AssigneeSelect`
   与 `AttachmentUpload` 直连 Service 合规，`TicketTable` 绝不能自己拉数据。

3. **实现顺序 Pattern→State→Logic→Service→UI**。先定 Logic 再写 UI，使得组件模板里
   几乎没有条件表达式——所有判断都已经在 Logic 里有名字（`resolveTicketRowAbility`、
   `resolveToggleTarget`）。

**遵守成本较高的地方：**

- **页面内函数不超过 3 个**是本次唯一需要为「达标」而重构的指标。我第一版列表页有 4 个
  handler，为满足指标抽出了 `useTicketRowOperations`。抽完确实更好，但动机是数字而非
  代码异味——规范应说明该指标的意图是「页面不承载编排」，而不是单纯计数。

## 二、开发后结构是否更完美

**是，但要分清两类收益。**

真实收益：Logic 层可脱离 Vue 单测（8 个 spec 全是纯函数调用，无需挂载组件），这直接
来自 P3。Service 单点 `httpClient` 使超时/重试/取消/错误归一各只有一份实现。

**指标合规但复杂度只是转移**：页面从 4 个函数降到 1 个，代价是新增 3 个 Hook 文件。
规范对 Page 有量化约束，对 Hook 层没有任何约束——没有行数上限、没有函数数量上限、
没有「一个 Hook 该不该同时管弹窗开关和异步校验」的判据。`useTicketFormModal` 138 行、
同时负责打开关闭、编辑回填、编号唯一性校验、提交反馈四件事，它不违反任何一条现有规范。

**建议 1（优先级最高）**：为 Hook 层补量化标准与拆分判据，否则「页面瘦身」会系统性地
把复杂度堆到不受审查的 Hook 里。

## 三、是否无错、无漏、相对完整

存在以下真实缺口，按影响排序：

### 缺口 A：Vue 3 规范近乎空白（阻塞级）
`frameworks/vue3/` 只有 `state.md` 一个文件，README 自列三项待补。本次全靠通用 rules
推导，以下决策**无规范可依**，全部由我自行判断：

- `ref` / `shallowRef` / `reactive` 的选择依据（我按「列表用 shallowRef 避免深层代理开销、
  表单值用 reactive 便于按字段写入」处理）
- `watch` 的 `immediate` / `deep` / `flush` 使用边界
- composable 返回值形态：返回 ref 集合还是返回 reactive 对象（这个选择直接影响调用方
  写不写 `.value`，本次我在 `viewModel` 上先写成 `reactive` 后改回 `computed`，就是因为
  没有规范可依而反复）
- `Readonly<Ref<T>>` vs `Ref<T>` 在 composable 入参上的约定
- props 可选性用 `?:` 还是 `| null`（与清单第九条直接冲突，见 CONFORMANCE.md 偏离 2）

**建议 2**：补 `frameworks/vue3/composable.md`（返回值形态、入参 Ref 约定、生命周期与
清理）与 `frameworks/vue3/reactivity.md`（ref/reactive/shallowRef 选择树、watch 边界）。

### 缺口 B：组件库规范完全缺失（阻塞级）
`frameworks/vue3/ui/` 明确写「现有目录：暂无」。而 README 工作流第 1 步要求「涉及组件库
再进入 ui/<组件库>/ 读取」——本次需求指定 Arco，该目录不存在，于是「受控/非受控、
Form/Table 用法边界」全无依据。实际影响：

- Arco `a-form` 自带 `rules` 校验能力，与本规范「校验规则必须在 Logic」直接冲突。
  我的处理是完全弃用 Arco 的 rules，只用 `validate-status` / `help` 展示 Logic 的结果。
  **这个取舍应当由规范给出，而不是每次由执行者临时决定。**
- Arco `a-table` 的 `sortable` 是组件内部状态，与「排序状态集中在 Logic」存在张力。
- `Modal.confirm` 是命令式 API，与「组件无隐藏副作用」的张力需要说明（我把它收进
  `useTicketConfirm`，让页面只声明「确认后做什么」）。

**建议 3**：补 `frameworks/vue3/ui/arco/README.md`，至少明确三件事：组件库自带校验
与 Logic 校验的取舍、Table 内部状态与 Logic 状态的边界、命令式 API（Message/Modal）
的调用位置。

### 缺口 C：没有任何样式与 Tailwind 规范（高）
全套规范 46 个文件中，样式相关只有 `rules/ui-rule.md` 一句「样式与展示关注点不泄漏
业务逻辑」。本次用 Tailwind，以下全无依据：

- Tailwind 与组件库主题变量如何共存（我用 `corePlugins.preflight: false` 关掉 Tailwind
  重置以免覆盖 Arco 基础样式，并用 `var(--color-text-1)` 等 Arco token 而非 Tailwind
  调色板，以免出现两套颜色体系——这是个有后果的决定，却没有规范背书）
- 原子类堆叠到什么长度该抽 `@apply` 或组件
- 响应式断点、间距节奏是否需要统一

**建议 4**：补 `rules/style.md`（样式归属、设计 token 单一来源、原子类抽取时机），
以及组件库与工具类框架共存的配置约定。
（落实说明：最终未新建 `frameworks/vue3/ui/tailwind.md`，共存配置并入
`rules/style.md` 与 `frameworks/vue3/ui/arco/README.md`，见第五节落实表。）

### 缺口 D：所有正/反示例都是空占位（高）
`core-principles.md` 有 8 处 ````typescript // ✅ …```` 空代码块，`form-validation.md`
有 9 处「（待补充）」，`examples/golden/` 只有规则没有示例。而 `examples/golden/README.md`
又规定「示例必须来自真实项目，禁止编造理想化示例」——这形成死锁：没有真实项目就永远
不能填示例，占位就永远存在。
（现状：上述占位已全部填实，本段保留为问题记录。审校另发现
`async-operations.md` 5 处、`ui-states.md` 3 处、`error-handling.md` 3 处同类占位，
亦已一并填实。）

**建议 5**：把本次 `test/vue` 产物（或其中经审阅的片段）作为首批 golden example 来源，
并在 README 中把「真实项目」放宽为「已通过本规范自检并可运行的代码」。

### 缺口 E：Service 层规范与统一 httpClient 的表述冲突（中）
`rules/async-operations.md` 与清单五都要求「所有 Service 方法必须 try-catch」。但正确的
工程实现是 try-catch 收敛到唯一的 `httpClient`，业务 service 只有一行转发、无需也不该
再套 try-catch。按字面执行会产出 11 个冗余 try-catch。

**建议 6**：改为「Service 层必须保证不向上抛异常，统一在请求出口（如 httpClient）
try-catch，业务方法不重复包裹」。

### 缺口 F：非幂等写操作的重试规范缺失（中）
`rules/async-operations.md` 只说「临时性错误自动重试（最多 3 次，指数退避）」，未区分
幂等性。若按字面对 `POST /api/tickets` 重试，网络抖动会造成重复创建工单——这是数据
正确性问题，不是体验问题。我的实现里 GET 默认重试、写操作显式关闭。

**建议 7**：在重试规则中增加「仅幂等请求（GET/PUT/DELETE）可自动重试；POST 等非幂等
操作禁止自动重试，或要求配合幂等键」。

### 缺口 G：乐观更新缺少回滚快照要求（中）
`rules/ui-states.md` 说「失败：回滚 UI + error 提示」，但未规定快照时机。实现时若在失败
分支反推原值，并发操作下会回滚成错误值。正确做法是写入前取快照。

**建议 8**：补一句「乐观更新必须在写入前保存快照，失败时按快照回滚，禁止失败时反推原值」。

### 缺口 H：五态与「刷新保留旧数据」存在未说明的张力（低）
`ui-states.md` 规定禁止 `loading → idle`、`error → success` 直接转换，同时又要求「刷新
失败保留旧数据 + Toast」。后者意味着状态停留在 `success` 而错误信息单独存放——即错误
不总是对应 `error` 态。规范未明确这种「success + errorMessage」组合是否合法。

**建议 9**：明确区分「整体态」与「操作反馈」，说明刷新/翻页失败时保持 success 并单独
承载错误提示是符合规范的。

### 缺口 I：AGENTS.md 的 B3 与验证要求存在张力（低）
B3 禁止逐文件格式化、要求「首次写对」，`protocol/final-gate.md` 又要求「产物可运行/
可打开」。当环境无法执行构建时（本次即是），两者都无法自证。规范未说明「无法验证」时
的处理方式。

**建议 10**：在 final-gate 增加一条：无法执行验证时，必须显式列出未验证项与复现命令，
不得默认视为通过。

---

## 四、其他自检建议

**建议 11：清单需要区分「必过项」与「视场景项」。** `detailed-check.md` 共 14 类约 190 项，
本次有相当比例不适用（虚拟滚动、图片懒加载、节流、长轮询）。逐项走一遍成本很高且会
稀释注意力。建议给每项标注适用条件，或提供「本次任务命中哪些类」的筛选入口。

**建议 12：量化指标应写明意图。** 「函数不超过 3 个」「props 不超过 8 个」这类硬指标，
建议每条补一句「该指标想防止什么」。否则容易出现本次这种为达标而搬运复杂度的行为，
指标绿了而问题未解决。

**建议 13：补「聚合对象是否计为 1 个 prop」的判定。** 决策树给了「合并相关 props」的
出路，但没说合并后如何计数，容易被用来规避 props 上限。

**建议 14：为 mock / 假数据补规范。** 本次为跑通链路写了内存假后端（约 460 行，含故障
注入）。宪法 C1 禁止编造事实与数字，我的处理是在 README 与代码注释里显式声明「假数据、
不代表真实业务数值」。规范应明确：允许为可运行性构造 mock，但必须标注且不得混入交付
文档的结论中。

---

## 五、落实情况

以上缺口与建议已全部并入规范。对应关系：

| 缺口/建议 | 落实位置 |
|---|---|
| A Vue 3 规范空白 | frameworks/vue3/：README、reactivity.md、composable.md、component.md |
| B 组件库规范缺失 | frameworks/vue3/ui/README.md、frameworks/vue3/ui/arco/README.md |
| C 样式与 Tailwind 规范 | rules/style.md（新建） |
| D 示例全是占位 | examples/golden/：list-page、form-validation、service-layer、anti-examples；README 放宽素材来源以解开死锁 |
| E Service 与统一出口表述冲突 | rules/async-operations.md「try-catch 收敛」章节重写 |
| F 非幂等重试缺失 | rules/async-operations.md「幂等性前置判断」（新增决策树） |
| G 乐观更新回滚快照 | rules/ui-states.md（要求写入前取快照，附正反例） |
| H 五态与刷新保留数据的张力 | rules/ui-states.md「整体态与操作反馈的区分」（新增） |
| I B3 与验证要求的张力 | protocol/final-gate.md 重写，新增「无法验证时的处理」与声明模板 |
| 10 Hook 层无量化约束 | rules/core-principles.md「Hook 文件」量化标准 + protocol/decision-trees.md「Hook 拆分决策」 |
| 11 清单需区分必过/视场景 | checklists/detailed-check.md「适用性判定」（新增章节，三态结论） |
| 12 量化指标应写明意图 | rules/core-principles.md「指标的意图」（禁止以搬运换达标） |
| 13 聚合 props 计数 | protocol/decision-trees.md「props 计数规则」（三条件） |
| 14 mock / 假数据规范 | rules/test.md「Mock 与假数据」（新增） |
| 审校补发现：error-handling.md 仍写「所有请求必须 try-catch」，与缺口 E 的修订冲突 | rules/error-handling.md Service 层规则与检查清单已改为「收敛在统一请求出口」 |
| 审校补发现：typescript.md 缺少被 component.md 引用的 `Type \| null` 条款 | rules/typescript.md 新增「可空的表达」与「规则表类型化」章节 |

React 侧的 12 条违规实证已并入 examples/golden/anti-examples.md，
并在 frameworks/README.md 记录为 react/ 目录的待补依据。

**遗留**：本项目的 `npm install` / `npm run typecheck` / `npm run test` 因沙箱不可用
从未执行（详见 CONFORMANCE.md）。规范层面的修订不解决这一项，须在本机运行验证。
