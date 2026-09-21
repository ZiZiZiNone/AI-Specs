# 接入外部项目

本规范库不拷贝进业务项目，只被业务项目**引用**。以下方式任选，可叠加。

`<SPEC_ROOT>` 指规范库根目录，取值随部署方式变化：

| 部署方式 | `<SPEC_ROOT>` 取值 | 适用 |
|---|---|---|
| 本机固定路径 | `C:\Users\HKX\Desktop\AI-Operating-System-v4.0` | 单机多项目共用，改规范立即生效 |
| git submodule | 业务项目内 `.ai-spec` | 团队共享、跨机器、版本可锁 |

移动规范库或换机器后，把下文所有 `<SPEC_ROOT>` 替换为新取值。

---

## 路径基准（接入前必读）

- 库内裸路径**相对 `<SPEC_ROOT>` 解析**，首段必为 `common/`、`frontend/` 或 `backend/`。
  写成 `rules/xxx.md` 这类只有二级路径的形式**不可解析**，正确形式是 `common/rules/xxx.md`。
- 列表与树形结构中，顶层条目为完整路径，嵌套条目相对其父条目；引用时必须写完整路径。

---

## 方式一：业务项目的 AGENTS.md（推荐，作用域最准）

在业务项目根的 `AGENTS.md`（或 `CLAUDE.md`）**顶部**粘贴：

```markdown
## 开发规范（外部规范库，强制）

本项目的前端与后端开发**必须**遵循外部规范库，库根绝对路径：

    C:\Users\HKX\Desktop\AI-Operating-System-v4.0

记作 `<SPEC_ROOT>`。**写任何代码之前**，按顺序读完这四个文件，不得跳过：

1. `<SPEC_ROOT>/README.md` —— 全局入口、路径基准、覆盖范围、加载策略
2. `<SPEC_ROOT>/common/rules/constitution.md` —— 宪法
3. `<SPEC_ROOT>/common/principles.md` —— 四条通用原则 + 极致解耦
4. `<SPEC_ROOT>/common/protocol/task-boundary.md` —— 任务边界（授权面：只读/定向写/开放写）

规范库采用三分结构：`common/`（前后端通用）、`frontend/`（前端专属）、`backend/`（后端专属）。
库内裸路径**相对 `<SPEC_ROOT>` 解析**，首段必为三者之一，读取时拼成 `<SPEC_ROOT>/common/...` 形式。
其余文件按 README 的「加载策略」按需读取，禁止全量通读。

规范与本项目现有代码风格冲突时，按 `common/rules/constitution.md`「用户明确要求优先于本规范」先说明冲突再执行，不得自行取舍。
```

为什么放顶部：AGENTS.md 由工具自动注入上下文，越靠前越不易被后续内容淹没。

---

## 方式二：全局记忆 / 全局配置（一次配置，所有项目生效）

写入 AI 工具的全局记忆或全局 AGENTS，内容为：

```markdown
做开发（前端 Vue 3 / 小程序，后端 PHP / Go）时，必须先读取外部规范库并遵循：
库根 = C:\Users\HKX\Desktop\AI-Operating-System-v4.0
必读入口 = 库根/README.md → 库根/common/rules/constitution.md
        → 库根/common/principles.md → 库根/common/protocol/task-boundary.md
库内裸路径（common/xxx.md、frontend/xxx.md、backend/xxx.md 等）相对库根解析，不是业务项目根。
按 README「加载策略」按需读取其余文件，禁止全量通读。
```

本机已按此方式配置全局 `C:\Users\HKX\AGENTS.md`。

---

## 方式三：git submodule（团队共享 / 跨机器）

远程仓库：`https://git.yztiot.com/mystw/Frontend-AI-Operating-System.git`

在业务项目根执行：

```bash
git submodule add https://git.yztiot.com/mystw/Frontend-AI-Operating-System.git .ai-spec
git commit -m "chore: add spec as submodule"
```

此时 `<SPEC_ROOT>` = 业务项目内的 `.ai-spec`，把方式一的片段改为：

```markdown
## 开发规范（外部规范库，强制）

本项目的前端与后端开发**必须**遵循 `.ai-spec/` 下的规范库（git submodule）。
记作 `<SPEC_ROOT>` = `.ai-spec`。**写任何代码之前**，按顺序读完这四个文件，不得跳过：

1. `.ai-spec/README.md` —— 全局入口、路径基准、覆盖范围、加载策略
2. `.ai-spec/common/rules/constitution.md` —— 宪法
3. `.ai-spec/common/principles.md` —— 四条通用原则 + 极致解耦
4. `.ai-spec/common/protocol/task-boundary.md` —— 任务边界（授权面：只读/定向写/开放写）

库内裸路径相对 `.ai-spec/` 解析，首段必为 `common/`、`frontend/` 或 `backend/`，
读取时拼成 `.ai-spec/common/...` 形式。
其余文件按 README 的「加载策略」按需读取，禁止全量通读。
规范与本项目现有代码风格冲突时，按 `common/rules/constitution.md`「用户明确要求优先于本规范」先说明冲突再执行。
```

克隆业务项目的人需要额外执行 `git submodule update --init` 才能拿到规范。
优点是路径可移植、版本可锁定；代价是规范演化后各项目要手动 `git submodule update --remote` 同步。

---

## 方式四：对话里直接给路径（临时）

```
本次开发遵循 C:\Users\HKX\Desktop\AI-Operating-System-v4.0 的规范。
先读该目录 README.md 与 common/rules/constitution.md、common/principles.md、
common/protocol/task-boundary.md，再开始。
```

适用于一次性任务。不持久，换会话需重说。

---

## 接入后的正确加载流程

与 `<SPEC_ROOT>/README.md`「工作流」为同一流程（六步）：

1. **定位库根** —— 从上述任一入口拿到 `<SPEC_ROOT>` 绝对路径。
2. **读必读四件** —— README、`common/rules/constitution.md`、`common/principles.md`、
   `common/protocol/task-boundary.md`。
3. **定任务类型与授权面** —— 按 `common/protocol/task-analysis.md` 判定类型，
   按 `common/protocol/task-boundary.md` 确定授权面；Review / 答疑 / 诊断默认只读，只报告不改代码。
4. **判定技术栈并进入对应子树** —— 读业务项目的 `package.json` / `composer.json` / `go.mod`：
   - 前端 → `frontend/`，再读判定出的语言子树（`frontend/frameworks/vue3/` 或 `frontend/frameworks/miniprogram/`）→ 其 `ui/<组件库>/` 二级目录
   - 后端 → `backend/`，再读判定出的语言子树与其框架二级目录
   - 无对应目录时仅遵循 `common/` 通用规范，**不套用其他技术栈的规则**
5. **按需取用模式与决策** —— 遇决策点读 `frontend/protocol/decision-trees.md`，
   命中页面类型读 `frontend/patterns/`，拿不准写法读 `frontend/examples/golden/`。
6. **交付前验收** —— 过对应子树的自检清单（前端：`frontend/checklists/`）与 `common/protocol/final-gate.md`，
   构建 / 类型检查 / 测试实际执行。

**不要**在第 2 步之后就把规范库读完。README 的「加载策略」明确写着「禁止全量通读」，
预读十几个文件会长期占用上下文额度，且当时无法判定哪些真正会被用到。

---

## 常见接入错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写「遵循 XX 规范」不给绝对路径 | AI 找不到库，凭训练知识编一套"规范" | 必须给 `<SPEC_ROOT>` 绝对路径 |
| 写「优先读取 README.md」（裸路径） | 解析到业务项目自己的 README（讲装依赖的那个） | 写全 `<SPEC_ROOT>/README.md` |
| 把入口指向 `AGENTS.md` 就完事 | AGENTS 只是行为规则索引，通用原则/分层/模式全在别处，AI 以为读完了 | 入口必须是 README，它才有模块导航 |
| 让 AI「先通读规范库」 | 上下文被规范占满，真正写代码时额度不足 | 按 README 加载策略按需读 |
| 业务项目已有冲突的风格约定，未声明 | AI 静默取舍，两套规范混用 | 按 `common/rules/constitution.md`「用户明确要求优先于本规范」先说明冲突，由你决定优先级 |
| 路径只写到 `rules/xxx.md` 形式 | 三分结构下裸路径首段必须是 `common/`/`frontend/`/`backend/`，否则不可解析 | 写全 `common/rules/xxx.md` |

---

## 覆盖范围（接入前须知）

本库并非各技术栈均已完备，接入时按下表预期：

| 部分 | 状态 | 说明 |
|---|---|---|
| `common/` | **可用** | 宪法、四条通用原则、`common/rules/`、`common/protocol/`；与语言、框架、端无关，任何项目均适用 |
| `frontend/` | **可用** | `frontend/rules/`、`frontend/protocol/`、`frontend/patterns/`、`frontend/anti-patterns/`、`frontend/tasks/`、`frontend/checklists/`、`frontend/examples/`、`frontend/frameworks/vue3/`、`frontend/frameworks/miniprogram/` |
| `backend/` | **部分可用** | 导航入口与共用分层原则已建立（`backend/README.md`）；语言子树、`backend/tasks/` 与 `backend/checklists/` 待建 |

`backend/` 的语言子树尚未建立时，后端任务按 `common/` 通用规范与 `backend/README.md`
的共用分层原则执行；遇到框架专属决策点应提问而非自行发挥。

---

## 验证接入是否成功

让 AI 回答这五个问题，答不出说明没真正读到：

1. 宪法有几条，C5 与 C6 分别是什么？（应答：六条，C5 引用可验伪，C6 授权面）
2. 本库的三分结构是哪三棵树？（应答：`common/` 前后端通用、`frontend/` 前端专属、`backend/` 后端专属）
3. 引用本库无 ID 条款的合法形式是什么？（应答：文件路径 + 原文逐字摘录，禁止"第 N 节"式引用；
   例外是"编号小节例外"——判定式为
   `grep -nE "^#{2,4} *(P[1-4]|[0-9]+\.)" <目标文件>`，被引编号须在命中结果中）
4. 极致解耦的判定方式是什么？（应答：把单元搬到另一个宿主，不改内部代码能否直接工作）
5. 让你 Review 一段代码，你发现一个明显笔误，改不改？
   （应答：不改。Review 是只读档，写进报告由用户决定；见 `common/protocol/task-boundary.md`）

答案含"第 N 节"式引用或凭空条款，即为未接入成功或违反 C5。
第 5 题答"顺手改掉"即为未读 C6。
