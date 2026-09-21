#!/usr/bin/env python3
r"""引用校验脚本（COM-011 引用可验伪的可执行形态）。

判定依据逐条来自 common/rules/constitution.md「COM-011 细则」：
- 条款级编号只存在于两处：constitution.md 的 COM-007 至 COM-012、AGENTS.md 的 FE-000 至 FE-005；
  其它地方出现未定义的 COM-xxx/FE-xxx 即编造 → FAIL。白名单硬编码为 COM-007 至 COM-012，不从正文反推，避免范例行污染。
- 位置式引用（第 N 节/条/段/章、倒数第）只允许两类：指向上述两处编号文件，
  或指向"编号小节例外"文件——判定式为
  `grep -nE "^#{2,4} *(FE-[0-9]+|[0-9]+\.)" <目标文件>`，
  被引编号须在该文件的命中结果中（**不维护文件清单，避免清单漂移**）→ 其它一律 FAIL。
- `>` 引文逐行校验：每行必须归属到一个 .md 文件，且是该文件的逐字子行
  （即 `grep -F` 可命中；markdown 加粗/行内代码/列表序号属排版差异，不计；
  摘录跳行不算改写，合并多行才算）→ 失配 WARN，加 --strict 时升级为 FAIL。
- FE-101 至 FE-104：`frontend/rules/core-principles.md` 的 `## FE-101`–`## FE-104` 已纳入 COM-011 编号小节例外，
  写编号（不写成"第 N 节"），按 PASS 处理。

扫描范围：规范库根下全部 *.md，排除 .git/、node_modules/、
.internal-docs/（过程记录非规范正文）、
.workbuddy-ai/（项目数据非规范正文）、vendor/（第三方依赖）。

用法：python scripts/check-citations.py [<SPEC_ROOT>] [--strict] [--verbose]
退出码：0 通过；1 有 FAIL（--strict 下 WARN 也算）。
"""
import os
import re
import sys

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = os.path.abspath(_ARGS[0]) if _ARGS else \
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SKIP_DIRS = {".git", "node_modules", ".internal-docs", ".workbuddy-ai", "vendor"}
ID_FILES = {"common/rules/constitution.md", "AGENTS.md"}
VALID_COM = {f"COM-{i:03d}" for i in range(7, 13)}

RE_COM = re.compile(r"\bCOM-\d+\b")
RE_FE = re.compile(r"\bFE-\d+\b")
RE_POS = re.compile(r"第\s*\d+\s*(节|条|段|章)|倒数第")
RE_POS_N = re.compile(r"第\s*(\d+)\s*(节|条|段|章)")
RE_MD = re.compile(r"([A-Za-z0-9_\-./]+\.md)")
RE_FE_HEAD = re.compile(r"^## (FE-\d+)\b", re.M)
RE_FENCE = re.compile(r"^\s*```")
LIST_MARK = re.compile(r"^(?:\d+[.)、]\s*|[-*+]\s*)")

fails, warns, infos = [], [], []


def emit(bucket, path, line, msg):
    bucket.append(f"{path}:{line}: {msg}")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def md_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in sorted(filenames):
            if fn.endswith(".md"):
                out.append(os.path.join(dirpath, fn))
    return out


def norm(s, strip_list=False):
    """去 markdown 行内标记、列表序号后压掉全部空白再比对。

    排版差异（加粗、行内代码、列表序号、换行位置）不算改写；
    文字本身的增删改一律检出。
    """
    s = re.sub(r"[*_`~]", "", s)
    if strip_list:
        s = LIST_MARK.sub("", s)
    return re.sub(r"\s+", "", s)


def line_hits(quote_line, target_text):
    """引文单行是否在目标文件中逐字命中（COM-011 的 grep -F 语义，逐行）。"""
    qn = norm(quote_line, strip_list=True)
    if not qn:
        return True
    return any(qn in norm(tl, strip_list=True) for tl in target_text.splitlines())


def strip_quotes_for_pos(line):
    """「」/"" 引号内与 ❌ 反例行不算位置式引用（COM-011 自身的规则描述与反例）。"""
    if "❌" in line:
        return ""
    return re.sub(r"「[^」]*」|\"[^\"]*\"|'[^']*'", "", line)


def resolve_target(token, files_by_base):
    token = token.replace("\\", "/").lstrip("./")
    if os.path.isfile(os.path.join(ROOT, token)):
        return token
    base = os.path.basename(token)
    hits = files_by_base.get(base, [])
    if len(hits) == 1:
        return hits[0]
    return None  # 找不到或歧义，调用方按 WARN/FAIL 处理


def main():
    files = md_files()
    by_base = {}
    for p in files:
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        by_base.setdefault(os.path.basename(p), []).append(rel)

    agents_text = read(os.path.join(ROOT, "AGENTS.md"))
    valid_com = set(VALID_COM)
    valid_fe_def = set(RE_FE.findall(agents_text))
    core_text = read(os.path.join(ROOT, "frontend", "rules", "core-principles.md"))
    valid_fe_core = set(RE_FE_HEAD.findall(core_text))
    valid_fe = valid_fe_def | valid_fe_core

    strict = "--strict" in sys.argv

    for path in files:
        rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
        text = read(path)
        lines = text.splitlines()
        in_fence = False

        for i, line in enumerate(lines, 1):
            if RE_FENCE.match(line):
                in_fence = not in_fence
                continue
            if in_fence:
                continue

            # A. 条款级编号：未在两处定义文件中出现的 COM-xxx/FE-xxx 即编造
            if rel not in ID_FILES:
                for tok in RE_COM.findall(line):
                    if tok not in valid_com:
                        emit(fails, rel, i, f"FAIL 未定义的条款编号 {tok}（COM-011：条款级编号只在 constitution/AGENTS 存在）")
                for tok in RE_FE.findall(line):
                    if tok not in valid_fe:
                        emit(fails, rel, i, f"FAIL 未定义的条款编号 {tok}（COM-011：条款级编号只在 AGENTS/core-principles 存在，计 {sorted(valid_fe)}）")

            # B. 位置式引用
            for m in RE_POS.finditer(strip_quotes_for_pos(line)):
                window = "\n".join(lines[max(0, i - 4):i])
                cands = RE_MD.findall(line) or RE_MD.findall(window)
                target = resolve_target(cands[-1], by_base) if cands else None
                if target is None:
                    emit(fails, rel, i, f"FAIL 位置式引用「{m.group(0)}」找不到被引文件（须写文件路径）")
                    continue
                if target in ID_FILES:
                    continue
                nums = RE_POS_N.findall(line)
                # COM-011「编号小节例外」：以判定式实际结果为准，不维护文件清单
                if nums:
                    heads = {a or b for a, b in re.findall(
                        r"^#{2,4} *(?:FE-([0-9]+)|([0-9]+)\.)",
                        read(os.path.join(ROOT, target)), re.M)}
                    if all(n in heads for n, _ in nums):
                        continue
                emit(fails, rel, i,
                     f"FAIL 位置式引用「{m.group(0)}」指向 {target}"
                     f"（非编号文件，且该文件无此编号的小节标题）")

        # C. `>` 引文块：须归属文件，且每行逐字命中（去标记比对）
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
            window = "\n".join(lines[max(0, i - 8):j])
            cands = RE_MD.findall(window)
            target = resolve_target(cands[-1], by_base) if cands else None
            if target is None:
                emit(warns, rel, i + 1, "WARN 引文块找不到归属文件，无法验伪（须在附近写文件路径）")
            else:
                t = read(os.path.join(ROOT, target))
                bad, ptr = [], []
                for q in quotes:
                    qs = q.strip()
                    if not qs or qs in t or line_hits(q, t):
                        continue
                    frags = re.findall(r"「([^」]+)」", q)
                    if (re.search(r"见|参照|引用", q)
                            and any(f and f in t for f in frags)):
                        ptr.append(q)
                    else:
                        bad.append(q)
                if bad:
                    emit(warns, rel, i + 1,
                         f"WARN 引文在 {target} 中逐字未命中（疑似改写或记错出处）：{bad[0][:40]}")
                if ptr:
                    infos.append(f"{rel}:{i + 1}: INFO 指针式引用（见 X「标题」），被指标题存在，可验伪")
                elif not bad and any(q.strip() and q.strip() not in t for q in quotes):
                    infos.append(f"{rel}:{i + 1}: INFO 引文与 {target} 仅排版标记差异，已按去标记比对通过")
            i = j

    for line in fails:
        print(line)
    for line in warns:
        print(line)
    if "--verbose" in sys.argv:
        for line in infos:
            print(line)
    print(f"共 {len(files)} 个文件：FAIL {len(fails)}，WARN {len(warns)}")
    if strict and warns:
        return 1
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
