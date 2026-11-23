#!/usr/bin/env python3
"""AI-Specs v3.0 全栈统一质量门禁总入口（覆盖 Python / TS / Node / Vue 3 / React / 小程序 / Go / PHP / Java / Rust）。

用法：python3 scripts/check-all.py [<SPEC_ROOT>]
退出码：0 全部通过；1 任一项失败。
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_ARGS[0]).resolve() if _ARGS else Path(__file__).resolve().parent.parent


def run_step(name: str, cmd: list[str], extra_env: dict[str, str] | None = None) -> bool:
    print(f"\n=== [{name}] ===")
    print("$ " + " ".join(cmd))
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    res = subprocess.run(cmd, cwd=str(ROOT), env=env)
    ok = res.returncode == 0
    print(f"=> {name}: {'PASS' if ok else f'FAIL (exit {res.returncode})'}")
    return ok


def main() -> int:
    py = sys.executable
    loader = str(ROOT / "scripts/node-alias-loader.mjs")
    cache_bin = str(Path.home() / ".cache/ai-specs-bin")
    os.makedirs(cache_bin, exist_ok=True)

    steps: list[tuple[str, list[str], dict[str, str] | None]] = [
        ("COM-011 v3 引用/断链/章节/行内引文严格校验", [py, str(ROOT / "scripts/check-citations.py"), str(ROOT), "--strict"], None),
        ("规范库结构与编号一致性校验", [py, str(ROOT / "scripts/check-spec-integrity.py"), str(ROOT)], None),
        ("规范库狗食自检 (FE-005/<=50L/<=4参/路径基准)", [py, str(ROOT / "scripts/check-dogfood.py"), str(ROOT)], None),
        ("门禁脚本自身单元测试", [py, str(ROOT / "scripts/test-scripts.py")], None),
        ("安全基线扫描 (scripts)", [py, str(ROOT / "scripts/check-security-hygiene.py"), str(ROOT / "scripts")], None),
        ("安全基线扫描 (backend 全部参考切片)", [py, str(ROOT / "scripts/check-security-hygiene.py"), str(ROOT / "backend")], None),
        ("安全基线扫描 (frontend 全部参考切片)", [py, str(ROOT / "scripts/check-security-hygiene.py"), str(ROOT / "frontend/frameworks")], None),
        ("前端导入路径校验 (vue3/test)", [py, str(ROOT / "scripts/check-import-path.py"), str(ROOT / "frontend/frameworks/vue3/test")], None),
        ("前端导入路径校验 (miniprogram/test)", [py, str(ROOT / "scripts/check-import-path.py"), str(ROOT / "frontend/frameworks/miniprogram/test")], None),
        ("前端导入路径校验 (react/test)", [py, str(ROOT / "scripts/check-import-path.py"), str(ROOT / "frontend/frameworks/react/test")], None),
        ("Python 后端参考切片测试", [py, "-m", "unittest", "discover", "-s", str(ROOT / "backend/python/test/tests"), "-v"], None),
    ]

    tsc_bin = shutil.which("tsc")
    if tsc_bin:
        for label, rel in [
            ("TS 类型检查 (vue3/test)", "frontend/frameworks/vue3/test/tsconfig.json"),
            ("TS 类型检查 (miniprogram/test)", "frontend/frameworks/miniprogram/test/tsconfig.json"),
            ("TS 类型检查 (react/test)", "frontend/frameworks/react/test/tsconfig.json"),
            ("TS 类型检查 (backend/typescript/test)", "backend/typescript/test/tsconfig.json"),
        ]:
            steps.append((label, [tsc_bin, "-p", str(ROOT / rel), "--noEmit"], None))

    node_bin = shutil.which("node")
    if node_bin:
        steps.append(("Vue 3 参考切片测试 (@/ loader)", [node_bin, "--no-warnings", "--loader", loader, "--test", str(ROOT / "frontend/frameworks/vue3/test/tests/vue3-slice.test.mjs")], {"AI_SPEC_ALIAS_ROOT": str(ROOT / "frontend/frameworks/vue3/test/src")}))
        steps.append(("小程序参考切片测试 (@/ loader)", [node_bin, "--no-warnings", "--loader", loader, "--test", str(ROOT / "frontend/frameworks/miniprogram/test/tests/miniprogram-slice.test.mjs")], {"AI_SPEC_ALIAS_ROOT": str(ROOT / "frontend/frameworks/miniprogram/test/miniprogram")}))
        steps.append(("React/Next.js 参考切片测试 (@/ loader)", [node_bin, "--no-warnings", "--loader", loader, "--test", str(ROOT / "frontend/frameworks/react/test/tests/react-slice.test.mjs")], {"AI_SPEC_ALIAS_ROOT": str(ROOT / "frontend/frameworks/react/test/src")}))
        steps.append(("Node/TS 后端参考切片测试", [node_bin, "--test", str(ROOT / "backend/typescript/test/tests/order.test.mjs")], None))

    if shutil.which("go"):
        steps.append(("Go 后端格式化/vet/竞态测试", ["bash", "-c", f"mkdir -p \"$HOME/.cache/go-tmp\" && cd '{ROOT / 'backend/go/test'}' && test -z \"$(gofmt -l .)\" && go vet ./... && GOTMPDIR=\"$HOME/.cache/go-tmp\" go test -race -v ./..."], None))
    if shutil.which("php"):
        steps.append(("PHP 后端语法与单元测试", ["bash", "-c", f"cd '{ROOT / 'backend/php/test'}' && find src test -name '*.php' -print0 | xargs -0 -n1 php -l && php test/run.php"], None))
    if shutil.which("javac") and shutil.which("java"):
        steps.append(("Java 17+ 后端编译与单元测试", ["bash", "-c", f"javac -d '{cache_bin}' '{ROOT / 'backend/java/test/OrderSliceTest.java'}' && java -cp '{cache_bin}' OrderSliceTest"], None))
    if shutil.which("rustc"):
        steps.append(("Rust 后端编译与单元测试", ["bash", "-c", f"rustc --test '{ROOT / 'backend/rust/test/src/lib.rs'}' -o '{cache_bin}/rust_order_test' && '{cache_bin}/rust_order_test'"], None))

    results = [(name, run_step(name, cmd, env)) for name, cmd, env in steps]
    passed = sum(1 for _, ok in results if ok)
    failed = len(results) - passed
    print("\n================ 全栈门禁汇总 (v3.0) ================")
    for name, ok in results:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print(f"总计：{passed}/{len(results)} 通过，{failed} 失败")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
