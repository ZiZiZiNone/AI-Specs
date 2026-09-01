# 接入外部项目

本规范库不拷贝进业务项目，只被业务项目**引用**。以下方式任选，可叠加。

`<SPEC_ROOT>` 指规范库根目录，取值随部署方式变化：

| 部署方式 | `<SPEC_ROOT>` 取值 | 适用 |
|---|---|---|
| 本机固定路径 | `C:\Users\HKX\Desktop\Frontend-AI-Operating-System-v3.0-Final-1` | 单机多项目共用，改规范立即生效 |
| git submodule | 业务项目内 `.ai-spec` | 团队共享、跨机器、版本可锁 |

移动规范库或换机器后，把下文所有 `<SPEC_ROOT>` 替换为新取值。

---

## 方式一：业务项目的 AGENTS.md（推荐，作用域最准）

在业务项目根的 `AGENTS.md`（或 `CLAUDE.md`）**顶部**粘贴：

```markdown
## 前端开发规范（外部规范库，强制）

本项目的前端开发**必须**遵循外部规范库，库根绝对路径：

    C:\Users\HKX\Desktop\Frontend-AI-Operating-System-v3.0-Final-1

记作 `<SPEC_ROOT>`。**写任何前端代码之前**，按顺序读完这三个文件，不得跳过：

1. `<SPEC_ROOT>/README.md` —— 全局入口、模块导航、加载策略
2. `<SPEC_ROOT>/rules/constitution.md` —— 宪法 C1-C5
3. `<SPEC_ROOT>/rules/core-principles.md` —— 四大核心原则

规范库内所有形如 `rules/xxx.md` 的路径**相对 `<SPEC_ROOT>` 解析**，
读取时拼成 `<SPEC_ROOT>/rules/xxx.md`。其余文件按 README 的「加载策略」按需读取，
禁止全量通读。

规范与本项目现有代码风格冲突时，按 C2 先说明冲突再执行，不得自行取舍。
```

为什么放顶部：AGENTS.md 由工具自动注入上下文，越靠前越不易被后续内容淹没。

---

## 方式二：全局记忆 / 全局配置（一次配置，所有项目生效）

写入 AI 工具的全局记忆或全局 AGENTS，内容为：

```markdown
做前端开发（Vue 3 / React / 小程序）时，必须先读取外部规范库并遵循：
库根 = C:\Users\HKX\Desktop\Frontend-AI-Operating-System-v3.0-Final-1
必读入口 = 库根/README.md → 库根/rules/constitution.md → 库根/rules/core-principles.md
库内裸路径（rules/xxx.md 等）相对库根解析，不是业务项目根。
按 README「加载策略」按需读取其余文件，禁止全量通读。
```

适用于不想逐项目配置的场景。代价是对非前端项目也会触发，建议保留「做前端开发时」的条件前缀。

---

## 方式三：git submodule（团队共享 / 跨机器）

远程仓库：`https://git.yztiot.com/mystw/Frontend-AI-Operating-System.git`

在业务项目根执行：

```bash
git submodule add https://git.yztiot.com/mystw/Frontend-AI-Operating-System.git .ai-spec
git commit -m "chore: add frontend spec as submodule"
```

此时 `<SPEC_ROOT>` = 业务项目内的 `.ai-spec`，把方式一的片段改为：

```markdown
## 前端开发规范（外部规范库，强制）

本项目的前端开发**必须**遵循 `.ai-spec/` 下的规范库（git submodule）。记作 `<SPEC_ROOT>` = `.ai-spec`。
**写任何前端代码之前**，按顺序读完这三个文件，不得跳过：

1. `.ai-spec/README.md` —— 全局入口、模块导航、加载策略
2. `.ai-spec/rules/constitution.md` —— 宪法 C1-C5
3. `.ai-spec/rules/core-principles.md` —— 四大核心原则

规范库内所有形如 `rules/xxx.md` 的路径**相对 `.ai-spec/` 解析**，读取时拼成 `.ai-spec/rules/xxx.md`。
其余文件按 README 的「加载策略」按需读取，禁止全量通读。
规范与本项目现有代码风格冲突时，按 C2 先说明冲突再执行。
```

克隆业务项目的人需要额外执行 `git submodule update --init` 才能拿到规范。
优点是路径可移植、版本可锁定；代价是规范演化后各项目要手动 `git submodule update --remote` 同步。

---

## 方式四：对话里直接给路径（临时）

```
本次开发遵循 C:\Users\HKX\Desktop\Frontend-AI-Operating-System-v3.0-Final-1 的规范。
先读该目录 README.md 与 rules/constitution.md、rules/core-principles.md，再开始。
```

适用于一次性任务。不持久，换会话需重说。

---

## 接入后的正确加载流程

AI 在业务项目中应当这样走：

1. **定位库根** —— 从上述任一入口拿到 `<SPEC_ROOT>` 绝对路径。
2. **读必读三件** —— README、constitution、core-principles。此时只花约 22KB 上下文。
3. **判定框架** —— 读业务项目的 `package.json` 判定 vue3 / react / 小程序，
   再读 `<SPEC_ROOT>/frameworks/<框架>/`；无对应目录时仅遵循通用规范，不套用其他框架规则。
4. **按需取用** —— 遇决策点读 `<SPEC_ROOT>/protocol/decision-trees.md`，
   命中页面类型读 `<SPEC_ROOT>/patterns/`，拿不准写法读 `<SPEC_ROOT>/examples/golden/`。
5. **交付前** —— 过 `<SPEC_ROOT>/checklists/detailed-check.md` 与
   `<SPEC_ROOT>/protocol/final-gate.md`，构建/类型检查/测试实际执行。

**不要**在第 2 步就把规范库读完。README 的「加载策略」明确写着「不要全量通读：按需加载即可」，
预读十几个文件会长期占用上下文额度，且当时无法判定哪些真正会被用到。

---

## 常见接入错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 只写「遵循 XX 规范」不给绝对路径 | AI 找不到库，凭训练知识编一套"前端规范" | 必须给 `<SPEC_ROOT>` 绝对路径 |
| 写「优先读取 README.md」（裸路径） | 解析到业务项目自己的 README（讲装依赖的那个） | 写全 `<SPEC_ROOT>/README.md` |
| 把入口指向 `AGENTS.md` 就完事 | AGENTS 只是行为规则索引，四大原则/分层/模式全在别处，AI 以为读完了 | 入口必须是 README，它才有模块导航 |
| 让 AI「先通读规范库」 | 上下文被约 222KB 规范占满，真正写代码时额度不足 | 按 README 加载策略按需读 |
| 业务项目已有冲突的风格约定，未声明 | AI 静默取舍，两套规范混用 | 按 C2 先说明冲突，由你决定优先级 |

---

## 覆盖范围（接入前须知）

本库并非各框架均已完备，接入时按下表预期：

| 部分 | 状态 | 说明 |
|---|---|---|
| 通用规范（rules / protocol / patterns / anti-patterns / checklists / tasks / examples） | **可用**，46 个文件约 163KB | 框架无关，任何前端项目均适用 |
| `frameworks/vue3/` | **可用**，9 个文件约 37KB | 含 reactivity / composable / component / testing / `ui/arco/` |
| `frameworks/react/` | **骨架**，3 个文件约 1KB | 仅 hook.md + state.md 骨架，`ui/` 为空 |
| `frameworks/miniprogram/` | **待补**，约 0.3KB | 仅占位 |

React / 小程序项目接入后，通用规范全部生效，但框架层无细则——
按 README 工作流第 1 步「无对应目录时仅遵循通用规范，不套用其他框架规则」处理，
遇到框架专属决策点时应提问而非自行发挥（C1）。

---

## 验证接入是否成功

让 AI 回答这三个问题，答不出说明没真正读到：

1. 宪法有几条，C5 是什么？（应答：五条，C5 引用可验伪）
2. 实现顺序是什么？（应答：Pattern→State→Logic→Service→UI）
3. 引用本库无 ID 条款的合法形式是什么？（应答：文件路径 + 原文逐字摘录，禁止"第 N 节"式引用）

答案含"第 N 节"式引用或凭空条款，即为未接入成功或违反 C5。
