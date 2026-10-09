# AI-Specs

AI 开发行为与工程规范库，覆盖前端与后端。纯文档库：不拷贝进业务项目，只被**引用**，接入方式见 `INTEGRATION.md`。

## 路径基准

本文件所在目录即规范库根，记作 `<SPEC_ROOT>`。

- 库内裸路径一律相对 `<SPEC_ROOT>` 解析，首段必为 `common/`、`frontend/`、`backend/` 之一；
  例：`common/rules/naming.md` 指 `<SPEC_ROOT>/common/rules/naming.md`。
- 在业务项目中读取规范时拼成绝对路径 `<SPEC_ROOT>/...`；
  业务项目自己的 `README.md`／`AGENTS.md` 与本库同名文件是两回事，不要混用。

## 目录结构

```
<SPEC_ROOT>/
├── README.md        本文件：全局入口、路径基准、加载策略
├── AGENTS.md        AI 行为规则索引（非规范正文）
├── INTEGRATION.md   接入外部项目的四种方式与常见接入错误
├── INDEX.md         确定性检索入口（编号定义源 + 按需查阅）
├── common/          前后端通用：principles.md + rules/ + protocol/
├── frontend/        前端专属：rules/ protocol/ patterns/ anti-patterns/ tasks/ checklists/ frameworks/ examples/
├── backend/         后端专属：go/ php/ 语言子树 + patterns/ protocol/ tasks/ checklists/ examples/
└── scripts/         引用与导入路径校验脚本
```

各目录 README 为入口，不逐文件展开。

## 加载策略

**必读四件**（任何任务开工前按序读完）：

1. `<SPEC_ROOT>/README.md`（本文）
2. `common/rules/constitution.md`（宪法）
3. `common/principles.md`（四条通用原则 + 极致解耦）
4. `common/protocol/task-boundary.md`（任务边界：授权面，先于"怎么做"）

其余**按需读取，禁止全量通读**：前端任务从 `frontend/README.md` 进语言子树；后端任务从
`backend/README.md` 进语言子树；命中页面/读写模式读对应 `patterns/`；遇决策点读对应端
`decision-trees.md`；写法拿不准读 `examples/golden/`；事务规则读对应语言 `transaction.md`「规则」；
完成后过对应 `checklists/` 与 `common/protocol/final-gate.md`。

## 工作流

定位库根 → 读必读四件 → 定任务类型与授权面（`common/protocol/task-analysis.md`、
`common/protocol/task-boundary.md`）→ 按项目依赖判定技术栈并进入对应子树 → 按需取用
patterns 与 decision-trees → 交付前过自检清单与 final-gate。
构建 / 类型检查 / 测试必须实际执行；执行不了则显式声明未验证项。
完整六步见 `INTEGRATION.md`「接入后的正确加载流程」。

## 安装与运行

无依赖、无构建产物、无运行时。校验脚本需 Python 3.10+：

```bash
python scripts/check-citations.py                  # 引用校验：退出码 0 通过，1 有 FAIL
python scripts/check-citations.py --strict         # WARN 也计为 FAIL
python scripts/check-import-path.py <业务源码目录>  # 导入路径校验，传业务项目的 src/ 等
```

改动规范后至少跑一次 `check-citations.py`；阶段收尾跑全部两项，判据为 FAIL 0 且 WARN 0。

## 配置

本库自身无配置项。唯一环境相关值是 `<SPEC_ROOT>` 的取值：本机固定路径或业务项目内
`.ai-spec`（git submodule），见 `INTEGRATION.md`。
改名或迁移规范库时，须同步 `INTEGRATION.md` 的路径与 URL、全局 `AGENTS.md` 的库根引用。

## 演化

发现缺口 → 提问 → 用户决策 → 更新规范。
