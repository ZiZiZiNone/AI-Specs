# 交接文档

**用途**：把「本库扩为全栈（新增 PHP / Go 后端规范）」的全部决策与进度交接给下一个会话或另一位 AI。
**时点**：2026-09-20。**失效条件**：阶段②③④ 全部完成后本文件作废，应删除或移入 `.internal-docs/`。

---

## 一、原始需求

补充 **PHP 开发规范**与 **Go 后端开发规范**，围绕 12 个方面：项目目录结构、命名约定、代码风格与格式化、
错误处理、日志记录、依赖管理、配置管理、注释与文档、单元测试、接口设计、并发处理、性能与安全；
结合两种语言各自的生态与最佳实践，输出结构化、条目清晰的规范文档。

补充要求（会话中陆续加入，均为强制）：

1. 所有规范必须遵守**与前端同等的极致解耦**（P2/P3 强度）。
2. 开发时需在**项目根目录 README.md** 完整记录人工操作说明：目录结构及用途、开发到生产的配置与部署变化、
   TODO、安装 / 配置 / 运行 / 常见问题。
3. 所有变更结束后**启动 5 个子代理严格审核**；这是规范级项目，不可怠慢。
4. 可用 `C:\Users\HKX\Desktop\Guard-AI` 做检查。

用户既有自定义规范（全程有效）：

- 只允许本地 git 操作，**禁止任何影响线上仓库的命令和行为**。
- 禁止损坏操作，所有危险操作必须可恢复。
- 禁止自动打开侧边栏预览。

---

## 二、决策记录（已全部确认，不得重新讨论）

### A 定位与归属

| 项 | 结论 |
|---|---|
| 库定位 | 从纯前端扩为**全栈** |
| 结构 | **彻底三分**：`common/`（前后端通用）+ `frontend/`（前端专属）+ `backend/`（后端专属） |
| 路径基准 | 裸路径相对 `<SPEC_ROOT>` 解析，**首段必为 `common/` / `frontend/` / `backend/`**；列表与树形结构中，**顶层条目写完整路径，嵌套条目相对其父条目** |
| 库名 | 本机目录与库名改为 **`AI-Operating-System-v4.0`** |
| 远程仓库 | **不改**（受"禁止影响线上仓库"约束），仍为 `Frontend-AI-Operating-System.git` |
| 改名时机 | 内容全部完成后作为**最后一步**，先本地 commit 作恢复点 |

### B 技术栈

| 项 | 结论 |
|---|---|
| 组织方式 | **语言级通用 + 框架二级目录**（对齐既有"通用 rules + 框架专属 frameworks"的两层设计） |
| PHP | 语言级通用 + **Laravel 13**（当前 v13.32.0，2026-09-15；要求 PHP 8.3+） |
| Go | 语言级通用 + **GoFrame v2.10.3**（2026-08-26） |
| 选型判据 | 选框架看**架构适配性**，不是"本机已在用"。GoFrame 的官方目录规范与本库 Logic/Service 概念同名同义；Gin 只是路由层，选它会把规范从"约束既有约定"退化为"设计新约定"，与 C4 冲突 |
| 本机项目 | **不作为规范定型基准**（用户明确：做得不够好）。仅作生态事实证据 |

### C 组织粒度

| 项 | 结论 |
|---|---|
| 文件粒度 | 每语言 **一主题一文件**（13 个 + README），与 `common/rules/` 粒度一致，保证按需读取精度 |
| 框架目录 | **只写该框架真正引入差异的主题**，不凑齐 13 个（避免 C6 装饰性产物） |
| 不对称 | **允许**：Go 建 `concurrency.md`；PHP 不建（README 写明原因） |
| 接口设计 | **上提到 `common/`** 供前后端共用（HTTP 契约、业务错误码、分页、幂等、版本化） |

### D 与既有通用规则的关系

**`common/rules/`** 收：`constitution.md`、`naming.md`、`comment.md`、`test.md`、`refactor.md`、
`reusability.md`、`performance.md`、`business-rule.md`、`readme.md`。

**`common/protocol/`** 收：`task-boundary.md`、`task-analysis.md`、`requirement-completeness.md`、
`final-gate.md`。

**灰色地带**（原则通用、示例前端）：`naming.md`、`test.md`、`reusability.md`、`business-rule.md`
——采用 **common 放抽象原则 + 两侧各放落地形态**，措辞泛化（组件 / Hook → 模块 / 函数）。
阶段①已完成泛化；`common/protocol/final-gate.md` 与 `task-analysis.md` 亦已解除前端绑定。

**`frontend/`**（前端专属）：其余 12 个规则、`frontend/protocol/implementation-order.md`、
`frontend/protocol/decision-trees.md`、`frontend/checklists/`、`frontend/tasks/` 输出模板与评分维度、
`frontend/frameworks/`、`frontend/patterns/`、`frontend/anti-patterns/`、`frontend/examples/`、
`frontend/test/`。

**P1–P4**：抽象为 `common/principles.md` 的**四条通用原则**（薄入口 / 模块解耦 / 逻辑解耦 / 单向依赖），
`frontend/rules/core-principles.md` 保留 P1–P4 前端落地与行数标准，`backend/` 写后端映射。
**`common/principles.md` 不引入新的条款级 ID**——C5 规定条款级 ID 只存在于
`common/rules/constitution.md` 的 C1–C6 与 `AGENTS.md` 的 B0–B5，引入新 ID 会使 C5 自相矛盾。

**后端 `tasks/` 与 `checklists/`**：**全建**（`backend/tasks/` 输出模板 + `backend/checklists/` 自检清单）。

### E 验证与交付

| 项 | 结论 |
|---|---|
| 样例工程 | **只建 Go 样例**（Go 1.25.7 可用，须实跑 `go build` + `go test`）。PHP 样例不建：本机 Composer 不可用 |
| PHP 未验证声明 | 按 `common/protocol/final-gate.md`「无法验证时的处理」声明未验证项 + 给补跑命令 |
| 全局文件 | 已授权修改工作区外 `C:\Users\HKX\AGENTS.md`（扩触发条件覆盖后端 + 同步库根新名） |
| 交付分期 | **四阶段，逐阶段验收** |

---

## 三、阶段划分与验收口径

| 阶段 | 范围 | 验收口径 | 状态 |
|---|---|---|---|
| **①** | 三分结构重构 + `common/` 迁移 + 根三件更新 + 校验脚本修路径 | 无残留旧路径；引用均可达；两个校验脚本通过 | ✅ 已完成（`a6d116a`）+ 审核修复（见第四节） |
| **②** | ① 在 `common/rules/` 下新建 `api-contract.md`（**接口设计**：HTTP 契约、业务错误码、分页、幂等、版本化）② `backend/go/`（语言级 13 文件 + `backend/go/goframe/` 差异文件）③ `backend/go/test/` 样例工程 | `go build` + `go test` 实跑通过；引用可达 | 待做 |
| **③** | `backend/php/`（语言级 13 文件 + `backend/php/laravel/` 差异文件）+ `backend/tasks/` + `backend/checklists/` | 引用可达；PHP 样例缺失按 `final-gate` 声明 | 待做 |
| **④** | 本机目录改名 `AI-Operating-System-v4.0` + 同步 `INTEGRATION.md` 与全局 `AGENTS.md` | 改名后无旧路径残留；全局入口可用 | 待做 |

**每阶段收尾必须**：① 过对应自检；② 跑 `scripts/check-citations.py`（须 FAIL 0）；
③ 本地 commit 作恢复点；④ **启动子代理审核**（用户要求 3），审核通过后再提交。

---

## 四、阶段①完成情况（含证据）

**变更规模**：184 个文件（167 rename + 8 add + 6 modify + 3 delete——3 个 `D` 为 git 重命名配对假象，
目标位置文件均在，正文逐字一致）。**全库 63 个文件、604 处路径引用改写**。

**新增文件**：

| 文件 | 内容 |
|---|---|
| `common/principles.md` | 四条通用原则 + 极致解耦总纲（无条款级 ID） |
| `common/README.md` | 通用树入口与必读四件 |
| `common/rules/readme.md` | **项目 README 规范**（用户新增要求 2 的固化） |
| `frontend/README.md` | 前端树入口、框架判定、工作流 |
| `backend/README.md` | 后端导航入口：共用分层原则、13 主题文件清单、计划技术栈 |

**5 路子代理审核**（用户要求 3）发现 10 项真问题，已全部修复：

| # | 位置 | 问题 | 修复 |
|---|---|---|---|
| A1 | `frontend/README.md` | 5 处旧前缀引用不可达 | 已改为完整路径 |
| A2 | `common/protocol/task-boundary.md` | 裸路径 `rules/` | 已改为对应子树完整路径 |
| A3 | `common/rules/constitution.md` | C5 编号例外清单漂移（缺 3 个文件） | **改为可执行判定式，不再维护清单** |
| A4 | `common/rules/` 5 个文件 | 措辞未泛化（组件 / PascalCase / DOM 等） | 已泛化为按端表述 |
| A5 | `common/protocol/final-gate.md`、`task-analysis.md` | 通用协议绑死前端（只指 `frontend/checklists/`、`npm`） | 已泛化，附各端验证命令示例 |
| A6 | `scripts/check-citations.py` | `--strict` 崩溃；docstring 转义告警 | 已修（跳过 `-` 开头参数；docstring 改 raw） |
| A7 | 本文件 | 接口设计规范未排入任何阶段 | 已排入阶段② |
| A8 | `README.md`、`INTEGRATION.md` | 三处描述互相矛盾（远程仓库改名、`backend/` 状态） | 已统一 |
| A9 | 本文件 | 验收证据不可复现 | 已改为可复现口径（见下） |
| A10 | `README.md` | 根 README 不遵守自己定的 README 规范 | 已补安装 / 配置 / 运行 / 部署变化 / 测试五节 |

**审核确认无问题项**：零文件丢失（177→177，缺失 0）、内容无损（169/177 文件正文逐字未改）、
`node_modules` 未被触碰、条款级 ID 无编造、必读四件一致、子目录清单逐一对应。

**验收证据（可复现，跑于 2026-09-20）**：

```bash
python scripts/check-citations.py          # 期望 FAIL 0、WARN 0
python scripts/check-import-path.py        # 期望 FAIL 0（61 个文件）
```

| 检查 | 结果 |
|---|---|
| 引用可达性 | 可达 586 处；2 处"缺失"经两路独立复核确认均为**检查器误报**（`frontend/checklists/detailed-check.md` 的散文举例「temp/common/data」；`frontend/test/vue/SPEC-GAPS.md` 的否定陈述「最终未新建 …/tailwind.md」） |
| `check-citations.py` | FAIL 0，WARN 0 |
| `check-import-path.py` | 61 个文件，FAIL 0 |
| 空目录 | 无 |

文件数与引用数会随阶段②③新增文件而变化；**判据是 FAIL 0 / WARN 0，不是具体数字**。

**未验证项**：无 PHP 侧验证（Composer 不可用）；阶段①未产生可执行代码，故无需构建验证。

---

## 五、跨切面硬约束（写后端规范时必须遵守）

**极致解耦**（用户要求 1）不是"分层清晰"的同义词。判定方式：把单元搬到另一个宿主
（另一个页面 / 另一个 HTTP 入口 / 一个单测），不改内部代码能否直接工作？

| 层 | GoFrame（Go） | Laravel（PHP） |
|---|---|---|
| 入口 | controller 只做参数绑定 + 校验 + 调 logic + 返回，**无业务判断** | controller 薄：FormRequest 校验 + 调 Service + Resource 返回 |
| 业务 | logic 承载业务；**不依赖 `*ghttp.Request`**，**不直接 `g.DB()`**，可脱 HTTP 单测 | Service 承载业务；**不依赖 Request/Response**，可单测 |
| 数据 | dao 只做数据访问；service 层只放 interface | Repository 只做数据访问；**Model 不做业务** |
| 依赖 | 只能向下 `controller → logic → service → dao` | 只能向下 `Controller → Service → Repository → Model` |
| 反向禁令 | 禁止 logic 调 controller、dao 调 logic | 禁 Facade / `app()` 隐藏依赖（用构造函数注入）、禁 Model 调 Service |

**项目 README 规范**（用户要求 2）已固化为 `common/rules/readme.md`，后端规范不得与之冲突。

---

## 六、已核实的关键事实（勿凭记忆改动）

| 事实 | 值 | 来源 |
|---|---|---|
| Laravel | v13.32.0（2026-09-15） | GitHub Releases API |
| GoFrame | v2.10.3（2026-08-26） | GitHub Releases API |
| Gin | v1.12.0 | GitHub Releases API |
| Kratos / go-zero | v3.0.0 / v1.10.3 | GitHub Releases API |
| Go 语言 | 最新 1.26（2026-02）；**本机 1.25.7** | go.dev |
| PHP | **本机 8.4.7** | `php -v` |
| Composer | **不可用**（`Could not open input file: .../composer.phar`） | 实跑 |
| 全局入口 | `C:\Users\HKX\AGENTS.md` 含库根引用，触发条件目前仅覆盖前端，**阶段④须扩为覆盖后端** | 实读 |

**本机在用后端项目**（仅作生态证据，不作定型基准）：`yzt-charging-next/app-backend`、
`yzt-charging-next/ins-backend`、`yzt-charging-next/iot-bridge`、
`agricultural-platform-expansion/backend`（GoFrame）；`yz-website/backend`（PHP 8.4 无框架，
已有 PSR-12 + PrettyPHP 的 `format.sh`，可作"代码风格与格式化"章节的现实锚点）。

---

## 七、残留待决策项

1. **条款级 ID 方案**：若 `common/principles.md` 或 `backend/` 引入新 ID，
   `common/rules/constitution.md` 的 C5 细则（「本库仅 C1-C6 与 B0-B5 有条款级 ID」）须同步更新。
   当前决策：**不引入**。
2. **各语言 13 个主题文件的确切文件名**：`backend/README.md` 已给出建议清单，阶段②③开工时定稿。
3. **`backend/tasks/` 与 `backend/checklists/` 的章节结构**：`frontend/checklists/detailed-check.md`
   为 16 章且全部前端专属，后端需重写而非套用。
4. **`SPEC-GAPS.md` 是否应被改写**：该文件为时点快照，`check-citations.py` 排除它"不追溯改写"，
   但阶段①仍改写了其内的路径前缀（为保持可导航）。如需还原为历史原文，请告知。
5. **`scripts/check-import-path.py` 是否移入 `frontend/scripts/`**：它是前端专属工具，
   与 `frontend/rules/import-path.md` 配对；当前仍在根 `scripts/`。

---

## 八、可直接粘贴的交接提示词

复制以下整段给新会话（含代码围栏内的内容）：

```text
继续「AI Operating System」规范库的全栈化改造。

库根 = C:\Users\HKX\Desktop\Frontend-AI-Operating-System-v3.0-Final-1（记作 <SPEC_ROOT>；
计划在最后一步改名为 AI-Operating-System-v4.0，远程仓库名不改）。

第一步：读 <SPEC_ROOT>/HANDOVER.md —— 里面是全部已确认决策、阶段划分、验收口径、
已核实事实与残留待决策项。按它执行，不要重新讨论已决策项。

然后读必读四件：README.md、common/rules/constitution.md、common/principles.md、
common/protocol/task-boundary.md。

当前进度：阶段①（三分结构重构 + common/ 迁移）已完成、已过 5 路子代理审核并修复 10 项问题。
接下来执行阶段②：① 在 common/rules/ 下新建 api-contract.md（接口设计规范）；
② 建立 backend/go/（语言级通用 13 个主题文件 + backend/go/goframe/ 框架差异文件）；
③ 建立 backend/go/test/ 样例工程并实跑 go build 与 go test。

强制约束：
- 后端规范必须遵守与前端同等的极致解耦（逻辑单元不接收 HTTP 对象、不自己取数据库连接、
  不依赖全局单例、可脱离宿主单测）。
- 只允许本地 git 操作，禁止任何影响线上仓库的命令与行为。
- 禁止损坏操作，所有危险操作必须可恢复。
- 禁止自动打开侧边栏预览。
- 规范库内裸路径相对 <SPEC_ROOT> 解析，首段必为 common/ | frontend/ | backend/。
- 引用规范条款前打开原文核对；本库仅 C1-C6 与 B0-B5 有条款级 ID；
  引用编号小节前先跑 grep -nE "^#{2,4} *(P[1-4]|[0-9]+\.)" <目标文件> 确认。

阶段②收尾必须：跑 python scripts/check-citations.py（须 FAIL 0、WARN 0）、
实跑 go build 与 go test、启动子代理审核、本地 commit 作恢复点。
全部阶段完成后执行改名收尾。
```
