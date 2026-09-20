# Refactor 任务

结构调整、不改行为的优化（任务类型判定见 `common/protocol/task-analysis.md`）。

## 授权面：定向写，行为不变（C6）

只写已列明的文件，加上真实调用链上被迫改的文件（见 `common/protocol/task-boundary.md`「只写已列明的文件，加上真实调用链上被迫改的文件」）。
重构目标之外的文件不动；整体重构需用户明确授权升档（见 `common/protocol/task-boundary.md`「升档必须由用户明确表示，不能由 AI 自行推断」）。

不夹带功能改动（见 `common/protocol/task-boundary.md`「不夹带功能改动」）。
加东西前先过消费者四问（C6）：
「用户要求了吗？」「不做它，当前需求能否成立？」
「哪一段可达的代码、数据、接口、验收条件会消费它？」「省掉它，当前验收会失败吗？」
判据见 `common/protocol/task-boundary.md`「四问全否 → 不实现，可作为建议报告」。

降档见 `common/protocol/task-boundary.md`「降档不需要授权」：把待写动作改成「报告并等待」。

## 流程：目标→基线→小步→回归

1. 目标：明确重构目标（结构/命名/拆分），一次重构只做一件事。
2. 基线：先补跑测试建基线，记录行为基线口径。
3. 小步：小步重构，保持行为不变，每步可回滚。
4. 回归：对照基线口径回归验证；重跑须有理由，见 `common/protocol/task-boundary.md`「改动后需重验、上次执行环境不同」。

## 规则

- 不夹带功能改动；每步可回滚。
- 四类越界（范围外扩 / 无消费者产物 / 意图越界 / 重复取证）的判据见 `common/protocol/task-boundary.md`。
- 引用规范条款前打开原文核对（C5）：见 `common/rules/constitution.md`「文件路径 + 原文逐字摘录」。
- 报"规范未覆盖"须附检索命令与空结果（C5）：见 `common/rules/constitution.md`「附检索命令与空结果」。
- 同一事实取证一次即止，不重复检索与重跑（C6）：见 `common/protocol/task-boundary.md`「同一事实已有足够证据，仍反复检索、重读、重跑、重审」。
- 首次写出的代码必须符合项目风格，写对一次（B3）：见业务项目根 `AGENTS.md`「禁止每写完一个文件就执行 prettier、eslint --fix 等格式化命令」。
- 验证类条目不可跳过：见 `frontend/checklists/detailed-check.md`「验证类条目不可用"不适用"跳过」；执行不了按 `common/protocol/final-gate.md`「无法验证时的处理」声明。

## 输出模板

### 范围/边界
- 授权面声明（定向写，行为不变）：
- 重构目标与非目标（目标外文件不动）：

### 验收标准/基线口径
- 重构动机与预期收益：
- 行为基线（测试/验收口径，回归对照用）：

### 文件变更清单
- 改动点清单（每步可回滚）：
- 明确未改动的目标外文件：

### 验证清单（命令示例按项目实际取用，记录命令本身与结果摘录）
- [ ] 构建：`pnpm build`（结果粘贴：<通过/失败摘录>，或标未执行）
- [ ] 类型检查：`vue-tsc --noEmit`（结果粘贴：<通过/失败摘录>，或标未执行）
- [ ] 测试（基线口径回归，行为不变）：`vitest run <范围，如 src/logic/xxx.test.ts> --coverage=false`（结果粘贴：<通过数/失败摘录>，或标未执行）
- [ ] 无夹带功能改动
- 未验证项按 `common/protocol/final-gate.md`「无法验证时的处理」声明，格式见该文件「声明模板」；见该文件「不以"读代码没问题"替代执行」。

#### 填写示例
- [x] 构建：`pnpm build` → 通过（`✓ built in 12.3s`）。
- [x] 类型检查：`vue-tsc --noEmit` → 通过（无输出）。
- [x] 测试：`vitest run src/logic/price.test.ts --coverage=false` → 通过（`9 passed`，摘录粘贴）。
- 未执行示例按 `common/protocol/final-gate.md`「声明模板」填，不写"读代码没问题"。

### 报告
- 未做的顺手优化与建议：
- 已读规范文件与触发依据：
