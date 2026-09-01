# Feature 任务

需求→设计→实现→检查。

## 流程
1. 需求：读取并确认需求，补齐缺失项。
2. 设计：判断 pattern，确定 State/Logic/Service 结构。
3. 实现：按 Pattern→State→Logic→Service→UI 落地。
4. 检查：过 self-check 清单，验证可运行。

## 规则
- 不做需求外的功能（YAGNI）。判定用四问，不用感觉：见 `protocol/task-boundary.md`「消费者判据」。
- 信息不足先确认，不带猜测实现。
- 授权面：开放写，但仅限需求描述的范围（C6）。需求没提的字段、抽象、开关、兼容分支，
  指不出消费者就不写，改为在交付里报告。

## 输出模板
### 需求
- 目标：
- 验收标准：
- 范围/边界：

### 设计
- Pattern：
- State：
- Logic：
- Service：

### 实现
- 文件/变更清单：

### 检查
- [ ] self-check 清单通过
- [ ] 已运行/已验证
