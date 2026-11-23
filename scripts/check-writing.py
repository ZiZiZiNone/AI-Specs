#!/usr/bin/env python3
"""AI-Specs 写作质量与专属风格确定性校验器（支持全场景去 AI 味 + 网文专属风格门禁）。

用法：
  python3 scripts/check-writing.py <file_or_dir> [--genre auto|report|article|copywriting|web-novel|documentation|correspondence]
退出码：0 通过；1 存在拦截项。
"""
from __future__ import annotations

import math
import re
import sys
from pathlib import Path

VALID_GENRES = ("auto", "report", "article", "copywriting", "web-novel", "documentation", "correspondence")

AI_SLOP_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("总而言之/综上所述", re.compile(r"总而言之|综上所述")),
    ("值得注意的是/值得一提的是", re.compile(r"值得注意的是|值得一提的是")),
    ("毋庸置疑/不可否认的是", re.compile(r"毋庸置疑|不可否认的是")),
    ("在当今数字化时代", re.compile(r"在当今(?:数字化|信息化|互联网)?时代")),
    ("空洞黑话(赋能/抓手/闭环/组合拳/生态矩阵)", re.compile(r"全方位赋能|多维赋能|生态矩阵|全链路闭环|组合拳|重塑(?:行业)?新格局")),
    ("空洞抒情(宛如画卷/开启新篇章)", re.compile(r"宛如一幅.{0,8}画卷|开启.{0,6}新篇章")),
    ("英文LLM高频过载词", re.compile(r"\b(?:delve[sd]?|tapestry|underscores?|intricate|commendable|meticulous(?:ly)?)\b", re.I)),
)

NOVEL_CLICHE_RE = re.compile(
    r"嘴角勾起一抹|不易察觉的弧度|眼中闪过一丝(?:精芒|寒芒|异色|冷意)|瞳孔骤缩|倒吸一口凉气|"
    r"心中暗道|不禁陷入了沉思|命运的齿轮(?:开始)?转动|恐怖如斯|此子断不可留|区区蝼蚁|竟敢如此放肆|一股难以言喻的情绪"
)
NOVEL_FILTER_RE = re.compile(r"(?:他|她)(?:心想|感到|觉得|意识到|暗想|心头一凛)")
REPORT_PROCESS_OPEN_RE = re.compile(r"^(?:我先|首先我们|首先我|第一步我们|近期我们经过|在本次调研过程中)")
COPY_HYPE_RE = re.compile(r"行业领先|颠覆(?:全?行业|传统)|极致(?:办公|使用)?体验|史无前例|全网第一")
DOC_CONDESCENDING_RE = re.compile(r"其实非常简单|非常简单|显而易见地|只需轻松点击")


def strip_ignored_blocks(text: str) -> str:
    """移除带 <!-- writing-check: ignore --> 标记的单个紧邻区块（单个段落或单个围栏块），绝不吞噬后续正文。"""
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)
    out: list[str] = []
    skip = False
    seen_body = False
    in_fence = False
    for line in text.splitlines():
        s = line.strip()
        if "writing-check: ignore" in line:
            skip = True
            seen_body = False
            in_fence = False
            continue
        if skip:
            if s.startswith("```"):
                if in_fence:
                    in_fence = False
                    skip = False
                else:
                    in_fence = True
                    seen_body = True
                continue
            if in_fence:
                continue
            if s.startswith("#") or s.startswith("✅"):
                skip = False
                out.append(line)
                continue
            if s == "":
                if seen_body:
                    skip = False
                continue
            seen_body = True
            continue
        out.append(line)
    return "\n".join(out)


def check_novel_metrics(text: str) -> list[tuple[str, str]]:
    """检查网文专属风格指纹：零陈词、贴身视角去过滤词、句长突发度（Burstiness）。"""
    issues: list[tuple[str, str]] = []
    cliches = sorted(set(NOVEL_CLICHE_RE.findall(text)))
    if cliches:
        sample = "、".join(cliches[:3])
        issues.append(("WR-NOVEL-CLICHE", f"[BLOCK WR-NOVEL-CLICHE] 命中网文/AI 陈词烂梗({sample}) -> 改用具体感官与动作细节（writing/rules/web-novel.md）"))

    filters = NOVEL_FILTER_RE.findall(text)
    char_count = max(len(re.sub(r"\s+", "", text)), 1)
    if len(filters) >= 3 and (len(filters) * 1000 / char_count) >= 3.0:
        issues.append(("WR-NOVEL-POV", f"[BLOCK WR-NOVEL-POV] 视角过滤词过密({len(filters)} 处，如「{filters[0]}」) -> 删掉过滤词，改用自由间接引语直出"))

    clean = re.sub(r"[#*>`\-\s]+", "", text)
    if len(clean) >= 350:
        sents = [s.strip() for s in re.split(r"[。！？!?]+", clean) if len(s.strip()) >= 2]
        if len(sents) >= 8:
            lens = [len(s) for s in sents]
            mean = sum(lens) / len(lens)
            stdev = math.sqrt(sum((x - mean) ** 2 for x in lens) / len(lens))
            short_ratio = sum(1 for x in lens if x <= 10) / len(lens)
            if stdev < 4.2 and short_ratio < 0.12:
                issues.append((
                    "WR-NOVEL-RHYTHM",
                    f"[BLOCK WR-NOVEL-RHYTHM] 句长过于均匀(标准差 {stdev:.1f}，短句占比 {short_ratio:.0%}) -> 冲突处切入 3-10 字极短断句拉开节奏",
                ))
    return issues


def check_text(text: str, genre: str = "auto") -> list[tuple[str, str]]:
    """校验单段或单篇文本，返回 [(rule_id, compact_msg)]。"""
    body = strip_ignored_blocks(text).strip()
    if not body:
        return []

    issues: list[tuple[str, str]] = []
    slop_hits: list[str] = []
    for label, pat in AI_SLOP_PATTERNS:
        if pat.search(body):
            slop_hits.append(label)
    if len(slop_hits) >= 2 or any(k in slop_hits for k in ("在当今数字化时代", "空洞黑话(赋能/抓手/闭环/组合拳/生态矩阵)", "空洞抒情(宛如画卷/开启新篇章)")):
        issues.append(("WR-AI-SLOP", f"[BLOCK WR-AI-SLOP] 命中 AI 味高频套话({' / '.join(slop_hits[:3])}) -> 删去空洞拔高词改用具体事实（writing/rules/core.md）"))

    if genre == "web-novel":
        issues.extend(check_novel_metrics(body))
    elif genre in ("report", "correspondence"):
        first_line = next((ln.strip() for ln in body.splitlines() if ln.strip() and not ln.strip().startswith("#")), "")
        if REPORT_PROCESS_OPEN_RE.search(first_line):
            issues.append(("WR-GENRE-STRUCT", "[BLOCK WR-GENRE-STRUCT] 首段以过程流水账开篇 -> 改为首句直给核心结论或明确诉求（BLUF/金字塔）"))
    elif genre == "copywriting":
        hype = COPY_HYPE_RE.findall(body)
        if hype and not re.search(r"\d", body):
            issues.append(("WR-GENRE-STRUCT", f"[BLOCK WR-GENRE-STRUCT] 文案出现无数据支撑的空洞自夸({hype[0]}) -> 改用具体数字或用户可感知收益"))
    elif genre == "documentation":
        m = DOC_CONDESCENDING_RE.search(body)
        if m:
            issues.append(("WR-GENRE-STRUCT", f"[BLOCK WR-GENRE-STRUCT] 文档出现居高临下措辞「{m.group(0)}」 -> 改为客观步骤与预期结果（writing/rules/documentation.md）"))

    return issues


def scan_path(target: Path, genre: str) -> list[str]:
    files = [target] if target.is_file() else sorted(p for p in target.rglob("*") if p.suffix in (".md", ".txt"))
    fails: list[str] = []
    for p in files:
        txt = p.read_text(encoding="utf-8", errors="ignore")
        for _, msg in check_text(txt, genre):
            fails.append(f"{p.name}: {msg}")
    return fails


def main() -> int:
    args = sys.argv[1:]
    genre = "auto"
    if "--genre" in args:
        idx = args.index("--genre")
        if idx + 1 < len(args):
            genre = args[idx + 1]
            args = args[:idx] + args[idx + 2:]
    if genre not in VALID_GENRES:
        print(f"不支持的 --genre: {genre}，可选: {', '.join(VALID_GENRES)}", file=sys.stderr)
        return 1
    if not args:
        print("用法: python3 scripts/check-writing.py <file_or_dir> [--genre <type>]", file=sys.stderr)
        return 1
    target = Path(args[0])
    if not target.exists():
        print(f"路径不存在: {target}", file=sys.stderr)
        return 1
    fails = scan_path(target, genre)
    for f in fails:
        print(f)
    print(f"写作规范校验 ({genre})：FAIL {len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
