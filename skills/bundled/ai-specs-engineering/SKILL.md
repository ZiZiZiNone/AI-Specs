---
name: ai-specs-engineering
description: Bundled offline floor skill for general software engineering governance, read-only code review, requirement completeness analysis, and final verification gates in AI-Specs.
---
# ai-specs-engineering（内包含通用工程与审查兜底技能）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 执行步骤

1. **必读四件基线**：确认已遵守 `common/rules/constitution.md`（`COM-007` 至 `COM-019`）、`common/principles.md` 与 `common/protocol/task-boundary.md`。
2. **需求与只读边界**：需求模糊时按 `common/protocol/requirement-completeness.md` 一次提清阻塞项；代码审查与诊断任务严格保持只读（`COM-012`）。
3. **验收总门禁**：变更交付前过 `common/protocol/final-gate.md`，并实际运行对应测试或 `scripts/check-all.py`。
