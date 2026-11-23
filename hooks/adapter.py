#!/usr/bin/env python3
"""AI-Specs 通用低 Token Hooks 适配器（跨 Claude Code / Cursor / Windsurf / CLI）。

退出码契约：
- 0：放行（除 SessionStart/UserPromptSubmit 极简路由指针外，严格 0 字节输出，零 Token 消耗）
- 2：硬阻断（stderr 输出紧凑单行纠偏提示，最多 Top-3 条，同错 >=3 次自动熔断）

用法：echo '<hook_json>' | python3 hooks/adapter.py [--event <EventName>]
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

HOOKS_DIR = Path(__file__).resolve().parent
SPEC_ROOT = HOOKS_DIR.parent
SCRIPTS_DIR = SPEC_ROOT / "scripts"
sys.path.insert(0, str(HOOKS_DIR))

import session_state as ss  # noqa: E402

MAX_RETRIES_BEFORE_BREAK = 3
MAX_ERRORS_PER_BLOCK = 3

FRONTEND_EXTS = (".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".vue")
SOURCE_EXTS = FRONTEND_EXTS + (".py", ".go", ".php", ".java", ".rs")
WRITING_EXTS = (".md", ".txt")
WRITE_TOOLS = {"write", "edit", "multiedit", "write_to_file", "replace_file_content", "create_file"}
READ_ONLY_KEYWORDS = ("review", "代码审查", "审计", "只读", "诊断", "答疑", "不要改代码")
WRITE_OVERRIDE_KEYWORDS = ("修复", "修改", "重构", "实现", "新增", "写代码", "升级")
DETAIL_REQUEST_KEYWORDS = ("展开", "详细", "过程", "原理", "怎么做的", "为什么", "源码", "代码", "命令", "日志", "细节")
WRITING_ROUTES: tuple[tuple[str, re.Pattern[str], str], ...] = (
    ("web-novel", re.compile(r"(?:写|创作|续写|改写|润色).{0,14}(?:小说|网文|章节|开篇)|网文|黄金三章|规则怪谈|无限流|小说大纲"), "writing/rules/web-novel.md"),
    ("copywriting", re.compile(r"宣传稿|营销文案|推广文案|品牌软文|种草文案|详情页文案|落地页文案|新闻通稿|发布稿|(?:写|起草|撰写|润色).{0,10}文案"), "writing/rules/copywriting.md"),
    ("report", re.compile(r"(?:写|起草|撰写|生成).{0,12}(?:报告|方案|复盘|总结|备忘录)|立项方案|调研报告|竞品分析"), "writing/rules/report.md"),
    ("article", re.compile(r"公众号|专栏文章|深度文章|行业评论|(?:写|撰写|润色).{0,14}(?:文章|长文|新闻稿)"), "writing/rules/article.md"),
    ("documentation", re.compile(r"操作手册|产品手册|使用文档|使用手册|帮助文档|知识库文档|操作指南|使用教程|(?:写|编写).{0,6}sop"), "writing/rules/documentation.md"),
    ("correspondence", re.compile(r"(?:写|起草|回复|拟定).{0,14}(?:邮件|通知|公告|致函|函件|纪要)|会议纪要|全员公告"), "writing/rules/correspondence.md"),
)

DANGEROUS_BASH = (
    re.compile(r"\brm\s+-(?:[a-z]*r[a-z]*f|[a-z]*f[a-z]*r)\s+(?:/|\.|~|\*)"),
    re.compile(r"\bgit\s+push\b.*(?:--force(?![-\w])|\s-f\b)"),
    re.compile(r"\bchmod\s+777\b"),
)
TEST_CMD_RE = re.compile(
    r"\b(?:pytest|unittest|go\s+test|php\s+test/|vitest|jest|node\s+--test|tsc\b|rustc\s+--test|cargo\s+test|mvn\s+test|gradle\s+test|check-all\.py|check-writing\.py)\b"
)
PROTECTED_PATH_RE = re.compile(r"(?:^|/)(?:\.env(?:\.local|\.prod)?|id_rsa|internal/dao/internal/)")


def load_script_module(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS_DIR / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def detect_writing_genre(prompt: str) -> tuple[str | None, str | None]:
    """按需识别写作场景；编码任务返回 (None, None) 确保 0 Token 消耗。"""
    p = prompt.lower()
    for genre, pattern, rule_path in WRITING_ROUTES:
        if pattern.search(p):
            return genre, rule_path
    return None, None


def normalize_payload(raw: dict[str, Any], cli_event: str | None) -> dict[str, Any]:
    tool_in = raw.get("tool_input") or raw.get("input") or {}
    if not isinstance(tool_in, dict):
        tool_in = {}
    file_path = (
        tool_in.get("file_path")
        or tool_in.get("filePath")
        or tool_in.get("path")
        or tool_in.get("TargetFile")
        or raw.get("file_path")
        or ""
    )
    command = tool_in.get("command") or tool_in.get("cmd") or ""
    return {
        "event": cli_event or raw.get("hook_event_name") or raw.get("event") or "",
        "session_id": str(raw.get("session_id") or raw.get("sessionId") or "default"),
        "cwd": str(raw.get("cwd") or os.getcwd()),
        "prompt": str(raw.get("prompt") or raw.get("user_prompt") or ""),
        "tool_name": str(raw.get("tool_name") or raw.get("tool") or "").lower(),
        "file_path": str(file_path),
        "command": str(command),
        "exit_code": raw.get("tool_exit_code", raw.get("exit_code", 0)),
        "assistant_reply": str(raw.get("last_assistant_message") or raw.get("assistant_message") or ""),
    }


def detect_stacks(cwd: str) -> list[str]:
    root = Path(cwd)
    stacks = []
    if (root / "go.mod").is_file():
        stacks.append("backend/go")
    if (root / "composer.json").is_file():
        stacks.append("backend/php")
    if (root / "pyproject.toml").is_file() or (root / "requirements.txt").is_file():
        stacks.append("backend/python")
    if (root / "Cargo.toml").is_file():
        stacks.append("backend/rust")
    if (root / "pom.xml").is_file() or (root / "build.gradle").is_file():
        stacks.append("backend/java")
    if (root / "package.json").is_file():
        pkg = (root / "package.json").read_text(encoding="utf-8", errors="ignore").lower()
        if "vue" in pkg:
            stacks.append("frontend/vue3")
        if "react" in pkg or "next" in pkg:
            stacks.append("frontend/react")
        if "miniprogram" in pkg:
            stacks.append("frontend/miniprogram")
        if "fastify" in pkg or "nestjs" in pkg or "express" in pkg:
            stacks.append("backend/typescript")
    return stacks


def handle_session_start(ctx: dict[str, Any]) -> tuple[int, str, str]:
    stacks = detect_stacks(ctx["cwd"])
    stack_str = ",".join(stacks) if stacks else "common-only"
    out = f"[AI-Specs] root={SPEC_ROOT} | stack={stack_str} | must_read=README.md,common/rules/constitution.md,common/principles.md,common/protocol/task-boundary.md | reply=COM-019(结论先行/白话/追问再展过程)"
    return 0, out, ""


def handle_user_prompt(ctx: dict[str, Any], state: dict[str, Any]) -> tuple[int, str, str]:
    p = ctx["prompt"].lower()
    is_ro = any(k in p for k in READ_ONLY_KEYWORDS) and not any(k in p for k in WRITE_OVERRIDE_KEYWORDS)
    state["mode"] = "READ_ONLY" if is_ro else "WRITE"
    state["detail_requested"] = any(k in p for k in DETAIL_REQUEST_KEYWORDS)
    genre, rule_path = detect_writing_genre(ctx["prompt"])
    state["writing_genre"] = genre

    hints: list[str] = []
    if is_ro:
        hints.append("[AI-Specs] mode=READ_ONLY (COM-012: 只读审查档，禁止修改文件)")
    if genre and rule_path:
        hints.append(f"[AI-Specs] writing={genre} | load=writing/rules/core.md,{rule_path}")
    return 0, "\n".join(hints), ""


def handle_pre_tool(ctx: dict[str, Any], state: dict[str, Any]) -> tuple[int, str, str]:
    tool = ctx["tool_name"]
    fp = ctx["file_path"].replace("\\", "/")
    cmd = ctx["command"]

    if state.get("mode") == "READ_ONLY":
        if tool in WRITE_TOOLS:
            return 2, "", f"[BLOCK COM-012] 当前处于 READ_ONLY 授权面，禁止写文件 {fp} -> 请仅将问题写入审查报告"
        if tool in ("bash", "execute_bash") and re.search(r"\b(?:rm|mv|sed\s+-i|tee|git\s+(?:commit|push|checkout|restore|reset|clean|apply|merge|rebase))\b|>\s*[^&]", cmd):
            return 2, "", "[BLOCK COM-012] 当前处于 READ_ONLY 授权面，禁止执行写磁盘命令 -> 改用只读核验命令"

    if tool in WRITE_TOOLS and fp and PROTECTED_PATH_RE.search(fp):
        return 2, "", f"[BLOCK COM-013] 禁止直接改写受保护路径 {fp}（密钥或自动生成目录）-> 改用环境变量或扩展层"

    if tool in ("bash", "execute_bash") and cmd:
        for pat in DANGEROUS_BASH:
            if pat.search(cmd):
                return 2, "", "[BLOCK COM-013] 拦截高危破坏性命令 -> 请改用安全可回滚操作"

    return 0, "", ""


def scan_single_file(fp: str) -> list[tuple[str, str]]:
    """按扩展名懒加载对应 L2 校验器，返回 [(ruleId, compact_msg)]。"""
    issues: list[tuple[str, str]] = []
    p = Path(fp)
    if not p.is_file():
        return issues

    sec = load_script_module("check_security_hygiene", "check-security-hygiene.py")
    text = p.read_text(encoding="utf-8", errors="ignore")
    for i, line in enumerate(text.splitlines(), 1):
        if "security-hygiene: ignore" in line:
            continue
        for rule_id, desc, pattern, exts in sec.RULES:
            if p.name.endswith(exts) and pattern.search(line):
                issues.append((rule_id, f"[BLOCK {rule_id}] {p.name}:{i} {desc} -> 按 common/rules/security.md 修复"))

    if p.name.endswith(FRONTEND_EXTS):
        imp = load_script_module("check_import_path", "check-import-path.py")
        in_block = False
        for i, line in enumerate(text.splitlines(), 1):
            s = line.strip()
            if in_block:
                if "*/" in s:
                    in_block = False
                continue
            if s.startswith("/*"):
                if "*/" not in s:
                    in_block = True
                continue
            if s.startswith("//") or s.startswith("*"):
                continue
            for m in imp.RE_IMPORT.finditer(line):
                spec = m.group(2)
                if spec.startswith("."):
                    issues.append(("FE-IMPORT", f"[BLOCK FE-IMPORT] {p.name}:{i} 禁用相对导入 {spec} -> 改为 @/ 绝对路径加后缀"))
                elif not imp.at_ok(spec):
                    issues.append(("FE-IMPORT", f"[BLOCK FE-IMPORT] {p.name}:{i} @/ 缺后缀 {spec} -> 补全扩展名或 /index"))
    for i, line in enumerate(text.splitlines(), 1):
        if re.search(r"旧逻辑已删|墓碑注释", line):
            issues.append(("FE-005", f"[BLOCK FE-005] {p.name}:{i} 禁止残留墓碑注释 -> 删净旧实现痕迹"))
    return issues


def scan_writing_file(fp: str, genre: str) -> list[tuple[str, str]]:
    p = Path(fp)
    if not p.is_file():
        return []
    wr = load_script_module("check_writing", "check-writing.py")
    text = p.read_text(encoding="utf-8", errors="ignore")
    return wr.check_text(text, genre)


def format_block_with_breaker(state: dict[str, Any], target: str, issues: list[tuple[str, str]]) -> tuple[int, str, str]:
    primary_rule = issues[0][0]
    attempts = ss.record_block(state, primary_rule, target)
    if attempts > MAX_RETRIES_BEFORE_BREAK:
        return 0, "", f"[CIRCUIT-OPEN {primary_rule}] 连续阻断超过 {MAX_RETRIES_BEFORE_BREAK} 次已熔断放行，请向用户说明阻塞点"
    top_lines = [msg for _, msg in issues[:MAX_ERRORS_PER_BLOCK]]
    if len(issues) > MAX_ERRORS_PER_BLOCK:
        top_lines.append(f"...(+{len(issues) - MAX_ERRORS_PER_BLOCK} 处同类问题)")
    return 2, "", "\n".join(top_lines)


def handle_post_tool(ctx: dict[str, Any], state: dict[str, Any]) -> tuple[int, str, str]:
    tool = ctx["tool_name"]
    fp = ctx["file_path"]
    cmd = ctx["command"]

    stripped_cmd = cmd.lstrip()
    is_spoof = bool(re.match(r"^(?:echo|printf|cat|true|#)\b", stripped_cmd))
    if tool in ("bash", "execute_bash") and stripped_cmd and not is_spoof and TEST_CMD_RE.search(stripped_cmd):
        state["tests_verified"] = (int(ctx["exit_code"] or 0) == 0)
        return 0, "", ""

    if tool not in WRITE_TOOLS or not fp:
        return 0, "", ""

    # 写作模式按需拦截 .md / .txt 文件（非写作模式 0 开销直接放行）
    genre = state.get("writing_genre")
    if genre and fp.endswith(WRITING_EXTS):
        h = ss.file_sha256(fp)
        cache_key = f"{fp}::{genre}"
        if h and state["checked_hashes"].get(cache_key) == h:
            return 0, "", ""
        issues = scan_writing_file(fp, genre)
        if not issues:
            if h:
                state["checked_hashes"][cache_key] = h
            ss.clear_retries_for_file(state, fp)
            return 0, "", ""
        return format_block_with_breaker(state, fp, issues)

    if not fp.endswith(SOURCE_EXTS):
        return 0, "", ""

    if fp not in state["dirty_files"]:
        state["dirty_files"].append(fp)
    state["tests_verified"] = False

    h = ss.file_sha256(fp)
    if h and state["checked_hashes"].get(fp) == h:
        return 0, "", ""

    issues = scan_single_file(fp)
    if not issues:
        if h:
            state["checked_hashes"][fp] = h
        ss.clear_retries_for_file(state, fp)
        return 0, "", ""
    return format_block_with_breaker(state, fp, issues)


def handle_stop(ctx: dict[str, Any], state: dict[str, Any]) -> tuple[int, str, str]:
    dirty = state.get("dirty_files") or []
    if dirty and not state.get("tests_verified", True):
        attempts = ss.record_block(state, "FINAL-GATE", "session")
        if attempts > MAX_RETRIES_BEFORE_BREAK:
            return 0, "", ""
        files_brief = ", ".join(os.path.basename(f) for f in dirty[:3])
        return 2, "", f"[BLOCK FINAL-GATE] 本轮修改了 {len(dirty)} 个源码文件({files_brief})但未实跑测试 -> 请先执行测试/类型检查或按 final-gate.md 声明未验证项"

    reply = ctx.get("assistant_reply", "").strip()
    genre = state.get("writing_genre")
    if reply and genre and len(reply) >= 40:
        wr = load_script_module("check_writing", "check-writing.py")
        issues = wr.check_text(reply, genre)
        if issues:
            return format_block_with_breaker(state, "reply", issues)
        # 创意/内容写作场景不套用工程汇报的 COM-019 开头检查
        if genre in ("web-novel", "article", "copywriting"):
            return 0, "", ""

    if reply and not state.get("detail_requested", False):
        has_code_dump = "```" in reply and len(reply) > 350
        has_process_open = bool(re.match(r"^(?:我先|首先我|第一步|我检查了|我查看了|我执行了)", reply))
        if has_code_dump or has_process_open:
            attempts = ss.record_block(state, "COM-019", "reply")
            if attempts <= MAX_RETRIES_BEFORE_BREAK:
                return 2, "", "[BLOCK COM-019] 回复须结论先行且去技术化（用户未追问时禁先叙过程或贴大段代码）-> 改为 1 句白话结论 + 2~3 条业务影响"
    return 0, "", ""


def dispatch(raw: dict[str, Any], cli_event: str | None = None) -> tuple[int, str, str]:
    ctx = normalize_payload(raw, cli_event)
    sid = ctx["session_id"]
    state = ss.load_state(sid)
    ev = ctx["event"]

    if ev == "SessionStart":
        code, out, err = handle_session_start(ctx)
    elif ev == "UserPromptSubmit":
        code, out, err = handle_user_prompt(ctx, state)
    elif ev == "PreToolUse":
        code, out, err = handle_pre_tool(ctx, state)
    elif ev == "PostToolUse":
        code, out, err = handle_post_tool(ctx, state)
    elif ev in ("Stop", "TaskCompleted"):
        code, out, err = handle_stop(ctx, state)
    else:
        code, out, err = 0, "", ""

    ss.save_state(sid, state)
    return code, out, err


def main() -> int:
    cli_event = None
    if "--event" in sys.argv:
        idx = sys.argv.index("--event")
        if idx + 1 < len(sys.argv):
            cli_event = sys.argv[idx + 1]
    raw_txt = sys.stdin.read().strip()
    try:
        raw = json.loads(raw_txt) if raw_txt else {}
    except ValueError:
        return 0
    code, out, err = dispatch(raw, cli_event)
    if out:
        print(out)
    if err:
        print(err, file=sys.stderr)
    return code


if __name__ == "__main__":
    sys.exit(main())
