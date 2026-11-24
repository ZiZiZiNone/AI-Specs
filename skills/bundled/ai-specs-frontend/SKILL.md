---
name: ai-specs-frontend
description: Bundled offline floor skill for frontend architecture, UI/UX quality, Vue 3, React 19, and WeChat Miniprogram engineering grounded in AI-Specs frontend rules.
---
# ai-specs-frontend（内包含前端与界面兜底技能）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 执行步骤

1. **按需进入前端子树**：读 `frontend/README.md` 与 `frontend/rules/core-principles.md`（落实 `FE-101` 至 `FE-104` 薄层与解耦原则）。
2. **匹配技术栈**：按项目依赖仅读对应框架入口（`frontend/frameworks/vue3/README.md`、`frontend/frameworks/react/README.md` 或 `frontend/frameworks/miniprogram/README.md`）。
3. **视觉与可用性基线**：涉及页面与组件设计时，联动核对 `frontend/rules/accessibility.md`、`frontend/rules/performance.md` 与 `frontend/rules/security.md`，拒绝无层次的通用模板卡片堆砌。
4. **交付前门禁**：按 `frontend/checklists/detailed-check.md` 做适用性自检，并对业务源码运行 `scripts/check-import-path.py` 与 `scripts/check-security-hygiene.py`。
