#!/usr/bin/env python3
"""独立建议 Skill 库与三源兜底注册表校验器（v3.2 新增）。

校验项：
1. skills/README.md 与 skills/registry.json 存在且 JSON 合法；
2. policy 策略字段齐全（single_match / multi_match / no_response_or_denied_fallback / prefer_order / local_search_dirs）；
3. 每个领域均具备合法触发正则、default_optimal、且 fallback_bundled 指向真实存在的 bundled Skill；
4. 所有 bundled Skill 的 SKILL.md 符合 frontmatter（name/description）、路径基准与 <500 行规范；
5. 所有 remote Skill 具备 repo / url / install / summary 字段。

用法：python3 scripts/check-skills.py [<SPEC_ROOT>]
退出码：0 通过；1 有 FAIL。
"""
import json
import re
import sys
from pathlib import Path

_ARGS = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_ARGS[0]).resolve() if _ARGS else Path(__file__).resolve().parent.parent

REQUIRED_POLICY = (
    "skip_when_user_skill_specified",
    "single_match",
    "multi_match",
    "no_response_or_denied_fallback",
    "prefer_order",
    "local_search_dirs",
)


def check_bundled_file(root: Path, sid: str, rel_path: str) -> list[str]:
    fails: list[str] = []
    fp = root / rel_path
    if not fp.is_file():
        return [f"skills/registry.json: FAIL bundled 技能文件缺失 {sid} -> {rel_path}"]
    text = fp.read_text(encoding="utf-8")
    lines = text.splitlines()
    if len(lines) >= 500:
        fails.append(f"{rel_path}: FAIL SKILL.md 超过 500 行 ({len(lines)})")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        fails.append(f"{rel_path}: FAIL 缺少 YAML frontmatter")
    else:
        fm = m.group(1)
        if not re.search(rf"^name:\s*{re.escape(sid)}\s*$", fm, re.M):
            fails.append(f"{rel_path}: FAIL frontmatter name 与技能 ID {sid} 不一致")
        if not re.search(r"^description:\s*\S+", fm, re.M):
            fails.append(f"{rel_path}: FAIL frontmatter 缺少 description")
    if "路径基准" not in text:
        fails.append(f"{rel_path}: FAIL 缺少「路径基准」声明")
    return fails


def check_domain(root: Path, domain_id: str, cfg: dict) -> list[str]:
    fails: list[str] = []
    pats = cfg.get("intent_patterns") or []
    if not pats:
        fails.append(f"skills/registry.json[{domain_id}]: FAIL 缺少 intent_patterns")
    for pat in pats:
        try:
            re.compile(pat)
        except re.error as exc:
            fails.append(f"skills/registry.json[{domain_id}]: FAIL 非法正则 {pat!r}: {exc}")

    skills = cfg.get("skills") or []
    by_id: dict[str, dict] = {}
    for sk in skills:
        sid = sk.get("id", "")
        if not sid or sid in by_id:
            fails.append(f"skills/registry.json[{domain_id}]: FAIL 空或重复技能 ID {sid!r}")
            continue
        by_id[sid] = sk
        src = sk.get("source")
        if src == "bundled":
            fails.extend(check_bundled_file(root, sid, sk.get("path", "")))
        elif src == "remote":
            for k in ("repo", "url", "install", "summary"):
                if not sk.get(k):
                    fails.append(f"skills/registry.json[{domain_id}.{sid}]: FAIL remote 缺少字段 {k}")
        elif src != "local":
            fails.append(f"skills/registry.json[{domain_id}.{sid}]: FAIL 非法 source={src!r}")

    opt = cfg.get("default_optimal")
    if opt not in by_id:
        fails.append(f"skills/registry.json[{domain_id}]: FAIL default_optimal={opt!r} 不在技能列表中")
    fb = cfg.get("fallback_bundled")
    if fb not in by_id or by_id[fb].get("source") != "bundled":
        fails.append(f"skills/registry.json[{domain_id}]: FAIL fallback_bundled={fb!r} 必须为同域内 bundled 技能")
    return fails


def check_skills(root: Path) -> list[str]:
    fails: list[str] = []
    reg_path = root / "skills" / "registry.json"
    if not (root / "skills" / "README.md").is_file():
        fails.append("MISSING 缺少 skills/README.md")
    if not reg_path.is_file():
        return fails + ["MISSING 缺少 skills/registry.json"]
    try:
        data = json.loads(reg_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return fails + [f"skills/registry.json: FAIL JSON 解析失败: {exc}"]

    policy = data.get("policy") or {}
    for key in REQUIRED_POLICY:
        if key not in policy:
            fails.append(f"skills/registry.json: FAIL policy 缺少 {key}")

    domains = data.get("domains") or {}
    if not domains:
        fails.append("skills/registry.json: FAIL domains 为空")
    for did, cfg in domains.items():
        fails.extend(check_domain(root, did, cfg))
    return fails


def probe_remote_urls(root: Path) -> list[str]:
    import urllib.error
    import urllib.request

    fails: list[str] = []
    data = json.loads((root / "skills" / "registry.json").read_text(encoding="utf-8"))
    seen: set[str] = set()
    headers = {"User-Agent": "AI-Specs-Skill-Checker/3.2"}
    for did, cfg in (data.get("domains") or {}).items():
        for sk in cfg.get("skills") or []:
            url = sk.get("url")
            if sk.get("source") != "remote" or not url or url in seen:
                continue
            seen.add(url)
            req = urllib.request.Request(url, headers=headers, method="HEAD")
            try:
                with urllib.request.urlopen(req, timeout=6) as resp:
                    if resp.status >= 400:
                        fails.append(f"skills/registry.json[{did}.{sk['id']}]: FAIL URL 返回 {resp.status} -> {url}")
            except urllib.error.HTTPError as exc:
                if exc.code != 405:
                    fails.append(f"skills/registry.json[{did}.{sk['id']}]: FAIL URL 不可达 ({exc.code}) -> {url}")
            except Exception as exc:
                fails.append(f"skills/registry.json[{did}.{sk['id']}]: FAIL URL 探测失败 ({exc}) -> {url}")
    return fails


def main() -> int:
    fails = check_skills(ROOT)
    if '--online' in sys.argv:
        fails.extend(probe_remote_urls(ROOT))
    for f in fails:
        print(f)
    print(f"独立建议 Skill 库校验：FAIL {len(fails)}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
