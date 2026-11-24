#!/usr/bin/env python3
"""规范门禁脚本自身的单元测试套件（零外部依赖 unittest）。"""
import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent


def load_mod(name: str, filename: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS_DIR / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


citations = load_mod("check_citations", "check-citations.py")
import_path = load_mod("check_import_path", "check-import-path.py")
security = load_mod("check_security_hygiene", "check-security-hygiene.py")


class GovernanceScriptsTest(unittest.TestCase):
    def test_citations_catches_fake_id_broken_link_and_bad_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp)
            (p / "common/rules").mkdir(parents=True)
            (p / "frontend/rules").mkdir(parents=True)
            (p / "backend/rules").mkdir(parents=True)
            (p / "AGENTS.md").write_text("FE-000\n", encoding="utf-8")
            (p / "common/rules/constitution.md").write_text("# 宪法\n## 核心条款\nCOM-007\n", encoding="utf-8")
            (p / "frontend/rules/core-principles.md").write_text("## FE-101 原则\n", encoding="utf-8")
            (p / "backend/rules/core-principles.md").write_text("## BE-101 原则\n", encoding="utf-8")
            (p / "sample.md").write_text(
                "引用未定义编号 COM-999 和 BE-999\n"
                "断链：common/rules/not-exist.md\n"
                "错误章节：common/rules/constitution.md「不存在的标题」\n"
                '行内伪造引文：common/rules/constitution.md："这是一段完全不存在的编造引文内容"\n',
                encoding="utf-8",
            )
            _, fails, warns, _ = citations.check_repo(tmp, strict=True)
            self.assertTrue(any("COM-999" in x for x in fails))
            self.assertTrue(any("BE-999" in x for x in fails))
            self.assertTrue(any("not-exist.md" in x for x in fails))
            self.assertTrue(any("不存在的标题" in x for x in warns))
            self.assertTrue(any("行内引文" in x for x in warns))

    def test_import_path_ignores_block_comment_and_catches_relative(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "a.ts"
            p.write_text(
                "/*\nimport foo from './ignored.ts'\n*/\n"
                "import ok from '@/utils/fmt.ts'\n"
                "import badRel from './rel.ts'\n"
                "import badNoExt from '@/utils/noext'\n",
                encoding="utf-8",
            )
            checked, fails = import_path.scan_dir(tmp)
            self.assertEqual(checked, 1)
            self.assertEqual(len(fails), 2)
            self.assertTrue(any("./rel.ts" in f["spec"] for f in fails))
            self.assertTrue(any("@/utils/noext" in f["spec"] for f in fails))

    def test_security_hygiene_detects_secrets_and_respects_ignore(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "app.ts"
            p.write_text(
                'const api_secret = "super_real_secret_value_12345"\n'  # security-hygiene: ignore
                'el.innerHTML = userInput\n'
                'el.innerHTML = safeHtml // security-hygiene: ignore\n',
                encoding="utf-8",
            )
            checked, findings = security.scan_security(tmp)
            self.assertEqual(checked, 1)
            self.assertEqual(len(findings), 2)
            rules = {f["rule"] for f in findings}
            self.assertEqual(rules, {"SEC-004", "SEC-006"})


    def test_check_skills_catches_missing_fallback(self):
        import subprocess
        with tempfile.TemporaryDirectory() as tmp:
            t = Path(tmp)
            (t / "skills").mkdir()
            (t / "skills" / "README.md").write_text("# Skills\n路径基准\n", encoding="utf-8")
            (t / "skills" / "registry.json").write_text(
                '{"policy":{"skip_when_user_skill_specified":true,"single_match":"auto_use","multi_match":"ask_with_default","no_response_or_denied_fallback":"default_optimal","prefer_order":["local","bundled","remote"],"local_search_dirs":[]},"domains":{"bad":{"intent_patterns":["test"],"default_optimal":"x","fallback_bundled":"missing","skills":[{"id":"x","source":"remote","repo":"a/b","url":"https://example.com","install":"npx","summary":"s"}]}}}',
                encoding="utf-8",
            )
            res = subprocess.run([sys.executable, str(Path(__file__).resolve().parent / "check-skills.py"), str(t)], capture_output=True, text=True)
            self.assertNotEqual(res.returncode, 0)
            self.assertIn("fallback_bundled", res.stdout)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(GovernanceScriptsTest)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
