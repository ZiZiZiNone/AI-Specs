# 建议 Skill 库（独立兜底与按需获取指引）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

本目录为独立模块，用于提供**跨领域建议 Skill 注册表与离线兜底能力**。它不抢占用户显式指定的个人 Skill，也不在普通编码任务中常驻占用上下文 Token。

## AI 按需阅读与获取指令（必读协议）

当 AI 阅读规范库并处理具体任务时，严格按以下四步执行：

1. **先判是否跳过**：若用户已显式指定个人 Skill（如输入 `/skill-name` 或明确指明要用的技能），**直接执行用户 Skill，跳过本目录（0 干扰）**。
2. **按需检索单领域**：若未调用用户 Skill，仅读取 `skills/registry.json` 中与当前任务匹配的 **1 个领域条目**，禁止一次性读取全部 Skill 正文。
3. **按来源协议获取 Skill**：
   - **`local`（本地已装）**：优先按 `registry.json` 中的 `local_search_dirs`（如 `~/.agents/skills/<id>/SKILL.md`、`.claude/skills/<id>/SKILL.md`、`.cursor/skills/<id>/SKILL.md` 或宿主原生技能检索工具）探测；命中则直接引导调用。
   - **`bundled`（内包含直用）**：直接读取 `<SPEC_ROOT>/skills/bundled/<id>/SKILL.md`，离线零依赖，作为质量下限兜底。
   - **`remote`（远程生态）**：向用户展示该条目中的精确安装命令（如 `npx skills add <repo>`）引导安装；若用户拒绝、离线或长时间未授权，**立即回退读取同领域的 `fallback_bundled`**，绝不让任务卡死。
4. **单/多匹配决策铁律**：
   - **单匹配**：直接启用（命中 `local` 或 `bundled` 直接读入执行；命中未装 `remote` 时，先按 `fallback_bundled` 保底完成任务，并在回复末尾附 1 行可选安装升级命令）。
   - **多匹配**：向用户列出 Top 2–3 个差异化候选，标明 `★ 默认最优`；若用户长时间未选择、未授权安装或直接要求继续，自动按 `default_optimal` 执行（若 `default_optimal` 为未装远程包，无缝降级为 `fallback_bundled`）。

## 仓库内包含兜底 Skill（`bundled`，离线直用）

所有内包含 Skill 均采用薄壳路由设计，直接复用本规范库既有真相源，零重复维护：

| Skill ID | 入口文件 | 兜底覆盖范围 |
| :--- | :--- | :--- |
| `ai-specs-writing` | `skills/bundled/ai-specs-writing/SKILL.md` | 六大写作场景 + 连载网文 + 意图对齐门禁 + `scripts/check-writing.py` 校验 |
| `ai-specs-dialogue-scene` | `skills/bundled/ai-specs-dialogue-scene/SKILL.md` | 台词潜台词/动作性/遮名测试 + 感官描写/零过滤词离线兜底 |
| `ai-specs-frontend` | `skills/bundled/ai-specs-frontend/SKILL.md` | 前端 UI/UX 审美基线 + Vue 3 / React / 小程序规范与自检清单 |
| `ai-specs-backend` | `skills/bundled/ai-specs-backend/SKILL.md` | 后端 6 语言（Go/PHP/Python/TS/Java/Rust）工程规范、模式与安全底线 |
| `ai-specs-engineering` | `skills/bundled/ai-specs-engineering/SKILL.md` | 通用工程宪法、代码审查、任务边界与自动化门禁兜底 |

## 完整注册表与自动化校验

- 完整领域路由与 32 个精选远程/本地/内包含 Skill 注册表见：`skills/registry.json`
- 会话级记忆与多域复合匹配：同一会话中回复“选 `<skill-id>`”或“按默认”后将自动锁定该领域技能（不再重复弹窗）；回复“重选 skill”可清除锁定；单句跨多领域时最多同时输出 3 个匹配域的路由指针
- 结构与路径一致性校验脚本见：`scripts/check-skills.py`（默认离线极速校验，已集成进 `scripts/check-all.py`；传 `--online` 可按需联网探活全部远程 Skill 链接）
