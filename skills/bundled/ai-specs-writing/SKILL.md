---
name: ai-specs-writing
description: Bundled offline writing floor skill for AI-Specs covering business reports, articles, copywriting, serialized Chinese web novels, technical docs, and business correspondence with alignment gate and deterministic anti-AI-slop checks.
---
# ai-specs-writing（内包含兜底技能）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

## 执行步骤

1. **1+1 按需加载**：先读 `writing/README.md` 定位唯一主场景，仅加载 `writing/rules/core.md` 加 1 个场景文件（`report.md` / `article.md` / `copywriting.md` / `web-novel.md` / `documentation.md` / `correspondence.md`）。改稿场景追加读 `writing/examples/anti-ai-rewrites.md`。
2. **意图对齐门禁**：若用户仅给 1-3 句模糊想法且未说“直接写”，先停笔输出「2-3 句理解复述 + 2-3 个带选项的分歧点 + 1-2 条默认避开方向」，确认后再动笔；已给完整大纲或明确要求直接写时跳过。
3. **自检与脚本校验**：按 `writing/checklists/writing-check.md` 自检；长文或落盘稿件执行：

```bash
python3 scripts/check-writing.py <draft.md> --genre <report|article|copywriting|web-novel|documentation|correspondence|auto>
```
