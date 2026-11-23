# AI-Specs

AI 开发行为与工程规范库（v2.0），覆盖通用工程基线、前端（Vue 3 / 微信小程序）与后端（Go / PHP），配套可执行校验脚本与最小可运行参考切片。纯规范与校验库：不拷贝进业务项目源码，只被**引用**，接入方式见 `INTEGRATION.md`。

## 路径基准

本文件所在目录即规范库根，记作 `<SPEC_ROOT>`。

- 库内裸路径一律相对 `<SPEC_ROOT>` 解析，首段必为 `common/`、`frontend/`、`backend/`、`scripts/` 之一（根目录文件直接写文件名，如 `AGENTS.md`、`INDEX.md`、`INTEGRATION.md`）；
  例：`common/rules/naming.md` 指 `<SPEC_ROOT>/common/rules/naming.md`。
- 在业务项目中读取规范时拼成绝对路径 `<SPEC_ROOT>/...`；
  业务项目自己的 `README.md`／`AGENTS.md` 与本库同名文件是两回事，不要混用。

## 目录结构

```
<SPEC_ROOT>/
├── README.md        本文件：全局入口、路径基准、加载策略
├── AGENTS.md        AI 行为规则索引（FE-000 至 FE-005）与强制自检点
├── INTEGRATION.md   接入外部项目的四种方式、CI 接入与常见错误
├── INDEX.md         确定性检索入口（四大编号定义源 + 按需查阅）
├── common/          前后端通用：principles.md + rules/（含安全/可观测/AI防线/兼容）+ protocol/
├── frontend/        前端专属：rules/ protocol/ patterns/ anti-patterns/ tasks/ checklists/ frameworks/（含可运行 test/）examples/
├── backend/         后端专属：rules/（BE-101~108）go/ php/ 语言子树（含可运行 test/）+ patterns/ anti-patterns/ protocol/ tasks/ checklists/ examples/
├── scripts/         自动化校验门禁脚本与自测套件（check-all.py / check-citations.py / check-import-path.py / check-spec-integrity.py / check-security-hygiene.py）
└── .github/         CI 流水线模板（workflows/spec-ci.yml）
```

各目录 `README.md` 为入口，不逐文件展开。

## 加载策略

**必读四件**（任何任务开工前按序读完）：

1. `<SPEC_ROOT>/README.md`（本文）
2. `common/rules/constitution.md`（宪法：`COM-007` 至 `COM-018`）
3. `common/principles.md`（四条通用原则 + 极致解耦）
4. `common/protocol/task-boundary.md`（任务边界：授权面，先于"怎么做"）

其余**按需读取，禁止全量通读**：前端任务从 `frontend/README.md` 进语言子树；后端任务从 `backend/README.md` 与 `backend/rules/core-principles.md` 进语言子树；命中页面/读写/生产模式读对应 `patterns/`；遇决策点读对应端 `decision-trees.md`；写法拿不准读对应端 `examples/golden/`；事务规则读对应语言 `transaction.md`「规则」；完成后过对应 `checklists/` 与 `common/protocol/final-gate.md`。

## 工作流

定位库根 → 读必读四件 → 定任务类型与授权面（`common/protocol/task-analysis.md`、`common/protocol/task-boundary.md`）→ 按项目依赖判定技术栈并进入对应子树 → 按需取用 `patterns/` 与 `decision-trees.md` → 交付前过自检清单与 `common/protocol/final-gate.md`。
构建 / 类型检查 / 测试必须实际执行；执行不了则显式声明未验证项。
完整六步见 `INTEGRATION.md`「接入后的正确加载流程」。

## 安装与运行

校验脚本基于 Python 3.10+ 标准库（零第三方依赖），前端参考测试基于 Node.js 18+ 原生测试运行器（零第三方依赖）：

```bash
python3 scripts/check-all.py                           # 一键全量校验（引用 + 结构 + 安全基线 + 前端导入 + 参考测试 + 脚本自测）
python3 scripts/check-citations.py --strict            # COM-011 引用可验伪校验（严格模式）
python3 scripts/check-spec-integrity.py                # 规范库结构、编号定义源一致性与本机路径泄露检查
python3 scripts/check-security-hygiene.py <目标目录>    # COM-013/COM-017 通用安全基线扫描
python3 scripts/check-import-path.py <业务源码目录>     # 前端导入路径校验
python3 scripts/test-scripts.py                        # 校验脚本自身单元测试
```

改动规范后至少跑一次 `python3 scripts/check-all.py`，判据为全项 PASS（FAIL 0 且 WARN 0）。

## 配置

本库自身无运行时配置项。唯一环境相关值是 `<SPEC_ROOT>` 的取值：本机固定路径或业务项目内 `.ai-spec`（git submodule），见 `INTEGRATION.md`。
改名或迁移规范库时，须同步 `INTEGRATION.md` 的路径占位说明与仓库 URL、全局 `AGENTS.md` 的库根引用。

## 演化

发现缺口 → 提问 → 用户决策 → 更新规范 → 运行 `scripts/check-all.py` 验伪通过。
