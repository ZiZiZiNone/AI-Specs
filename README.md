# AI Operating System

统一 AI 开发行为与工程规范，覆盖**前端与后端**。

## 路径基准

本文件所在目录即**规范库根**，记作 `<SPEC_ROOT>`。

- 本库所有文档中的裸路径**一律相对 `<SPEC_ROOT>` 解析，不是业务项目根**，
  且首段必为 `common/`、`frontend/` 或 `backend/` 三者之一（三分结构，见下）。
  例如 `common/rules/naming.md` 指 `<SPEC_ROOT>/common/rules/naming.md`。
- **列表与树形结构中**：顶层条目写 `<SPEC_ROOT>` 相对的完整路径；
  嵌套条目相对其父条目（形如目录树里的子文件）。引用时必须写完整路径。
- 在业务项目中应用本规范时，读取任何规范文件都拼成绝对路径 `<SPEC_ROOT>/...`；
  业务项目自己的 `README.md`／`AGENTS.md` 与本库同名文件是两回事，不要混用。

接入外部项目的方式见 `<SPEC_ROOT>/INTEGRATION.md`。

## 定位与核心思想

核心思想：
1. 让不同 AI 实现相同结构化开发
2. 利用能力优秀的 AI 实现"标准答案"，其他 AI 根据标准答案实现（模拟蒸馏 AI 开发方式）

核心哲学（跨端，正文见 `common/principles.md`）：
**薄入口、模块自治、逻辑外置、单向依赖**——四者的共同目标是**极致解耦**
（把单元搬到另一个宿主，不改内部代码即可工作）。

## 覆盖范围

| 子树 | 状态 | 说明 |
|---|---|---|
| `common/` | **可用** | 前后端通用：宪法、四条通用原则、接口契约、命名 / 注释 / 测试 / 重构 / 复用 / 性能 / 业务规则 / 项目 README 规范、任务边界与验收协议 |
| `frontend/` | **可用** | Vue 3 与微信小程序；含 `frontend/rules/`、`frontend/protocol/`、`frontend/patterns/`、`frontend/anti-patterns/`、`frontend/tasks/`、`frontend/checklists/`、`frontend/examples/`、`frontend/frameworks/` |
| `backend/` | **可用** | 导航入口、共用分层原则、语言子树（`backend/go/`、`backend/php/`）、`backend/tasks/` 输出模板、`backend/checklists/` 自检清单、决策协议、标准模式、反模式、自包含示例 |

后端任务按 `common/` 通用规范、`backend/README.md` 的共用分层原则与对应语言子树执行；遇到框架专属决策点应提问而非自行发挥（COM-007）。

## 目录结构

```
<SPEC_ROOT>/
├── README.md            本文件：全局入口、路径基准、覆盖范围、加载策略、使用说明
├── AGENTS.md            行为规则（AI 行为约束，非规范正文）
├── INTEGRATION.md       接入外部项目的四种方式与常见接入错误
├── INDEX.md               确定性检索入口（编号定义源 + 按需查阅）
├── common/              前后端通用规范（见 common/README.md）
│   ├── principles.md    四条通用原则 + 极致解耦总纲
│   ├── rules/           宪法、接口契约、命名、注释、测试、重构、复用、性能、业务规则、项目 README
│   └── protocol/        任务边界、任务类型判定、需求完整性、最终闸门
├── frontend/            前端专属规范（见 frontend/README.md）
│   ├── rules/           FE-101 至 FE-104 前端落地、架构分层、状态、接口、错误、异步、UI、表单、样式、TS、导入路径
│   ├── protocol/        实现顺序、决策树
│   ├── patterns/        列表 / 表单 / 详情 / 权限 / 表格 / 上传标准模式
│   ├── anti-patterns/   胖页面 / 全局化 / 万能工具库 / 隐藏副作用 / 巨型组件
│   ├── tasks/           Feature / Bugfix / Refactor / Review 输出模板
│   ├── checklists/      self-check、detailed-check（16 章）
│   ├── frameworks/      vue3/、miniprogram/（各自含 ui/<组件库>/）
│   └── examples/        示例与风格指南（golden，自包含）
├── backend/             后端专属规范（见 backend/README.md）
│   ├── README.md        导航入口：共用分层原则、主题文件清单、现有技术栈
│   ├── go/              Go 语言级主题 + goframe/ 框架差异 + test/ 可运行样例
│   ├── php/             PHP 语言级主题 + laravel/ 框架差异 + test/ 可运行样例
│   ├── protocol/        决策流程图
│   ├── patterns/        列表查询 / 创建幂等 / 多表写事务标准模式
│   ├── anti-patterns/   胖控制器 / 全局数据访问 / 万能服务 / 仓储越界与对策
│   ├── examples/        自包含示例与负向示例集（golden，自包含）
│   ├── tasks/           后端任务输出模板
│   └── checklists/      后端自检清单
└── scripts/             引用校验脚本（见下「校验脚本」）
```

目录树仅列骨架，目录内 README 为入口，不逐文件展开；如存在 `.internal-docs/`，则为过程留痕，不受规范约束，检索时排除。

## 加载策略

**必读四件**（任何任务开工前，按序读完，不得跳过）：

1. `<SPEC_ROOT>/README.md`（本文）
2. `common/rules/constitution.md`（宪法）
3. `common/principles.md`（四条通用原则 + 极致解耦）
4. `common/protocol/task-boundary.md`（任务边界：授权面与消费者判据；决定"该不该做"，先于"怎么做"）

**按需读取**（按任务落在哪棵树取用，禁止全量通读）：

| 任务 | 追加读取 |
|---|---|
| 前端 | `frontend/README.md` → 判定出的语言子树（`frontend/frameworks/vue3/` 或 `frontend/frameworks/miniprogram/`）→ 其 `ui/<组件库>/` 二级目录 |
| 后端 | `backend/README.md` → 判定出的语言子树与其框架二级目录 |
| 命中页面/接口模式 | `frontend/patterns/` |
| 命中后端读写类型 | `backend/patterns/` |
| 遇决策点 | `frontend/protocol/decision-trees.md` |
| 遇后端分层/事务/重试/复用决策点 | `backend/protocol/decision-trees.md` |
| 拿不准写法 | `frontend/examples/golden/` |
| 拿不准后端写法 | `backend/examples/golden/` |
| 事务/迁移 | 对应语言 `backend/go/transaction.md` 或 `backend/php/transaction.md`「规则」 |
| 实现完成后 | 对应子树的自检清单（前端：`frontend/checklists/`；后端：`backend/checklists/`）、`common/protocol/final-gate.md` |

## 工作流

1. **定位库根** —— 拿到 `<SPEC_ROOT>` 绝对路径
2. **读必读四件** —— 见上「加载策略」
3. **定任务类型与授权面** —— `common/protocol/task-analysis.md` 判类型，
   `common/protocol/task-boundary.md` 定授权面
4. **判定技术栈并进入对应子树** —— 读项目依赖（`package.json` / `composer.json` / `go.mod`）：
   前端 → `frontend/`；后端 → `backend/`；无对应目录时仅遵循 `common/` 通用规范，
   **不套用其他技术栈的规则**
5. **按需取用模式与决策** —— 对应端 patterns 与 decision-trees（前端：`frontend/patterns/`、`frontend/protocol/decision-trees.md`；后端：`backend/patterns/`、`backend/protocol/decision-trees.md`）
6. **交付前验收** —— 过对应子树的自检清单（前端：`frontend/checklists/`；后端：`backend/checklists/`）与 `common/protocol/final-gate.md`。
   **构建 / 类型检查 / 测试必须实际执行**；执行不了则显式声明未验证项，
   不得以"代码已写完"当作完成

## 安装

本库为**纯文档库**，无依赖、无构建产物。

- **前置**：仅「校验脚本」需要 Python 3.10+（本机实测 3.11.15）。
- **获取**：本库不拷贝进业务项目，按 `INTEGRATION.md` 的任一方式**引用**即可，无需安装步骤。
- 业务项目自身的前置依赖（运行时版本、系统依赖）由该项目根 `README.md` 负责记录，
  要求见 `common/rules/readme.md`。

## 配置

本库自身**无配置项**（无 `.env`、无配置文件）。

唯一与环境相关的是 `<SPEC_ROOT>` 的取值：

| 部署方式 | `<SPEC_ROOT>` 取值 |
|---|---|
| 本机固定路径 | `C:\Users\HKX\Desktop\AI-Operating-System-v4.0` |
| git submodule | 业务项目内 `.ai-spec` |

各方式的完整接入片段见 `INTEGRATION.md`。

## 运行

本库**无运行时**，不启动任何服务。可执行的只有校验脚本：

```bash
# 引用可验伪校验（COM-011）：条款级编号、位置式引用、引文逐行比对
python scripts/check-citations.py            # 退出码 0 通过，1 有 FAIL
python scripts/check-citations.py --strict   # WARN 也计为 FAIL

# 导入路径校验（frontend/rules/import-path.md 的可执行形态）
python scripts/check-import-path.py <业务源码目录>   # 业务项目传入自家 src/ 或 miniprogram/，例：python scripts/check-import-path.py ./src
```

## 开发到生产的配置与部署变化

本库无环境差异（不区分开发 / 生产配置），"部署"即**选择接入方式并更新引用路径**：

| 项 | 开发（本机） | 生产 / 团队 |
|---|---|---|
| 引用方式 | 本机固定路径，改规范立即生效 | git submodule（`.ai-spec`），版本可锁 |
| 同步方式 | 无需同步 | 需手动 `git submodule update --remote` |
| 变更影响面 | 仅本机 | 所有已接入项目 |

**改名或迁移规范库时**：须同步 `INTEGRATION.md` 的路径与 URL、全局 `AGENTS.md` 的库根引用，
并重新打开工作区。回滚方式：`git reset --hard <上一个提交>`（本库只做本地操作）。

## 测试

本库**无单元测试**（非代码库）。替代验证手段是上述两个校验脚本，
外加「引用可达性」自查：

- 判据：`check-citations.py --strict` 输出 **FAIL 0 且 WARN 0**；`check-import-path.py` 输出 **FAIL 0**。
- 数字（文件数、引用数）会随新增文件变化，**不作为判据**。
- 改动规范后至少跑一次 `check-citations.py`；阶段收尾必须跑全部两项。

## 常见问题

| 现象 | 原因 | 处理 |
|---|---|---|
| AI 找不到库，凭训练知识编了一套"规范" | 只写了"遵循 XX 规范"没给绝对路径 | 必须给 `<SPEC_ROOT>` 绝对路径 |
| AI 读到了业务项目自己的 README | 用了裸路径 `README.md` | 写全 `<SPEC_ROOT>/README.md` |
| AI 以为读完 `AGENTS.md` 就完事 | `AGENTS.md` 只是行为规则索引 | 入口必须是 `README.md`，它才有模块导航 |
| 上下文被规范占满 | 让 AI"先通读规范库" | 按「加载策略」按需读 |
| 两套规范混用 | 业务项目已有冲突约定未声明 | 按 `common/rules/constitution.md`「用户明确要求优先于本规范」先说明冲突，由用户决定优先级 |
| `check-citations.py --strict` 报错 | 早期版本把 `--strict` 当路径解析 | 已修复；如仍报错请确认脚本为最新版本 |

更多接入错误见 `<SPEC_ROOT>/INTEGRATION.md`「常见接入错误」。

## 决议备忘

| 项 | 影响面 | 状态 |
|---|---|---|
| 条款级编号方案：若引入新编号，须同步 COM-011 细则 | 条款级两处（COM-007 至 COM-012、FE-000 至 FE-005）加编号小节例外（FE-101 至 FE-104） | 已定 |

## 演化

发现缺口 → 提问 → 用户决策 → 更新规范。
