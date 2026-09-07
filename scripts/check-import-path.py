#!/usr/bin/env python3
"""导入路径校验脚本（rules/import-path.md 的可执行形态）。

规则（逐条对应 rules/import-path.md）：
- 禁用相对：`from './…'`、`from '../…'` 一律 FAIL，含同目录；
  覆盖静态 import / export … from / 动态 import() / require()。
- `@/` 须带文件后缀或以 `/index` 结尾，否则 FAIL；
  第三方裸包与 `@scope/pkg` 形态放行；CSS `@import` / `url()` 不扫。
- 别名唯一性不在本脚本判定（新增别名走配置评审）。

扫描范围：显式传入的业务源码目录（默认 <SPEC_ROOT>/test/vue/src，
仅用于本库自证；业务项目传入自家 src/ 或 miniprogram/）。
跳过：.git、node_modules、dist、build、miniprogram_npm。

用法：python scripts/check-import-path.py [<TARGET_DIR>] [--verbose]
退出码：0 通过；1 有 FAIL。
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else \
    os.path.join(ROOT, "test", "vue", "src")

SKIP_DIRS = {".git", "node_modules", "dist", "build", "miniprogram_npm"}
SCAN_EXT = (".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".vue")

RE_IMPORT = re.compile(
    r"""(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+[^'"]*?\s+from\s+|"""
    r"""import\s*\(\s*|require\s*\(\s*)(['"])(\.[^'"]*|@\/[^'"]*)\1"""
)
RE_AT = re.compile(r"^@/(.+)$")
VERBOSE = "--verbose" in sys.argv

# 真实文件后缀（Q17=A 一律带后缀；`*.logic` 这类点分命名不是后缀）
SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".vue", ".json",
            ".css", ".scss", ".less")

fails = []
checked = 0


def at_ok(spec):
    m = RE_AT.match(spec)
    if not m:
        return True
    rest = m.group(1)
    if rest.endswith("/index"):
        return True
    tail = rest.rsplit("/", 1)[-1]
    return tail.endswith(SUFFIXES)


def main():
    global checked
    for dirpath, dirnames, filenames in os.walk(TARGET):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if not fn.endswith(SCAN_EXT):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
            with open(path, encoding="utf-8") as f:
                text = f.read()
            checked += 1
            for i, line in enumerate(text.splitlines(), 1):
                s = line.strip()
                if s.startswith("//") or s.startswith("*"):
                    continue
                for m in RE_IMPORT.finditer(line):
                    spec = m.group(2)
                    if spec.startswith("."):
                        fails.append(f"{rel}:{i}: FAIL 相对导入 {spec}（须改 @/ 绝对路径）")
                    elif not at_ok(spec):
                        fails.append(f"{rel}:{i}: FAIL @/ 缺后缀 {spec}（须带文件后缀或 /index 结尾）")
                    elif VERBOSE:
                        print(f"{rel}:{i}: ok {spec}")
    print(f"共 {checked} 个文件：FAIL {len(fails)}")
    for line in fails:
        print(line)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
