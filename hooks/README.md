# AI-Specs 通用低 Token Hooks 适配器（v3.0）

路径基准：本文所有裸路径相对规范库根 `<SPEC_ROOT>` 解析。见 `<SPEC_ROOT>/README.md`「路径基准」。

零第三方依赖的跨宿主（Claude Code / Cursor / Windsurf / 通用 Agent CLI）确定性门禁适配器，直接复用 `scripts/check-*.py` 校验内核。

## 核心设计特性
1. **三级按需激活**：宿主 `matcher` 粗过滤（不拦截 Read/Grep）→ 按扩展名短路（非源码 0ms 放行）→ 按技术栈仅注入 1 行路径指针（< 40 Tokens）。
2. **放行零 Token（Zero-Token Pass）**：`PreToolUse` / `PostToolUse` / `Stop` 放行时 `stdout`/`stderr` 严格输出 0 字节。
3. **紧凑单行纠偏 + Top-3 截断**：阻断（`exit 2`）时每条报错压缩在 1 行内（`[BLOCK <RULE>] <file>:<line> <原因> -> <改法>`），最多输出 3 条。
4. **内容哈希缓存 + 3 次熔断**：同文件内容不重复扫描；同文件同规则连续阻断 ≥ 3 次自动熔断转交人工，防止烧干 Token。
5. **外置会话状态机**：授权面（`READ_ONLY`/`WRITE`）、脏文件清单与测试水位线存入系统临时目录，绝不污染业务仓库。

## 目录结构
- `hooks/adapter.py`：统一跨宿主入口（自动适配 Claude Code / Cursor / Windsurf / 通用 JSON）
- `hooks/session_state.py`：临时会话状态机（授权面、脏文件、测试水位线、哈希缓存、熔断计数与遥测日志）
- `hooks/settings.example.json`：可直接合并进 `.claude/settings.json` 的声明式配置模板
- `hooks/test_hooks.py`：全生命周期自动化单元测试（`python3 hooks/test_hooks.py`）

## 按需写作门禁（编码任务 0 Token）

- `UserPromptSubmit` 自动识别 6 大写作场景，仅注入 1 行 `writing=...|load=writing/rules/core.md,<genre>.md` 路由指针；普通编程任务 0 字节输出。
- `PostToolUse` / `Stop` 在写作模式下懒加载 `scripts/check-writing.py`，硬拦截 AI 味套话、网文烂梗词库、视角过滤词过密与句长均质化；网文/文章/文案模式自动免受工程 `COM-019` 误伤。
