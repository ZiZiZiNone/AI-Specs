#!/usr/bin/env python3
"""导入路径校验脚本 v2.0（frontend/rules/import-path.md 的可执行形态）。

v2.0 升级：
- 正确跳过多行块注释 /* ... */，减少误报；
- 支持 --json 输出结构化结果供 CI 消费；
- 覆盖 .ts/.tsx/.js/.jsx/.mts/.cts/.mjs/.vue。

用法：python3 scripts/check-import-path.py <TARGET_DIR> [--verbose] [--json]
退出码：0 通过；1 有 FAIL；未传有效目录退出码 2。
"""
import json
import os
import re
import sys

SKIP_DIRS = {".git", "node_modules", "dist", "build", "miniprogram_npm"}
SCAN_EXT = (".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".vue")
RE_IMPORT = re.compile(
    r"""(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+[^'"]*?\s+from\s+|"""
    r"""import\s*\(\s*|require\s*\(\s*)(['"])(\.[^'"]*|@\/[^'"]*)\1"""
)
RE_AT = re.compile(r"^@/(.+)$")
SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".vue", ".json",
            ".css", ".scss", ".less")


def at_ok(spec: str) -> bool:
    m = RE_AT.match(spec)
    if not m:
        return True
    rest = m.group(1)
    if rest.endswith("/index"):
        return True
    tail = rest.rsplit("/", 1)[-1]
    return tail.endswith(SUFFIXES)


def scan_dir(target_dir: str, verbose: bool = False):
    fails = []
    checked = 0
    for dirpath, dirnames, filenames in os.walk(target_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if not fn.endswith(SCAN_EXT):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, target_dir).replace(os.sep, "/")
            with open(path, encoding="utf-8") as f:
                text = f.read()
            checked += 1
            in_block_comment = False
            for i, line in enumerate(text.splitlines(), 1):
                s = line.strip()
                if in_block_comment:
                    if "*/" in s:
                        in_block_comment = False
                    continue
                if s.startswith("/*"):
                    if "*/" not in s:
                        in_block_comment = True
                    continue
                if s.startswith("//") or s.startswith("*"):
                    continue
                for m in RE_IMPORT.finditer(line):
                    spec = m.group(2)
                    if spec.startswith("."):
                        fails.append({"file": rel, "line": i, "spec": spec,
                                      "reason": f"相对导入 {spec}（须改 @/ 绝对路径）"})
                    elif not at_ok(spec):
                        fails.append({"file": rel, "line": i, "spec": spec,
                                      "reason": f"@/ 缺后缀 {spec}（须带文件后缀或 /index 结尾）"})
                    elif verbose:
                        print(f"{rel}:{i}: ok {spec}")
    return checked, fails


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not args:
        print("用法：python3 scripts/check-import-path.py <业务源码目录> [--verbose] [--json]")
        return 2
    target = os.path.abspath(args[0])
    if not os.path.isdir(target):
        print(f"目标不是目录：{target}")
        return 2

    as_json = "--json" in sys.argv
    verbose = "--verbose" in sys.argv
    checked, fails = scan_dir(target, verbose=verbose and not as_json)

    if as_json:
        print(json.dumps({"checked": checked, "failCount": len(fails), "fails": fails}, ensure_ascii=False, indent=2))
    else:
        print(f"共 {checked} 个文件：FAIL {len(fails)}")
        for f in fails:
            print(f"{f['file']}:{f['line']}: FAIL {f['reason']}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
