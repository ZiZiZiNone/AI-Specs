# 规范索引

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

确定性检索入口。引用一律「编号 + 文件路径 + 原文逐字摘录」，可被 `grep -F` 命中，见 COM-011 `common/rules/constitution.md`「编号 + 文件路径 + 原文逐字摘录」。

## 编号定义源

本库全部条款级编号仅由以下四处唯一定义（与 `AGENTS.md`、`common/rules/constitution.md`、`scripts/check-citations.py` 严格一致）：

- `COM-007` 至 `COM-019`：`common/rules/constitution.md`（宪法；`COM-001` 至 `COM-006` 为历史预留号，不启用）
- `FE-000` 至 `FE-005`：`AGENTS.md`（AI 行为规则）
- `FE-101` 至 `FE-104`：`frontend/rules/core-principles.md`（`## FE-101` 至 `## FE-104` 前端核心原则）
- `BE-101` 至 `BE-108`：`backend/rules/core-principles.md`（`## BE-101` 至 `## BE-108` 后端核心原则）

## 按需查阅

### 通用规范（`common/`）
- 引用可验伪：COM-011 `common/rules/constitution.md`「编号 + 文件路径 + 原文逐字摘录」
- 授权面与任务边界：COM-012 `common/protocol/task-boundary.md`「授权面」
- 安全红线与防幻觉：COM-013 / COM-014 / COM-015 `common/rules/constitution.md`、`common/rules/security.md`、`common/rules/ai-safety.md`
- 可观测性与日志脱敏：COM-017 `common/rules/observability.md`
- 向后兼容与数据演进：COM-016 `common/rules/compatibility.md`
- 接口契约与分页幂等：`common/rules/api-contract.md`「响应信封」
- 需求完整度分级：`common/protocol/requirement-completeness.md`「阻塞项与非阻塞项判定」
- 用户沟通结论化与去技术化：COM-019 `common/rules/communication.md`
- 交付总门禁：`common/protocol/final-gate.md`

### 前端规范（`frontend/`）
- 薄入口与量化：FE-101 `frontend/rules/core-principles.md`「FE-101 页面薄层原则」
- 组件解耦与调用边界：FE-102 `frontend/rules/core-principles.md`「FE-102 组件完全解耦原则」
- 逻辑解耦：FE-103 `frontend/rules/core-principles.md`「FE-103 逻辑完全解耦原则」
- 单向数据流：FE-104 `frontend/rules/core-principles.md`「FE-104 单向数据流原则」
- 架构分层与状态归属：`frontend/rules/architecture.md`「规则」、`frontend/rules/store.md`「状态归属决策」
- 前端安全、无障碍、性能、精度：`frontend/rules/security.md`、`frontend/rules/accessibility.md`、`frontend/rules/performance.md`、`frontend/rules/i18n-precision.md`
- 前端框架与可运行参考测试：`frontend/frameworks/vue3/`、`frontend/frameworks/react/`、`frontend/frameworks/miniprogram/`

### 后端规范（`backend/`）
- 后端核心红线：BE-101 至 BE-108 `backend/rules/core-principles.md`
- 事务边界与迁移：Go 见 `backend/go/transaction.md`「规则」；PHP 见 `backend/php/transaction.md`「规则」；在线 DDL 见 `backend/patterns/migration-online-ddl.md`
- 认证与鉴权防越权：`backend/patterns/authz-security.md`
- 并发锁、缓存、韧性、可观测、异步 Outbox：`backend/patterns/concurrency-locking.md`、`backend/patterns/caching.md`、`backend/patterns/resilience.md`、`backend/patterns/observability.md`、`backend/patterns/outbox-async.md`
- 分层、事务、重试与复用决策：`backend/protocol/decision-trees.md`（按章取用）
- 后端标准模式与反模式：`backend/patterns/`、`backend/anti-patterns/`
- 后端六大语言子树与可运行测试：`backend/go/`、`backend/php/`、`backend/python/`、`backend/typescript/`、`backend/java/`、`backend/rust/`

### 写作规范（`writing/`，按需 1+1 加载）
- 写作总入口与场景路由：`writing/README.md`
- 通用去 AI 味与简明底线：`writing/rules/core.md`
- 六大场景规范：`writing/rules/report.md`、`writing/rules/article.md`、`writing/rules/copywriting.md`、`writing/rules/web-novel.md`、`writing/rules/documentation.md`、`writing/rules/correspondence.md`
- 自检清单与正反例对照：`writing/checklists/writing-check.md`、`writing/examples/anti-ai-rewrites.md`

### 自动化门禁（`scripts/`）
- 全量一键门禁：`scripts/check-all.py`
- 引用验伪：`scripts/check-citations.py`
- 结构一致性：`scripts/check-spec-integrity.py`
- 安全基线扫描：`scripts/check-security-hygiene.py`
- 导入路径校验：`scripts/check-import-path.py`
- 写作与网文专属风格校验：`scripts/check-writing.py`

## 知识库结论

轻量确定性索引 Go，向量语义库 No-Go。检索实测 10 问：`grep -F` 10/10 命中，纯编号索引 5/10 命中。向量库不得作为引用源，最多作召回辅助且须经 `grep -F` 复核。

### 独立建议 Skill 库（`skills/`）
- 按需获取协议与三源兜底入口：`skills/README.md`「AI 按需阅读与获取指令（必读协议）」
- 跨领域 32+ 精选技能与默认最优路由表：`skills/registry.json`
- 内包含离线兜底技能：`skills/bundled/ai-specs-writing/SKILL.md`、`skills/bundled/ai-specs-dialogue-scene/SKILL.md`、`skills/bundled/ai-specs-frontend/SKILL.md`、`skills/bundled/ai-specs-backend/SKILL.md`、`skills/bundled/ai-specs-engineering/SKILL.md`
- 技能库结构与兜底校验：`scripts/check-skills.py`
