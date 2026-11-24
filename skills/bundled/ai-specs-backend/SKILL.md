---
name: ai-specs-backend
description: Bundled offline floor skill for multi-language backend engineering (Go, PHP, Python, TypeScript, Java, Rust), architecture patterns, concurrency, security, and testing grounded in AI-Specs backend rules.
---
# ai-specs-backend（内包含后端工程兜底技能）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 执行步骤

1. **锁定核心红线**：读 `backend/README.md` 与 `backend/rules/core-principles.md`（落实 `BE-101` 至 `BE-108`）。
2. **按语言单点加载**：按项目技术栈仅进 1 个语言目录（`backend/go/README.md`、`backend/php/README.md`、`backend/python/README.md`、`backend/typescript/README.md`、`backend/java/README.md`、`backend/rust/README.md`）。
3. **按模式取用**：遇鉴权、并发锁、缓存、韧性、在线 DDL 或异步 Outbox 时，按需读 `backend/patterns/` 对应文档与 `backend/protocol/decision-trees.md`。
4. **交付前门禁**：过 `backend/checklists/detailed-check.md` 并执行 `scripts/check-security-hygiene.py` 与对应语言测试套件。
