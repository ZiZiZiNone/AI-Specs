#!/usr/bin/env python3
"""通用安全基线扫描器（COM-013 / COM-017 的可执行形态）。

扫描目标源码目录中的高危安全隐患：
- 硬编码云密钥 / GitHub Token / 私钥块 / 疑似真实密码与密钥赋值
- 前端危险 XSS 注入点（未注释说明的 v-html / dangerouslySetInnerHTML / innerHTML = / eval( / new Function(）
- Go 侧 http.DefaultClient 无超时裸调
- PHP 侧 unserialize( / eval( / global $

可在确认安全行尾添加 `security-hygiene: ignore` 白名单注释。
用法：python3 scripts/check-security-hygiene.py <TARGET_DIR> [--json]
退出码：0 通过；1 检出高危项；2 参数错误。
"""
import json
import os
import re
import sys

SKIP_DIRS = {".git", "node_modules", "dist", "build", "vendor", "__pycache__"}
SCAN_EXT = (".py", ".go", ".php", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue", ".env", ".yml", ".yaml", ".json")

RULES = [
    ("SEC-001", "疑似硬编码私钥块", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"), SCAN_EXT),
    ("SEC-002", "疑似硬编码 AWS Access Key", re.compile(r"\bAKIA[0-9A-Z]{16}\b"), SCAN_EXT),
    ("SEC-003", "疑似硬编码 GitHub Token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b"), SCAN_EXT),
    ("SEC-004", "疑似硬编码密钥/密码常量", re.compile(r"""(?i)\b(?:api_secret|jwt_secret|db_password|private_key)\s*[:=]\s*['"][^'"]{8,}['"]"""), SCAN_EXT),
    ("SEC-005", "高危动态执行 eval/new Function", re.compile(r"\b(?:eval\s*\(|new\s+Function\s*\()"), (".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue", ".php")),
    ("SEC-006", "高危 HTML 注入点（须经净化或标注豁免）", re.compile(r"(?:\bv-html\b|dangerouslySetInnerHTML|\.innerHTML\s*=)"), (".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue")),
    ("SEC-007", "Go 禁止无超时 http.DefaultClient", re.compile(r"\bhttp\.DefaultClient\b"), (".go",)),
    ("SEC-008", "PHP 禁止反序列化外部输入或使用 global", re.compile(r"(?:\bunserialize\s*\(|\bglobal\s+\$)"), (".php",)),
]


def scan_security(target_dir: str):
    findings = []
    checked = 0
    for dirpath, dirnames, filenames in os.walk(target_dir):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if not fn.endswith(SCAN_EXT):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, target_dir).replace(os.sep, "/")
            try:
                text = open(path, encoding="utf-8").read()
            except UnicodeDecodeError:
                continue
            checked += 1
            for i, line in enumerate(text.splitlines(), 1):
                if "security-hygiene: ignore" in line:
                    continue
                for rule_id, desc, pattern, exts in RULES:
                    if not fn.endswith(exts):
                        continue
                    if pattern.search(line):
                        findings.append({
                            "rule": rule_id,
                            "file": rel,
                            "line": i,
                            "reason": desc,
                            "snippet": line.strip()[:80],
                        })
    return checked, findings


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not args:
        print("用法：python3 scripts/check-security-hygiene.py <TARGET_DIR> [--json]")
        return 2
    target = os.path.abspath(args[0])
    if not os.path.isdir(target):
        print(f"目标不是目录：{target}")
        return 2

    as_json = "--json" in sys.argv
    checked, findings = scan_security(target)
    if as_json:
        print(json.dumps({"checked": checked, "failCount": len(findings), "findings": findings}, ensure_ascii=False, indent=2))
    else:
        print(f"安全基线扫描：共 {checked} 个文件，FAIL {len(findings)}")
        for f in findings:
            print(f"{f['file']}:{f['line']}: [{f['rule']}] {f['reason']} -> {f['snippet']}")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
