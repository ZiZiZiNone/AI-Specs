#!/usr/bin/env python3
"""Hooks 适配器全生命周期单元测试（覆盖按需触发、零 Token 放行、只读拦截、测试水位线、COM-019 与按需写作/网文风格门禁）。"""
import concurrent.futures
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import adapter  # noqa: E402
import session_state as ss  # noqa: E402


class HooksAdapterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.sid = f"test-{id(self)}"
        p = ss.state_file_path(self.sid)
        if p.exists():
            p.unlink()

    def tearDown(self) -> None:
        p = ss.state_file_path(self.sid)
        if p.exists():
            p.unlink()

    def test_session_start_emits_compact_pointer_under_320_chars(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "go.mod").write_text("module demo\n", encoding="utf-8")
            code, out, err = adapter.dispatch({"session_id": self.sid, "cwd": tmp}, "SessionStart")
            self.assertEqual(code, 0)
            self.assertEqual(err, "")
            self.assertIn("backend/go", out)
            self.assertLess(len(out), 320)

    def test_read_only_mode_blocks_write_and_allows_read(self) -> None:
        code, out, _ = adapter.dispatch({"session_id": self.sid, "prompt": "帮我 Review 这段代码"}, "UserPromptSubmit")
        self.assertEqual(code, 0)
        self.assertIn("READ_ONLY", out)

        c1, o1, e1 = adapter.dispatch(
            {"session_id": self.sid, "tool_name": "Edit", "tool_input": {"file_path": "src/a.ts"}},
            "PreToolUse",
        )
        self.assertEqual(c1, 2)
        self.assertEqual(o1, "")
        self.assertIn("COM-012", e1)

        c2, o2, e2 = adapter.dispatch({"session_id": self.sid, "tool_name": "Read"}, "PreToolUse")
        self.assertEqual((c2, o2, e2), (0, "", ""))

    def test_post_edit_zero_token_on_pass_and_blocks_bad_import_with_circuit_breaker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            ok_file = Path(tmp) / "Good.vue"
            ok_file.write_text("import { api } from '@/services/api.ts';\n", encoding="utf-8")
            c_ok, o_ok, e_ok = adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(ok_file)}},
                "PostToolUse",
            )
            self.assertEqual((c_ok, o_ok, e_ok), (0, "", ""))

            bad_file = Path(tmp) / "Bad.vue"
            bad_file.write_text("import { api } from '../services/api';\n", encoding="utf-8")
            for _ in range(3):
                c_bad, o_bad, e_bad = adapter.dispatch(
                    {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(bad_file)}},
                    "PostToolUse",
                )
                self.assertEqual(c_bad, 2)
                self.assertEqual(o_bad, "")
                self.assertIn("FE-IMPORT", e_bad)
                bad_file.write_text(bad_file.read_text(encoding="utf-8") + "\n", encoding="utf-8")

            c_open, _, e_open = adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(bad_file)}},
                "PostToolUse",
            )
            self.assertEqual(c_open, 0)
            self.assertIn("CIRCUIT-OPEN", e_open)

    def test_stop_gate_blocks_untested_edits_and_passes_after_test_command(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "ok.py"
            f.write_text("x = 1\n", encoding="utf-8")
            adapter.dispatch({"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(f)}}, "PostToolUse")

            c1, _, e1 = adapter.dispatch({"session_id": self.sid}, "Stop")
            self.assertEqual(c1, 2)
            self.assertIn("FINAL-GATE", e1)

            adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Bash", "tool_input": {"command": "pytest -q"}, "exit_code": 0},
                "PostToolUse",
            )
            c2, o2, e2 = adapter.dispatch({"session_id": self.sid}, "Stop")
            self.assertEqual((c2, o2, e2), (0, "", ""))

    def test_pre_tool_blocks_protected_env_and_dangerous_bash(self) -> None:
        c1, _, e1 = adapter.dispatch(
            {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": "/app/.env.prod"}},
            "PreToolUse",
        )
        self.assertEqual(c1, 2)
        self.assertIn("COM-013", e1)

        c2, _, e2 = adapter.dispatch(
            {"session_id": self.sid, "tool_name": "Bash", "tool_input": {"command": "rm -rf /"}},
            "PreToolUse",
        )
        self.assertEqual(c2, 2)
        self.assertIn("COM-013", e2)

    def test_post_edit_blocks_tombstone_comment_fe005(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "svc.py"
            f.write_text("# 旧逻辑已删，保留占位\nx = 1\n", encoding="utf-8")
            c, _, e = adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(f)}},
                "PostToolUse",
            )
            self.assertEqual(c, 2)
            self.assertIn("FE-005", e)

    def test_adversarial_evasion_and_parallel_cli(self) -> None:
        adapter_path = str(Path(__file__).resolve().parent / "adapter.py")

        def run_cli(event: str, payload: dict | None, raw: str | None = None):
            inp = raw if raw is not None else json.dumps(payload, ensure_ascii=False)
            r = subprocess.run([sys.executable, adapter_path, "--event", event], input=inp, text=True, capture_output=True)
            return r.returncode, r.stdout, r.stderr

        c, _, e = run_cli("PostToolUse", None, raw="{bad json")
        self.assertEqual(c, 0)
        self.assertNotIn("Traceback", e)

        self.assertEqual(run_cli("PreToolUse", {"session_id": self.sid, "tool_name": "Bash", "tool_input": {"command": "rm -fr /tmp/x"}})[0], 2)
        self.assertEqual(run_cli("PreToolUse", {"session_id": self.sid, "tool_name": "Bash", "tool_input": {"command": "git push -f origin main"}})[0], 2)
        self.assertEqual(run_cli("PreToolUse", {"session_id": self.sid, "tool_name": "Bash", "tool_input": {"command": "git push --force-with-lease origin main"}})[0], 0)

        run_cli("UserPromptSubmit", {"session_id": self.sid + "-ro", "prompt": "帮我审计代码"})
        self.assertEqual(run_cli("PreToolUse", {"session_id": self.sid + "-ro", "tool_name": "Bash", "tool_input": {"command": "git checkout -- a.py"}})[0], 2)
        self.assertEqual(run_cli("PreToolUse", {"sessionId": self.sid + "-ro", "tool": "write_to_file", "input": {"TargetFile": "src/x.ts"}})[0], 2)

        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "a.py"
            f.write_text("x = 1\n", encoding="utf-8")
            run_cli("PostToolUse", {"session_id": self.sid + "-wm", "tool_name": "Write", "tool_input": {"file_path": str(f)}})
            run_cli("PostToolUse", {"session_id": self.sid + "-wm", "tool_name": "Bash", "tool_input": {"command": "echo pytest"}, "exit_code": 0})
            self.assertEqual(run_cli("Stop", {"session_id": self.sid + "-wm"})[0], 2)
            run_cli("PostToolUse", {"session_id": self.sid + "-wm", "tool_name": "Bash", "tool_input": {"command": "pytest -q"}, "exit_code": 1})
            self.assertEqual(run_cli("Stop", {"session_id": self.sid + "-wm"})[0], 2)
            run_cli("PostToolUse", {"session_id": self.sid + "-wm", "tool_name": "Bash", "tool_input": {"command": "pytest -q"}, "exit_code": 0})
            self.assertEqual(run_cli("Stop", {"session_id": self.sid + "-wm"}), (0, "", ""))

            files = [Path(tmp) / f"p{i}.py" for i in range(8)]
            for fp in files:
                fp.write_text("v = 1\n", encoding="utf-8")
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
                res = list(ex.map(lambda fp: run_cli("PostToolUse", {"session_id": self.sid + "-par", "tool_name": "Write", "tool_input": {"file_path": str(fp)}}), files))
            self.assertTrue(all(r == (0, "", "") for r in res))

    def test_stop_enforces_com019_and_allows_when_user_asks_details(self) -> None:
        adapter.dispatch({"session_id": self.sid, "prompt": "帮我看看结果怎么样"}, "UserPromptSubmit")
        c1, _, e1 = adapter.dispatch(
            {"session_id": self.sid, "last_assistant_message": "我先检查了 adapter.py 的正则，又跑了 unittest..."},
            "Stop",
        )
        self.assertEqual(c1, 2)
        self.assertIn("COM-019", e1)

        c2, o2, e2 = adapter.dispatch(
            {"session_id": self.sid, "last_assistant_message": "已完成检查，目前可以直接上线使用。"},
            "Stop",
        )
        self.assertEqual((c2, o2, e2), (0, "", ""))

        adapter.dispatch({"session_id": self.sid, "prompt": "详细展开一下你的排查过程和代码"}, "UserPromptSubmit")
        c3, o3, e3 = adapter.dispatch(
            {"session_id": self.sid, "last_assistant_message": "我先检查了文件...\n```python\n" + "x = 1\n" * 80 + "```"},
            "Stop",
        )
        self.assertEqual((c3, o3, e3), (0, "", ""))

    def test_writing_on_demand_routing_and_web_novel_style_gate(self) -> None:
        # 1. 非写作任务不激活 writing_genre，0 字节输出
        c0, o0, e0 = adapter.dispatch({"session_id": self.sid, "prompt": "帮我重构订单服务代码"}, "UserPromptSubmit")
        self.assertEqual((c0, o0, e0), (0, "", ""))

        # 2. 网文写作意图自动注入 1+1 极简路由指针
        c1, o1, e1 = adapter.dispatch({"session_id": self.sid, "prompt": "帮我写一章悬疑规则怪谈网文开篇"}, "UserPromptSubmit")
        self.assertEqual(c1, 0)
        self.assertEqual(e1, "")
        self.assertIn("writing=web-novel", o1)
        self.assertIn("writing/rules/web-novel.md", o1)

        # 3. 写入含网文烂梗的章节文件被硬阻断，改写为实感风格后零输出放行
        with tempfile.TemporaryDirectory() as tmp:
            ch = Path(tmp) / "ch1.md"
            ch.write_text("他嘴角勾起一抹不易察觉的弧度，眼中闪过一丝精芒，心中暗道此子断不可留。\n", encoding="utf-8")
            cb, _, eb = adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(ch)}},
                "PostToolUse",
            )
            self.assertEqual(cb, 2)
            self.assertIn("WR-NOVEL-CLICHE", eb)

            good_novel = (
                "巷口那盏煤油灯灭了。灯芯还冒着一丝呛鼻的焦烟，最多三息前刚被人掐灭。\n"
                "墙根的积水没动，风也没起，可肩胛骨突然像压了半扇湿透的生铁。\n"
                "林渊没回头，左手拇指抵住袖口里的铜钱。翻过去，今晚少睡两个时辰，右眼还会盲一刻钟。\n"
                "背后靴底蹭过青苔。两步。一步。他松手，铜钱落地，没有声音。\n"
            )
            ch.write_text(good_novel, encoding="utf-8")
            cp, op, ep = adapter.dispatch(
                {"session_id": self.sid, "tool_name": "Write", "tool_input": {"file_path": str(ch)}},
                "PostToolUse",
            )
            self.assertEqual((cp, op, ep), (0, "", ""))

            # 4. Stop 对话直出网文正文：不被 COM-019 误伤，且实感正文直接放行
            cs, os_, es = adapter.dispatch({"session_id": self.sid, "last_assistant_message": good_novel}, "Stop")
            self.assertEqual((cs, os_, es), (0, "", ""))

    def test_writing_report_and_copywriting_gates(self) -> None:
        # 报告模式拦截过程流水账 + AI 黑话
        adapter.dispatch({"session_id": self.sid, "prompt": "帮我写报告分析供应商方案"}, "UserPromptSubmit")
        c1, _, e1 = adapter.dispatch(
            {
                "session_id": self.sid,
                "last_assistant_message": "我先调研了三个供应商，综上所述，在当今数字化时代，通过全方位赋能与生态矩阵，本方案值得关注，后续我们可以继续推进各项落地细则与内部评审工作，确保整体进度可控。",
            },
            "Stop",
        )
        self.assertEqual(c1, 2)
        self.assertIn("WR-AI-SLOP", e1)

        # 营销文案拦截无数字支撑的空洞自夸
        adapter.dispatch({"session_id": self.sid, "prompt": "帮我写宣传稿推广新品"}, "UserPromptSubmit")
        c2, _, e2 = adapter.dispatch(
            {
                "session_id": self.sid,
                "last_assistant_message": "行业领先的全新办公利器正式亮相！我们为您带来极致办公体验，彻底颠覆传统工作方式，让您感受前所未有的顺滑与高效，欢迎立刻体验。",
            },
            "Stop",
        )
        self.assertEqual(c2, 2)
        self.assertIn("WR-GENRE-STRUCT", e2)



    def test_writing_adversarial_edge_cases(self) -> None:
        # 1. 自然口语路由全 6 类精准命中 + 编程任务零误触
        cases = [
            ("帮我写一篇关于重构代码的公众号文章", "article"),
            ("写一篇都市悬疑小说第一章", "web-novel"),
            ("起草一封给客户的延期邮件", "correspondence"),
            ("写一份产品使用文档", "documentation"),
            ("帮我写一份立项方案", "report"),
            ("起草一篇新品推广文案", "copywriting"),
            ("帮我重构一下这个 Python 脚本", None),
            ("修复登录接口 500 报错", None),
        ]
        for prompt, expected in cases:
            g, _ = adapter.detect_writing_genre(prompt)
            self.assertEqual(g, expected, f"route mismatch for: {prompt}")

        # 2. ignore 标记只豁免紧邻单块，不吞噬后续违规正文；零宽字符不可绕过
        wr = adapter.load_script_module("check_writing_adv", "check-writing.py")
        ignore_txt = "<!-- writing-check: ignore -->\n总而言之，在当今数字化时代。\n\n正文：总而言之，在当今数字化时代，全方位赋能。\n"
        self.assertTrue(any(r == "WR-AI-SLOP" for r, _ in wr.check_text(ignore_txt, "report")))
        zw_txt = "他嘴\u200b角勾起一抹不易察觉的弧度。"
        self.assertTrue(any(r == "WR-NOVEL-CLICHE" for r, _ in wr.check_text(zw_txt, "web-novel")))

        # 3. 网文 POV 过滤词过密 + 句长均质化拦截 + 高突发度实感长文放行
        pov_txt = "他心想今天不对劲。他感到背后发凉。他意识到有人跟踪。她觉得这里不能待了。"
        self.assertTrue(any(r == "WR-NOVEL-POV" for r, _ in wr.check_text(pov_txt, "web-novel")))

        uniform = "。".join([f"清晨的阳光缓缓照在青石板路上第{i:02d}步" for i in range(25)]) + "。"
        self.assertTrue(any(r == "WR-NOVEL-RHYTHM" for r, _ in wr.check_text(uniform, "web-novel")))

        varied = (
            "巷口那盏煤油灯灭了。灯芯还冒着呛鼻的焦烟，最多三息前刚被人掐灭，连灯罩上的余温都没散尽。\n"
            "墙根的积水没动。风也没起。可肩胛骨突然像压了半扇湿透的生铁，沉得人喘不上气。\n"
            "林渊没回头，左手拇指已经稳稳抵住袖口里那枚磨平了边缘的铜钱。这枚借命钱一天只能翻一次，翻过去，今晚少睡两个时辰，右眼还会盲一刻钟。\n"
            "背后靴底蹭过青苔。轻。慢。两步。一步。\n"
            "对方停住了。屋檐滴下一颗水珠，砸在泥地里，啪的一声，在死寂的巷子里响得像敲在耳膜上。\n"
            "他松手。铜钱落地。没有声音。下一瞬，他贴着湿滑的砖墙猛地矮身前滚，袖中半截剔骨刀反手向上一挑，刀尖精准刮过对方手腕外侧三寸处的旧伤。\n"
        )
        self.assertEqual(wr.check_text(varied, "web-novel"), [])

        # 4. 文档居高临下措辞拦截
        self.assertTrue(any(r == "WR-GENRE-STRUCT" for r, _ in wr.check_text("导出报表其实非常简单，只需轻松点击即可。", "documentation")))

if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(HooksAdapterTest)
    res = unittest.TextTestRunner(verbosity=2).run(suite)
    sys.exit(0 if res.wasSuccessful() else 1)
