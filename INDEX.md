# 规范索引

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

确定性检索入口。引用一律编号 + 文件路径 + 原文逐字摘录，可被 `grep -F` 命中，见 COM-011 `common/rules/constitution.md`「编号 + 文件路径 + 原文逐字摘录」。

## 编号定义源

- COM-007 至 COM-012：`common/rules/constitution.md`（宪法）
- FE-000 至 FE-005：`AGENTS.md`（行为规则）
- FE-101 至 FE-104：`frontend/rules/core-principles.md`（`## FE-101` 至 `## FE-104`）

## 按需查阅

- 薄入口与量化：FE-101 `frontend/rules/core-principles.md`「FE-101 页面薄层原则」
- 组件解耦与调用边界：FE-102 `frontend/rules/core-principles.md`「FE-102 组件完全解耦原则」
- 逻辑解耦：FE-103 `frontend/rules/core-principles.md`「FE-103 逻辑完全解耦原则」
- 单向数据流：FE-104 `frontend/rules/core-principles.md`「FE-104 单向数据流原则」
- 架构分层：`frontend/rules/architecture.md`「规则」
- 状态归属：`frontend/rules/store.md`「状态归属决策」
- 接口契约：`common/rules/api-contract.md`「响应信封」
- 引用可验伪：COM-011 `common/rules/constitution.md`「编号 + 文件路径 + 原文逐字摘录」
- 授权面：COM-012 `common/rules/constitution.md`「每个任务都有授权面」
- 事务边界与迁移：Go 见 `backend/go/transaction.md`「规则」；PHP 见 `backend/php/transaction.md`「规则」
- 分层、事务、重试与复用决策：`backend/protocol/decision-trees.md`（按章取用）
- 后端标准模式：`backend/patterns/`（列表查询、创建幂等、多表写事务）
- 后端反模式：`backend/anti-patterns/`（胖控制器、全局数据访问、万能服务、仓储越界）
- 后端示例：`backend/examples/golden/service-slice.md` 与 `backend/examples/golden/anti-examples.md`

## 知识库结论

轻量确定性索引 Go，向量语义库 No-Go。检索实测 10 问：`grep -F` 10/10 命中，纯编号索引 5/10 命中。向量库不得作为引用源，最多作召回辅助且须经 `grep -F` 复核。
