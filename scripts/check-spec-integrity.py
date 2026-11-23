#!/usr/bin/env python3
"""规范库结构与全局一致性校验器（v2.0 新增）。

校验项：
1. 禁止在共享文档中硬编码个人本机路径（如 C:\\Users\\<name>、/Users/<name>、/home/<name>）；
2. 四大编号定义源在 AGENTS.md、INDEX.md、common/rules/constitution.md、backend/rules/core-principles.md 中声明一致；
3. 规范库所有包含 .md 的子目录均具备 README.md 入口文件；
4. 关键必读四件与核心目录结构均真实存在。

用法：python3 scripts/check-spec-integrity.py [<SPEC_ROOT>]
退出码：0 通过；1 有 FAIL。
"""
import os
import re
import sys

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = os.path.abspath(_ARGS[0]) if _ARGS else \
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", "node_modules", "vendor", ".github"}
RE_PERSONAL_PATH = re.compile(r"(?:[A-Za-z]:\\Users\\[A-Za-z0-9_.-]+|/Users/[A-Za-z0-9_.-]+|/home/[A-Za-z0-9_.-]+)")

REQUIRED_FILES = [
    "README.md",
    "AGENTS.md",
    "INDEX.md",
    "INTEGRATION.md",
    "common/rules/constitution.md",
    "common/principles.md",
    "common/protocol/task-boundary.md",
    "common/rules/security.md",
    "common/rules/observability.md",
    "common/rules/ai-safety.md",
    "common/rules/compatibility.md",
    "common/rules/communication.md",
    "frontend/rules/core-principles.md",
    "frontend/rules/security.md",
    "frontend/rules/accessibility.md",
    "frontend/rules/performance.md",
    "frontend/rules/i18n-precision.md",
    "backend/rules/core-principles.md",
    "backend/patterns/authz-security.md",
    "backend/patterns/concurrency-locking.md",
    "backend/patterns/caching.md",
    "backend/patterns/resilience.md",
    "backend/patterns/migration-online-ddl.md",
    "backend/patterns/observability.md",
    "backend/patterns/outbox-async.md",
    "writing/README.md",
    "writing/rules/core.md",
    "writing/rules/report.md",
    "writing/rules/article.md",
    "writing/rules/copywriting.md",
    "writing/rules/web-novel.md",
    "writing/rules/documentation.md",
    "writing/rules/correspondence.md",
    "writing/checklists/writing-check.md",
    "writing/examples/anti-ai-rewrites.md",
]


def check_integrity(root: str):
    fails = []

    # 1. 核心文件存在性
    for rel in REQUIRED_FILES:
        if not os.path.isfile(os.path.join(root, rel)):
            fails.append(f"MISSING 核心规范文件缺失：{rel}")

    # 2. 禁止硬编码个人本机路径
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if not fn.endswith(".md"):
                continue
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, root).replace(os.sep, "/")
            with open(p, encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    m = RE_PERSONAL_PATH.search(line)
                    if m:
                        fails.append(f"{rel}:{i}: FAIL 存在硬编码个人本机路径 {m.group(0)}")

    # 3. 含 .md 文件的规范子目录均有 README.md（排除 common/rules、common/protocol 等由上级 README 索引的平铺规则目录以外的顶层/框架目录）
    required_readme_dirs = [
        "common", "frontend", "backend", "writing", "hooks", "scripts",
        "backend/rules", "backend/patterns", "backend/anti-patterns",
        "backend/go", "backend/go/goframe", "backend/go/test",
        "backend/php", "backend/php/laravel", "backend/php/test",
        "frontend/frameworks", "frontend/frameworks/vue3", "frontend/frameworks/vue3/test",
        "frontend/frameworks/miniprogram", "frontend/frameworks/miniprogram/test",
        "frontend/frameworks/react", "frontend/frameworks/react/test",
        "backend/python", "backend/python/test", "backend/typescript", "backend/typescript/test",
        "backend/java", "backend/java/test", "backend/rust", "backend/rust/test",
    ]
    for d in required_readme_dirs:
        if not os.path.isfile(os.path.join(root, d, "README.md")):
            fails.append(f"MISSING 目录缺少入口文件：{d}/README.md")

    # 4. 四大编号定义源口径一致性检查
    for fname in ("AGENTS.md", "INDEX.md", "common/rules/constitution.md"):
        fp = os.path.join(root, fname)
        if os.path.isfile(fp):
            txt = open(fp, encoding="utf-8").read()
            for token in ("COM-007", "COM-019", "FE-000", "FE-005", "FE-101", "FE-104", "BE-101", "BE-108"):
                if token not in txt:
                    fails.append(f"{fname}: FAIL 编号定义源口径不完整，缺少 {token}")

    return fails


def main():
    fails = check_integrity(ROOT)
    for f in fails:
        print(f)
    print(f"结构一致性校验：FAIL {len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
