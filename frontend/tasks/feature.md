# Feature 任务

新功能、新页面、新模块的增量交付（任务类型判定见 `common/protocol/task-analysis.md`）。

## 授权面：开放写，限需求范围（COM-012）

默认开放写：在需求描述的范围内新建与修改（见 `common/protocol/task-boundary.md`「在需求描述的范围内新建与修改」）。

需求没提的字段、抽象、开关、兼容分支，先过消费者四问（COM-012）：
「用户要求了吗？」「不做它，当前需求能否成立？」
「哪一段可达的代码、数据、接口、验收条件会消费它？」「省掉它，当前验收会失败吗？」

判据见 `common/protocol/task-boundary.md`「四问全否 → 不实现，可作为建议报告」：
「只能说出「以后可能有用」「更健壮」→ 视同全否」时不写，改为在交付里报告。

升档见 `common/protocol/task-boundary.md`「升档必须由用户明确表示，不能由 AI 自行推断」。
降档见 `common/protocol/task-boundary.md`「降档不需要授权」：把待写动作改成「报告并等待」。
拿不准见 `common/protocol/task-boundary.md`「拿不准就是只读档，不是开放写档」。

## 流程：需求→设计→实现→检查

1. 需求：读取并确认需求，补齐缺失项；信息不足先确认，不带猜测实现（COM-007）。
2. 设计：判断 pattern，确定 State/Logic/Service 结构。
3. 实现：按 Pattern→State→Logic→Service→UI 落地。
4. 检查：先做 `frontend/checklists/detailed-check.md`「适用性判定」，再过自检清单并实际验证。

## 规则

- 不做需求外的功能（YAGNI）。判定用四问，不用感觉。
- 四类越界（范围外扩 / 无消费者产物 / 意图越界 / 重复取证）的判据见 `common/protocol/task-boundary.md`。
- 引用规范条款前打开原文核对（COM-011）：见 `common/rules/constitution.md`「编号 + 文件路径 + 原文逐字摘录」。
- 报"规范未覆盖"须附检索命令与空结果（COM-011）：见 `common/rules/constitution.md`「附检索命令与空结果」。
- 同一事实取证一次即止，不重复检索与重跑（COM-012）：见 `common/protocol/task-boundary.md`「同一事实已有足够证据，仍反复检索、重读、重跑、重审」。
- 首次写出的代码必须符合项目风格，写对一次（FE-003）：见业务项目根 `AGENTS.md`「禁止每写完一个文件就执行 prettier、eslint --fix 等格式化命令」。
- 任务边界类条目无"不适用"情形：见 `frontend/checklists/detailed-check.md`「任务边界类条目同样不可跳过」。

## 输出模板

### 范围/边界
- 授权面声明（开放写，限需求范围）：
- 需求外候选项与四问结论（写/改为报告）：

### 验收标准/基线口径
- 目标：
- 验收标准（省掉即失败的口径）：

### 设计
- Pattern：
- State / Logic / Service：

### 文件变更清单
- 新建：
- 修改：

### 验证清单（命令示例按项目实际取用，记录命令本身与结果摘录）
- [ ] 构建：`pnpm build`（结果粘贴：<通过/失败摘录>，或标未执行）
- [ ] 类型检查：`vue-tsc --noEmit`（结果粘贴：<通过/失败摘录>，或标未执行）
- [ ] 测试：`vitest run <范围，如 src/logic/xxx.test.ts> --coverage=false`（结果粘贴：<通过数/失败摘录>，或标未执行）
- 未验证项按 `common/protocol/final-gate.md`「无法验证时的处理」声明，格式见该文件「声明模板」；见该文件「不以"读代码没问题"替代执行」。

#### 填写示例
- [x] 构建：`pnpm build` → 通过（`✓ built in 12.3s`）。
- [x] 类型检查：`vue-tsc --noEmit` → 通过（无输出）。
- [x] 测试：`vitest run src/logic/price.test.ts --coverage=false` → 通过（`9 passed`，摘录粘贴）。
- 未执行示例按 `common/protocol/final-gate.md`「声明模板」填，不写"读代码没问题"。

### 报告
- 未实现的需求外项与建议：
- 已读规范文件与触发依据：
