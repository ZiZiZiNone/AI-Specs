# 万能工具库

对齐关系见 `frontend/rules/core-principles.md`「FE-103 逻辑完全解耦原则」，本文件讲复用抽象时机，不为未来预造抽象。

## 定义

无主题公共桶不断堆函数、职责混杂相互依赖即为万能工具库。

## 判定信号

### 可观测信号（引用 `frontend/rules/core-principles.md` 原文数字，保持全库一致）

- 全库统一阈值：页面 300 行 / 函数 3 个 / 状态 5 个；组件 300 行 / props 8 个；Hook 150 行 / 成员 10 个；“禁止以搬运换达标”。

- Logic 按业务领域拆分不按页面拆分，一个文件只负责一个业务实体或用例。

- Hook“单个 Hook：不超过 150 行”“对外暴露成员不超过 10 个”，超标先审视是否把工具函数堆进 Hook。

- Logic“必须可单独测试（不需要挂载组件）”，需挂载才能测的所谓工具即放错层。

- 特别禁止：“以搬运换达标”，把无关函数挪进 utils 使调用方达标属规避。

### 症状（命中 2 条即进入对策）

- 无主题的 utils 入口不断堆函数，谁都 import，改动波及全项目。

- 同一份重复出现第二次即被抽象，抽象后调用方反而更复杂。

- 为“未来可能”预造抽象：`common/rules/reusability.md` 原文“不为未来可能预造抽象”，无第二个消费者即建通用层。

- 工具函数依赖框架 Hook 或 UI 组件，脱离组件即无法运行。

## 对策（拆到哪层，四选一写明）

- UI 渲染重复 → 组件：放 `src/components/`，判据见 `frontend/protocol/decision-trees.md`“复用抽象决策”。

- 需框架能力 → Hook：放 `src/hooks/`，内部调用 Logic，不直接写业务判断。

- 纯业务规则 → Logic：放 `src/logic/`，按领域命名，输入输出经类型严格定义。

- 接口语义重复 → Service：放 `src/services/`，收敛超时重试与错误归一。

- 候选并列（交用户定）：A. 第二处重复即抽象；B. 等第三处或共性明确再抽象。成本不同，选用由用户定。

## 正例指针

- `frontend/examples/golden/list-page.md`「2. 改筛选必回第一页」：纯逻辑框架无关，输入输出普通数据，可直接单测。

- `frontend/examples/golden/form-validation.md`「1. 规则定义在 Logic」：校验规则按字段归属 Logic，不在组件内。

- `frontend/examples/golden/list-page.md`「6. 页面只做组装」：行权限判定下沉 Logic，组件只消费结果。

## 反例指针（`frontend/examples/golden/anti-examples.md`，标题原文引用，不编新条号）

- 「11. Logic 层空转」：规则散落页面组件，Logic 只做参数拼装。

- 「4. 每个接口重复 try-catch」：10 个函数各写一遍超时与捕获。

- 「7. 校验层放弃类型」：validator 用 any 致字段写错不被发现。

## 自检指针（`frontend/checklists/detailed-check.md`，用小节名）

- “万能工具库”：无无主题入口、函数按职责分类、新函数先定归属三项。

- “消费者”：每处抽象都指得出具体消费点，无为想象未来加的抽象与开关。

- “万能 Hook”：确认 Hook 未混入可脱离框架的纯计算，未成新堆积处。

- “测试覆盖”：Logic 与工具函数有单测，命名描述行为。

## 决策指针（`frontend/protocol/decision-trees.md`，指针短语）

- “复用抽象决策”：第 1 处直接实现，第 2 处起看是否完全一致且更简单。

- “Hook vs Logic 决策”：是否需要框架能力是分水岭，不需要即纯 Logic。
