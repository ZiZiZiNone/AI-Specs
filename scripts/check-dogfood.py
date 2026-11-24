#!/usr/bin/env python3
"""规范库自身合规性（Dogfooding）校验器（v2.2 新增）。

确保规范库自身严格遵守自己制定的核心工程纪律：
1. FE-005：参考源码中禁止残留墓碑注释或审计过程痕迹（如“修复 P0-1”“旧逻辑”）；
2. 函数规模红线（backend/go/style.md、backend/php/style.md）：非测试参考代码单函数 <= 50 行、参数 <= 4 个；
3. TODO 追踪纪律（common/rules/comment.md）：代码中不得存在无负责人/无单号的裸 TODO/FIXME；
4. 路径基准全覆盖：common/、frontend/、backend/、scripts/ 下全部 .md 文件均须声明「路径基准」。

用法：python3 scripts/check-dogfood.py [<SPEC_ROOT>]
退出码：0 通过；1 有 FAIL。
"""
import os
import re
import sys
from pathlib import Path

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_ARGS[0]).resolve() if _ARGS else Path(__file__).resolve().parent.parent

REF_DIRS = [
    "backend/go/test",
    "backend/php/test",
    "frontend/frameworks/vue3/test",
    "frontend/frameworks/miniprogram/test",
    "frontend/frameworks/react/test",
    "backend/python/test",
    "backend/typescript/test",
    "backend/java/test",
    "backend/rust/test",
]
RE_TOMBSTONE = re.compile(r"修复\s*P[0-2]|P0-\d|旧逻辑已删|墓碑")
RE_FN_SIG = re.compile(r"^\s*(?:public |private |protected |export )?(?:async )?(?:func|function)\s+([^(]*)\(([^)]*)\)")
RE_TODO = re.compile(r"\b(TODO|FIXME|HACK)\b")
RE_OWNED_TODO = re.compile(r"\b(?:TODO|FIXME|HACK)\([^)]+\)")


def check_dogfood(root: Path) -> list[str]:
    fails: list[str] = []

    # 1. 100% 路径基准覆盖
    for top in ("common", "frontend", "backend", "writing", "skills", "scripts"):
        for p in sorted((root / top).rglob("*.md")):
            if "路径基准" not in p.read_text(encoding="utf-8"):
                fails.append(f"{p.relative_to(root)}: FAIL 缺少「路径基准」声明")

    # 2. 参考代码 FE-005、函数 <=50 行、参数 <=4 个、无裸 TODO
    for sub in REF_DIRS:
        sub_dir = root / sub
        if not sub_dir.is_dir():
            continue
        for p in sorted(sub_dir.rglob("*")):
            if p.suffix not in (".go", ".php", ".mjs") or "test" in p.name or p.name == "run.php":
                continue
            rel = p.relative_to(root)
            lines = p.read_text(encoding="utf-8").splitlines()
            in_fn = None
            depth = 0
            start = 0
            for i, line in enumerate(lines, 1):
                if RE_TOMBSTONE.search(line):
                    fails.append(f"{rel}:{i}: FAIL 违反 FE-005（残留审计/墓碑注释）：{line.strip()[:60]}")
                if RE_TODO.search(line) and not RE_OWNED_TODO.search(line):
                    fails.append(f"{rel}:{i}: FAIL 违反 comment.md（无主裸 TODO）：{line.strip()[:60]}")
                m = RE_FN_SIG.match(line)
                if m:
                    params = [x.strip() for x in m.group(2).split(",") if x.strip()]
                    if len(params) > 4:
                        fails.append(f"{rel}:{i}: FAIL 参数个数 {len(params)} > 4（须封装 DTO）：{line.strip()[:60]}")
                if in_fn is None and m:
                    in_fn = line.strip()[:50]
                    start = i
                    depth = line.count("{") - line.count("}")
                    if depth <= 0 and "{" in line:
                        in_fn = None
                elif in_fn is not None:
                    depth += line.count("{") - line.count("}")
                    if depth <= 0:
                        length = i - start + 1
                        if length > 50:
                            fails.append(f"{rel}:{start}-{i}: FAIL 函数长度 {length} 行 > 50 行：{in_fn}")
                        in_fn = None
    # 3. 零孤立文档检查（每个非入口 .md 至少被一个 README/INDEX/AGENTS/INTEGRATION 索引）
    index_corpus = "\n".join(
        p.read_text(encoding="utf-8")
        for p in root.rglob("*.md")
        if p.name in ("README.md", "INDEX.md", "AGENTS.md", "INTEGRATION.md")
    )
    for top in ("common", "frontend", "backend", "writing", "skills", "scripts"):
        for p in sorted((root / top).rglob("*.md")):
            if p.name == "README.md":
                continue
            rel = str(p.relative_to(root)).replace("\\", "/")
            if rel not in index_corpus and p.name not in index_corpus:
                fails.append(f"{rel}: FAIL 孤立文档（未被任何 README.md 或 INDEX.md 索引）")
    return fails


def main() -> int:
    fails = check_dogfood(ROOT)
    for f in fails:
        print(f)
    print(f"狗食原则自检（FE-005 / <=50行 / <=4参 / 100%路径基准）：FAIL {len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
