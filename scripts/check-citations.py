#!/usr/bin/env python3
r"""引用校验脚本 v3.0（COM-011 引用可验伪的可执行形态）。

v3.0 全量能力：
1. 四大编号定义源校验：COM-007~019、FE-000~005、FE-101~104、BE-101~108；
2. 位置式引用（第 N 节/条/段/章、倒数第）拦截，支持编号小节例外判定式；
3. `>` 引文块逐行逐字核验；
4. 正文裸路径（common/...、frontend/...、backend/...、scripts/...）断链校验；
5. 正文 `文件路径「小节标题」` 存在性校验；
6. 新增：正文行内 `文件路径` 同行双引号 `"..."` 逐字摘录校验（长度 ≥ 10 字符且非反例/命令）。

用法：python3 scripts/check-citations.py [<SPEC_ROOT>] [--strict] [--verbose]
退出码：0 通过；1 有 FAIL（--strict 下 WARN 也算）。
"""
import os
import re
import sys

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = os.path.abspath(_ARGS[0]) if _ARGS else \
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", "node_modules", ".internal-docs", ".workbuddy-ai", "vendor", "target"}
ID_FILES = {
    "common/rules/constitution.md",
    "AGENTS.md",
    "frontend/rules/core-principles.md",
    "backend/rules/core-principles.md",
}
VALID_COM = {f"COM-{i:03d}" for i in range(7, 20)}

RE_COM = re.compile(r"\bCOM-\d+\b")
RE_FE = re.compile(r"\bFE-\d+\b")
RE_BE = re.compile(r"\bBE-\d+\b")
RE_POS = re.compile(r"第\s*\d+\s*(节|条|段|章)|倒数第")
RE_POS_N = re.compile(r"第\s*(\d+)\s*(节|条|段|章)")
RE_MD = re.compile(r"([A-Za-z0-9_\-./]+\.md)")
RE_BARE_SPEC_PATH = re.compile(
    r"(?<![A-Za-z0-9_\-./])((?:common|frontend|backend|writing|skills|scripts)/[A-Za-z0-9_\-./]+\.(?:md|py|sh|go|php|mjs|ts|java|rs|json))"
)
RE_MD_SECTION = re.compile(r"`?((?:common|frontend|backend|writing|skills|scripts)/[A-Za-z0-9_\-./]+\.md)`?\s*「([^」]+)」")
RE_INLINE_QUOTE = re.compile(r"`?((?:common|frontend|backend|writing|skills|scripts)/[A-Za-z0-9_\-./]+\.md)`?[^。\n]{0,40}[:：]\s*\"([^\"]{10,})\"")
RE_FE_HEAD = re.compile(r"^## (FE-\d+)\b", re.M)
RE_BE_HEAD = re.compile(r"^## (BE-\d+)\b", re.M)
RE_FENCE = re.compile(r"^\s*```")
LIST_MARK = re.compile(r"^(?:\d+[.)、]\s*|[-*+]\s*)")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def md_files(root):
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if fn.endswith(".md"):
                out.append(os.path.join(dirpath, fn))
    return out


def norm(s, strip_list=False):
    s = re.sub(r"[*_`~]", "", s)
    if strip_list:
        s = LIST_MARK.sub("", s)
    return re.sub(r"\s+", "", s)


def line_hits(quote_line, target_text):
    qn = norm(quote_line, strip_list=True)
    if not qn:
        return True
    return any(qn in norm(tl, strip_list=True) for tl in target_text.splitlines())


def strip_quotes_for_pos(line):
    if "❌" in line:
        return ""
    return re.sub(r"「[^」]*」|\"[^\"]*\"|'[^']*'", "", line)


def resolve_target(root, token, files_by_base):
    token = token.replace("\\", "/").lstrip("./")
    if os.path.isfile(os.path.join(root, token)):
        return token
    base = os.path.basename(token)
    hits = files_by_base.get(base, [])
    if len(hits) == 1:
        return hits[0]
    return None


def check_repo(root, strict=False, verbose=False):
    fails, warns, infos = [], [], []
    files = md_files(root)
    by_base = {}
    cache = {}
    for p in files:
        rel = os.path.relpath(p, root).replace(os.sep, "/")
        by_base.setdefault(os.path.basename(p), []).append(rel)
        cache[rel] = read(p)

    def emit(bucket, path, line, msg):
        bucket.append(f"{path}:{line}: {msg}")

    valid_com = set(VALID_COM)
    agents_text = cache.get("AGENTS.md", "")
    valid_fe = set(RE_FE.findall(agents_text)) | set(RE_FE_HEAD.findall(cache.get("frontend/rules/core-principles.md", "")))
    valid_be = set(RE_BE_HEAD.findall(cache.get("backend/rules/core-principles.md", "")))

    for path in files:
        rel = os.path.relpath(path, root).replace(os.sep, "/")
        text = cache[rel]
        lines = text.splitlines()
        in_fence = False

        for i, line in enumerate(lines, 1):
            if RE_FENCE.match(line):
                in_fence = not in_fence
                continue
            if in_fence:
                continue

            if rel not in ID_FILES:
                for tok in RE_COM.findall(line):
                    if tok not in valid_com:
                        if tok in {"COM-001", "COM-006"} and ("历史" in line or "预留" in line):
                            continue
                        emit(fails, rel, i, f"FAIL 未定义的条款编号 {tok}（合法范围 {sorted(valid_com)}）")
                for tok in RE_FE.findall(line):
                    if tok not in valid_fe:
                        emit(fails, rel, i, f"FAIL 未定义的条款编号 {tok}（合法范围 {sorted(valid_fe)}）")
                for tok in RE_BE.findall(line):
                    if tok not in valid_be:
                        emit(fails, rel, i, f"FAIL 未定义的条款编号 {tok}（合法范围 {sorted(valid_be)}）")

            for m in RE_POS.finditer(strip_quotes_for_pos(line)):
                window = "\n".join(lines[max(0, i - 4):i])
                cands = RE_MD.findall(line) or RE_MD.findall(window)
                target = resolve_target(root, cands[-1], by_base) if cands else None
                if target is None:
                    emit(fails, rel, i, f"FAIL 位置式引用「{m.group(0)}」找不到被引文件（须写文件路径）")
                    continue
                if target in ID_FILES:
                    continue
                nums = RE_POS_N.findall(line)
                if nums:
                    heads = {a or b or c for a, b, c in re.findall(
                        r"^#{2,4} *(?:FE-([0-9]+)|BE-([0-9]+)|([0-9]+)\.)",
                        cache.get(target, ""), re.M)}
                    if all(n in heads for n, _ in nums):
                        continue
                emit(fails, rel, i, f"FAIL 位置式引用「{m.group(0)}」指向 {target}（非编号文件且无对应编号小节）")

            if "❌" not in line:
                for m in RE_BARE_SPEC_PATH.finditer(line):
                    ref_path = m.group(1)
                    if "xxx" in ref_path or "*" in ref_path or "<" in ref_path:
                        continue
                    if not os.path.isfile(os.path.join(root, ref_path)):
                        emit(fails, rel, i, f"FAIL 断链：引用路径 {ref_path} 在仓库中不存在")

                for m in RE_MD_SECTION.finditer(line):
                    ref_path, sec = m.group(1), m.group(2)
                    if "xxx" in ref_path or ref_path not in cache:
                        continue
                    target_text = cache[ref_path]
                    if sec not in target_text and norm(sec) not in norm(target_text):
                        emit(warns, rel, i, f"WARN 章节引用失配：{ref_path} 中未找到「{sec}」")

                # F. 正文行内 "..." 逐字摘录校验（v3.0 新增）
                for m in RE_INLINE_QUOTE.finditer(line):
                    ref_path, quoted = m.group(1), m.group(2)
                    if ref_path not in cache:
                        continue
                    if not line_hits(quoted, cache[ref_path]):
                        emit(warns, rel, i, f"WARN 行内引文在 {ref_path} 中逐字未命中：{quoted[:40]}")

        i = 0
        in_fence = False
        while i < len(lines):
            line = lines[i]
            if RE_FENCE.match(line):
                in_fence = not in_fence
                i += 1
                continue
            if in_fence or not line.lstrip().startswith(">"):
                i += 1
                continue
            j = i
            quotes = []
            while j < len(lines) and lines[j].lstrip().startswith(">"):
                quotes.append(re.sub(r"^\s*>\s?", "", lines[j]))
                j += 1
            if quotes and re.match(r"^(?:说明|注意|路径基准|提示)\s*[：:]", quotes[0].strip()):
                i = j
                continue
            window = "\n".join(lines[max(0, i - 8):j])
            cands = RE_MD.findall(window)
            target = resolve_target(root, cands[-1], by_base) if cands else None
            if target is None:
                emit(warns, rel, i + 1, "WARN 引文块找不到归属文件，无法验伪（须在附近写文件路径）")
            else:
                t = cache.get(target, "")
                bad = [q for q in quotes if q.strip() and q.strip() not in t and not line_hits(q, t)
                       and not (re.search(r"见|参照|引用", q) and any(f and f in t for f in re.findall(r"「([^」]+)」", q)))]
                if bad:
                    emit(warns, rel, i + 1, f"WARN 引文在 {target} 中逐字未命中（疑似改写或记错出处）：{bad[0][:40]}")
            i = j

    return files, fails, warns, infos


def main():
    strict = "--strict" in sys.argv
    verbose = "--verbose" in sys.argv
    files, fails, warns, infos = check_repo(ROOT, strict=strict, verbose=verbose)
    for line in fails:
        print(line)
    for line in warns:
        print(line)
    if verbose:
        for line in infos:
            print(line)
    print(f"共 {len(files)} 个文件：FAIL {len(fails)}，WARN {len(warns)}")
    if strict and warns:
        return 1
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
